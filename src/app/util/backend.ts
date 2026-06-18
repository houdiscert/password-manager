import { computed, EnvironmentInjector, inject, Injectable, linkedSignal, Pipe, PipeTransform, Resource, Signal, signal, WritableSignal } from "@angular/core";
import { AccountRes, ApiAccess, DataRes, ListedData, Setting } from "./api-access";
import { Router } from "@angular/router";
import * as argon2 from "argon2-browser/dist/argon2-bundled.min.js";
import { HttpErrorResponse } from "@angular/common/http";
import { catchError, concatMap, from, Observable, of } from "rxjs";

/**
 * Data retrieved from a data source
 */
interface RetrievedData {
    error?: string,
    id: string,
    type: string,
    name: string,
    content: any
}

@Injectable({providedIn: 'root'})
export class Backend {
    private readonly apiAccess = inject(ApiAccess);
    private readonly router = inject(Router);
    private readonly environmentInjector = inject(EnvironmentInjector);

    private email = signal<string | null>(null);
    private name = signal<string | null>(null);
    private token?: string;
    private key?: CryptoKey;

    private dataSource: DataSource = DataSource.NONE;

    /**
     * Logs in a remote user to the password manager panel using an account
     * @param user 
     * @param password used to derive a key
     */
    async loginRemoteUser(user: AccountRes, password: string, onError: (err: string) => void) {
        try {
            this.email.set(user.email);
            this.name.set(user.name);
            this.token = user.token;

            // Derive a key
            let revPass = "";
            for (let i = 0; i < password.length; i++) {
                revPass += password[password.length - 1 - i];
            }
            const hash = await argon2.hash({
                pass: revPass,
                salt: password + revPass,
                type: argon2.ArgonType.Argon2id,
                time: 1,
                hashLen: 32,
                mem: 1024,
                parallelism: 1
            });
            this.key = await crypto.subtle.importKey("raw", hash.hash as Uint8Array<ArrayBuffer>, "AES-GCM", false, ['encrypt', 'decrypt']);
            // Session storage
            sessionStorage.setItem("email", user.email);
            sessionStorage.setItem("name", user.name);
            sessionStorage.setItem("token", user.token);
            sessionStorage.setItem("key", this.toBase64(hash.hash));
            // Data source
            this.dataSource = DataSource.API;
            // Route to passwords
            this.router.navigate(['/passwords']);
        } catch (e: any) {
            onError(typeof e.toString === 'function' ? e.toString() : 'Something went wrong');
        }
    }
    /**
     * Logs out the current user and redirects to the homepage
     */
    logout() {
        this.router.navigate(["/"]);
        this.email.set(null);
        this.name.set(null);
        this.token = undefined;
        this.key = undefined;
        this.dataSource = DataSource.NONE;
        sessionStorage.clear();
    }

    /**
     * Makes sure the user has a valid Backend session, redirecting them to the login page if not. Loads an existing session from session storage too, if one is stored.
     * @param completion A signal that is updated to `true` if the session is valid. If the session is invalid the user is automatically routed to a login page.
     */
    async validateSession(completion: WritableSignal<boolean>) {
        if (!sessionStorage) // ssg
            return;
        try {
            if (this.email() && this.name() && this.token && this.key) {
                completion.set(true);
                return;
            } else {
                const email = sessionStorage.getItem("email");
                const name = sessionStorage.getItem("name");
                const token = sessionStorage.getItem("token");
                const key = sessionStorage.getItem("key");
                if (email && name && token && key) {
                    const cryptoKey = await crypto.subtle.importKey("raw", this.fromBase64(key), "AES-GCM", false, ['encrypt', 'decrypt']);
                    this.email.set(email);
                    this.name.set(name);
                    this.token = token;
                    this.key = cryptoKey;
                    this.dataSource = DataSource.API;
                    completion.set(true);
                    return;
                }
            }
        } catch (e) {
            console.error("Error loading session state: ", e);
        }
        this.router.navigate(["/login"]);
    }

    // Common data encryption code used by a few of the below functions
    private async encryptData(content: Record<string, any>) {
        if (!this.key) {
            throw new Error("Missing key!");
        }
        // Encrypt the data
        let iv = crypto.getRandomValues(new Uint8Array(12));
        let encoder = new TextEncoder();
        let encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv: iv}, this.key, encoder.encode(JSON.stringify(content)));
        return JSON.stringify({iv: [...iv], e: this.toBase64(new Uint8Array(encrypted))});
    }

    /**
     * Stores a new piece of data. The data *contents* will be encrypted with the secret key before being stored. A component shouldn't allow this to be called before {@link validateSession the session is validated} (it will result in an exception).
     * @param type Data type
     * @param name Name associated with the data. Not encrypted but returned when listing data.
     * @param content Data contents
     */
    async addNewData(type: DataType, name: string, content: Record<string, any>): Promise<DataRes> {
        let encryptedContent = await this.encryptData(content);
        if (this.dataSource == DataSource.API && this.token) {
            // Use ApiAccess to store the data
            return await this.apiAccess.saveData(type, name, encryptedContent, this.token);
        } else {
            throw new Error("Invalid data source.");
        }
    }

    /**
     * Edits an existing piece of data. The data *contents* will be encrypted with the secret key before being stored. A component shouldn't allow this to be called before {@link validateSession the session is validated} (it will result in an exception).
     * @param id Id of the data being edited
     * @param name New name associated with the data. Not encrypted but returned when listing data.
     * @param content New data contents
     */
    async editData(id: string, name: string, content: Record<string, any>): Promise<DataRes> {
        let encryptedContent = await this.encryptData(content);
        if (this.dataSource == DataSource.API && this.token) {
            // Use ApiAccess to store the data
            return await this.apiAccess.editData(id, name, encryptedContent, this.token);
        } else {
            throw new Error("Invalid data source.");
        }
    }

    /**
     * Deletes a piece of data
     * @param id Data ID
     * @returns A promise that resolves to nothing if successful, and rejects with `{error: {error?: string}}` if an error occurs.
     * @throws {error: {error?: string}}
     */
    async deleteData(id: string) {
        if (this.dataSource == DataSource.API && this.token) {
            // Use ApiAccess to delete the data
            return await this.apiAccess.deleteData(id, this.token);
        } else {
            throw {error: {error: "Invalid data source."}};
        }
    }

    getEmail() {
        return this.email.asReadonly();
    }
    getName() {
        return this.name.asReadonly();
    }
    getData(): DataList {
        return new DataList(this.apiAccess);
    }
    fetchDataInto(dataList: DataList) {
        if (this.dataSource == DataSource.API && this.token) {
            dataList.fetchDataRemote(this.token);
        } else {
            throw Error("Invalid data source");
        }
    }
    getDataForId(id: string): Observable<RetrievedData> {
        if (this.dataSource == DataSource.API && this.token) {
            return this.apiAccess.getData(id, this.token).pipe(concatMap(res => {
                return from((async () => {
                    try {
                        const data = JSON.parse(res.content);
                        const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: new Uint8Array(data.iv)}, this.key!, this.fromBase64(data.e));
                        const decoder = new TextDecoder();
                        return {id: res.id, type: res.type, name: res.name, content: JSON.parse(decoder.decode(decrypted))};
                    } catch (e: any) {
                        throw new HttpErrorResponse({error: {error: e.message}, status: 1});
                    }
                })());
            }), catchError((err: HttpErrorResponse) => {
                let errStr: string;
                if (err.status == 0) {
                    errStr = "Something went wrong";
                } else {
                    errStr = err.error.error ?? "Something went wrong";
                }
                return of({error: errStr, id, type: "?", name: "?", content: {}});
            }));
        } else {
            throw Error("Invalid data source");
        }
    }

    /**
     * Gets a setting as a pair of signals, where one holds the value and one holds an error, if an error occured
     * @param name The name of the setting
     * @param def The default value returned by value() if there is no value yet, or an error occured
     * @returns An object of the form `{[name]Value: WritableSignal<Setting | [default type]>, [name]Error: Signal<string | undefined>}` where [name] is the `name` parameter's value, and [default type] is the `def` parameter's type. Neither signal will throw any error if read
     */
    getSettingSignals<TName extends string, TDefault = undefined>(name: TName, def?: TDefault): SettingSignals<TName, TDefault> {
        if (this.dataSource == DataSource.API && this.token) {
            const resource = this.apiAccess.getSettingSignal(this.token, name);
            return {[name + "Value"]: linkedSignal(() => resource.hasValue() ? resource.value() : def), [name + "Error"]: computed(() => this.processError(resource.error() as HttpErrorResponse | undefined))} as SettingSignals<TName, TDefault>;
        } else {
            throw Error("Invalid data source");
        }
    }
    /**
     * Gets the value of a setting
     * @param name The name of the setting
     * @returns A promise that will resolve to the value of the setting or reject with a string detailing an error, if an error occured.
     */
    async getSettingValue(name: string) {
        if (this.dataSource == DataSource.API && this.token) {
            try {
                return await this.apiAccess.getSettingValue(this.token, name);
            } catch (e: any) {
                throw this.processError(e);
            }
        } else {
            throw Error("Invalid data source");
        }
    }

    // Private helpers
    private toBase64(data: Uint8Array): string {
        if ((Uint8Array.prototype as any).toBase64) { // Has new API
            return (data as any).toBase64();
        } else { // Use legacy btoa
            return btoa(String.fromCharCode(...data));
        }
    }
    private fromBase64(base64: string): Uint8Array<ArrayBuffer> {
        if ((Uint8Array as any).fromBase64) { // Has new API
            return (Uint8Array as any).fromBase64(base64);
        } else { // Use legacy atob
            return new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
        }
    }
    private processError(error: HttpErrorResponse | undefined): string | undefined {
        if (error) {
            if (error.status == 0) {
                return "Something went wrong"
            } else {
                return error.error?.error ?? "Something went wrong";
            }
        } else {
            return undefined;
        }
    }
}

// Types
enum DataSource {
    API,
    LOCAL,
    NONE
}
type DataType = "password" | "code";
class DataList {
    private listedData: Resource<ListedData[] | undefined>;
    private tokenSignal = signal<string | null>(null);
    constructor(apiAccess: ApiAccess) {
        this.listedData = apiAccess.listData(this.tokenSignal);
    }

    /**
     * Gets a signal representing the user's data. Empty until the data is fetched via {@link Backend.fetchDataInto}.
     */
    getData() {
        return this.listedData.hasValue() ? this.listedData.value : signal([]);
    }
    fetchDataRemote(token: string) {
        this.tokenSignal.set(token);
    }
}

@Pipe({
    name: "getdata"
})
export class DataPipe implements PipeTransform {
    private readonly backend = inject(Backend);
    private readonly environmentInjector = inject(EnvironmentInjector);

    transform(id: string) {
        return this.backend.getDataForId(id);
    }
}

type SettingSignals<TName extends string, TDefault> = {[key in `${TName}Value`]: WritableSignal<Setting | TDefault>} & {[key in `${TName}Error`]: Signal<string | undefined>};