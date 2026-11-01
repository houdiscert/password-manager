/*
    Password Manager is a simple password manager and TOTP web-app.
    Copyright (C) 2026 houdert6 & vqlesoft

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { computed, DestroyRef, EnvironmentInjector, inject, Injectable, linkedSignal, Pipe, PipeTransform, Resource, Signal, signal, WritableSignal } from "@angular/core";
import { AccountRes, ApiAccess, DataRes, ListedData, Setting } from "./api-access";
import { Router } from "@angular/router";
import * as argon2 from "argon2-browser/dist/argon2-bundled.min.js";
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { catchError, concatMap, from, Observable, of, ReplaySubject, tap } from "rxjs";
import { SettingsStore } from "./app-settings";
import { LightDarkInfo } from "../widgets/light-dark.service";

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

interface LocalStorageSession {
    email: string,
    name: string,
    token: string,
    key: string
}

const LOCAL_DB_VERSION = 1;

@Injectable({providedIn: 'root'})
export class Backend {
    private readonly apiAccess = inject(ApiAccess);
    private readonly router = inject(Router);
    private readonly localSettings = inject(SettingsStore);
    /**
     * Used for updating the app theme to the value the user has saved as a setting, when the user is logging in
     */
    private readonly appTheme = inject(LightDarkInfo);

    private email = signal<string | null>(null);
    private name = signal<string | null>(null);
    token: WritableSignal<string | null> = signal<string | null>(null);
    private key?: CryptoKey;

    private dataSource = signal(DataSource.NONE);
    /**
     * `true` if the data source is {@link DataSource.API}
     */
    isRemote = computed(() => this.dataSource() == DataSource.API);

    private initialStorageType: InitialStorageType = InitialStorageType.NONE;

    private readonly _sessionExpired = signal(false);
    /**
     * Set to true if the currently logged in session is detected to be expired, which can happen during any remote request. The expired state is cleared if a new remote session is established or the user is logged out.
     */
    readonly sessionExpired = this._sessionExpired.asReadonly();

    private readonly sessionChangeSubscriptions: (() => void)[] = [];

    private localDB: IDBDatabase | undefined;

    /**
     * Logs in a remote user to the password manager panel using an account
     * @param user 
     * @param password used to derive a key
     * @param onError callback for errors (this function's returned promise doesn't reject for some reason)
     * @param routeToPasswords whether to route to the passwords list after a successful login
     */
    async loginRemoteUser(user: AccountRes, password: string, onError: (err: string) => void, routeToPasswords: boolean = true) {
        try {
            this.email.set(user.email);
            this.name.set(user.name);
            this.token.set(user.token);

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
            // Data source
            this.dataSource.set(DataSource.API); // Define this now so getSettingValue can be used below
            // Storage
            let storageSetting: Setting;
            try {
                storageSetting = await this.getSettingValue("storage"); // Usable since token and data source are defined above this
            } catch (e) {
                storageSetting = {value: "session"};
            }
            if (storageSetting.value !== 'none' && storageSetting.value !== 'local') {
                // Session storage default
                sessionStorage.setItem("email", user.email);
                sessionStorage.setItem("name", user.name);
                sessionStorage.setItem("token", user.token);
                sessionStorage.setItem("key", this.toBase64(hash.hash));
                this.initialStorageType = InitialStorageType.SESSION;
            } else if (storageSetting.value === 'local') {
                // Local storage option
                this.localSettings.setSetting("remoteSession", {email: user.email, name: user.name, token: user.token, key: this.toBase64(hash.hash)});
                this.initialStorageType = InitialStorageType.LOCAL;
            }
            // Theme
            this.setLoginAppTheme();
            // Disable session expiry
            this._sessionExpired.set(false);
            // Notify interested listeners of a change in session
            for (const listener of this.sessionChangeSubscriptions) {
                listener();
            }
            // Route to passwords
            if (routeToPasswords) {
                this.router.navigate(['/passwords']);
            }
        } catch (e: any) {
            onError(typeof e.toString === 'function' ? e.toString() : 'Something went wrong');
        }
    }

    /**
     * Logs a user into the password manager with a local password
     * @param password The local password. Only stored if no local user exists yet, not validated for existing local users by this method
     */
    async loginLocalUser(password: string) {
        // Hash the password so that it can be stored as a setting and verified later so the user doesn't just end up with invalid data and need to relog if they enter an invalid password by mistake
        const userSanityHash = await argon2.hash({
            pass: password,
            salt: password + password,
            type: argon2.ArgonType.Argon2id,
            time: 1,
            hashLen: 32,
            mem: 1024,
            parallelism: 1
        });

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

        // Load the local db if it wasn't already loaded earlier
        if (!this.localDB) {
            this.localDB = await new Promise<IDBDatabase>((res, rej) => {
                const req = indexedDB.open("localPasswords", LOCAL_DB_VERSION);
                req.addEventListener('upgradeneeded', event => {
                    if (event.oldVersion == 0) {
                        // db is being created
                        req.result.createObjectStore("data", {autoIncrement: true});
                        const settingsStore = req.result.createObjectStore("settings", {keyPath: "name"});
                        settingsStore.add({name: "localpass", value: userSanityHash.encoded}); // Store the password
                    }
                });
                req.addEventListener('success', () => {
                    res(req.result);
                });
                req.addEventListener('error', () => {
                    rej(req.error);
                });
            });
        }

        // Set this.key
        this.key = await crypto.subtle.importKey("raw", hash.hash as Uint8Array<ArrayBuffer>, "AES-GCM", false, ['encrypt', 'decrypt']);
        // Data Source
        this.dataSource.set(DataSource.LOCAL);
        // Storage
        let storageSetting: Setting;
        try {
            storageSetting = await this.getSettingValue("storage"); // Usable since token and data source are defined above this
        } catch (e) {
            storageSetting = {value: "session"};
        }
        if (storageSetting.value !== 'none') {
            sessionStorage.setItem("localKey", this.toBase64(hash.hash));
        }
        // Theme
        this.setLoginAppTheme();
        // Disable session expiry (though this should be disabled anyway)
        this._sessionExpired.set(false);
        // Route to passwords
        this.router.navigate(['/passwords']);
    }

    /**
     * Checks that the given password is the valid local password for locally stored passwords
     * @returns `true` if the given local password is valid, or if there is no local database set up yet
     */
    async validateLocalPassword(password: string) {
        if (await this.openDBIfExists()) {
            // Validate the password with what's stored
            return await new Promise<boolean>((res, rej) => {
                const transaction = this.localDB!.transaction("settings", "readonly");
                const settingsStore = transaction.objectStore("settings");
                const req = settingsStore.get("localpass");
                req.onsuccess = () => {
                    if (!req.result)
                        {rej(new Error("failed to fetch local password"));return;}
                    argon2.verify({
                        encoded: req.result.value,
                        pass: password,
                        type: argon2.ArgonType.Argon2id
                    }).then(() => res(true)).catch(() => res(false));
                }
                req.onerror = () => rej(req.error);
            });
        } else {
            return true; // Any password is valid when no local db exists yet :)
        }
    }

    /**
     * Logs out the current user and redirects to the homepage
     */
    logout() {
        this.router.navigate(["/"]);
        this.email.set(null);
        this.name.set(null);
        this.token.set(null);
        this.key = undefined;
        this.dataSource.set(DataSource.NONE);
        this.initialStorageType = InitialStorageType.NONE;
        sessionStorage.clear();
        this.localSettings.setSetting("remoteSession", undefined);
        this._sessionExpired.set(false);
        if (this.localDB) {
            this.localDB.close();
            this.localDB = undefined;
        }
    }

    /**
     * Makes sure the user has a valid Backend session, redirecting them to the login page if not. Loads an existing session from session storage too, if one is stored.
     * @param completion A signal that is updated to `true` if the session is valid. If the session is invalid the user is automatically routed to a login page.
     */
    async validateSession(completion: WritableSignal<boolean>) {
        if (!sessionStorage) // ssg
            return;
        try {
            if (this.email() && this.name() && this.key) {
                completion.set(true);
                return;
            } else {
                const email = sessionStorage.getItem("email");
                const name = sessionStorage.getItem("name");
                const token = sessionStorage.getItem("token");
                const key = sessionStorage.getItem("key");
                const localKey = sessionStorage.getItem("localKey");
                if (email && name && token && key) {
                    const cryptoKey = await crypto.subtle.importKey("raw", this.fromBase64(key), "AES-GCM", false, ['encrypt', 'decrypt']);
                    this.email.set(email);
                    this.name.set(name);
                    this.token.set(token);
                    this.key = cryptoKey;
                    this.dataSource.set(DataSource.API);
                    this.initialStorageType = InitialStorageType.SESSION;
                    completion.set(true);
                    return;
                } else if (localKey) {
                    const cryptoKey = await crypto.subtle.importKey("raw", this.fromBase64(localKey), "AES-GCM", false, ['encrypt', 'decrypt']);
                    this.key = cryptoKey;
                    this.dataSource.set(DataSource.LOCAL);
                    completion.set(true);
                    return;
                } else {
                    const localStorageSession: LocalStorageSession | {} = this.localSettings.getSetting("remoteSession", {} as LocalStorageSession | {});
                    if ('email' in localStorageSession && 'name' in localStorageSession && 'token' in localStorageSession && 'key' in localStorageSession) {
                        const cryptoKey = await crypto.subtle.importKey("raw", this.fromBase64(localStorageSession.key), "AES-GCM", false, ['encrypt', 'decrypt']);
                        this.email.set(localStorageSession.email);
                        this.name.set(localStorageSession.name);
                        this.token.set(localStorageSession.token);
                        this.key = cryptoKey;
                        this.dataSource.set(DataSource.API);
                        this.initialStorageType = InitialStorageType.LOCAL;
                        completion.set(true);
                        return;
                    }
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
        if (this.checkRemote()) {
            return await this.apiAccess.saveData(type, name, encryptedContent, this.token());
        } else if (this.dataSource() == DataSource.LOCAL && await this.openDBIfExists()) {
            return await new Promise<DataRes>((res, rej) => {
                const transaction = this.localDB!.transaction("data", "readwrite");
                const dataStore = transaction.objectStore("data");
                const req = dataStore.add({type, name, encryptedContent});
                req.onsuccess = () => {
                    if (!req.result)
                        {rej(new Error("failed to add data"));return;}
                    res({id: req.result.toString(), type: type, name: name, content: encryptedContent})
                };
                req.onerror = () => rej({error: {error: req.error?.toString()}});
            });
        } {
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
        if (this.checkRemote()) {
            // Use ApiAccess to store the data
            return await this.apiAccess.editData(id, name, encryptedContent, this.token());
        } else if (this.dataSource() == DataSource.LOCAL && await this.openDBIfExists()) {
            return await new Promise<DataRes>((res, rej) => {
                const transaction = this.localDB!.transaction("data", "readwrite");
                const dataStore = transaction.objectStore("data");
                const key = parseInt(id);
                const readReq = dataStore.get(key);
                readReq.onsuccess = () => {
                    if (!readReq.result)
                        {rej(new Error("failed to fetch data to edit"));return;}
                    const type = readReq.result.type;
                    const req = dataStore.put({type, name, encryptedContent}, key);
                    req.onsuccess = () => res({id: req.result.toString(), type: type, name: name, content: encryptedContent});
                    req.onerror = () => rej({error: {error: req.error?.toString()}});
                };
                readReq.onerror = () => rej({error: {error: readReq.error?.toString()}});
            });
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
    deleteData(id: string) {
        if (this.checkRemote()) {
            // Use ApiAccess to delete the data
            return this.apiAccess.deleteData(id, this.token());
        } else if (this.dataSource() == DataSource.LOCAL) {
            return new Promise<void>((res, rej) => {
                this.openDBIfExists().then(() => {
                    const transaction = this.localDB!.transaction("data", "readwrite");
                    const dataStore = transaction.objectStore("data");
                    const req = dataStore.delete(parseInt(id));
                    req.onsuccess = () => res();
                    req.onerror = () => rej();
                }, () => rej({error: {error: "Failed to open local db"}}));
            });
        } else {
            throw {error: {error: "Invalid data source."}};
        }
    }

    /**
     * A read-only signal containing a logged in remote user's email (if a user is logged in)
     */
    getEmail() {
        return this.email.asReadonly();
    }
    /**
     * A read-only signal containing a logged in remote user's name (if a user is logged in)
     */
    getName() {
        return this.name.asReadonly();
    }
    /**
     * Gets a signal containing a list of the user's data. May be called by a component prior to session validation, in which case the data is simply just automatically populated after session validation.
     */
    getData(): Signal<ListedData[]> {
        const resource = this.apiAccess.listData(this.token);
        const res = linkedSignal(() => {
            if (this.dataSource() == DataSource.API) {
                return resource.hasValue() ? resource.value() : [];
            } else if (this.dataSource() == DataSource.LOCAL) {
                this.openDBIfExists().then(success => {
                    if (!success) {
                        throw Error("Failed to open DB");
                    }
                    const transaction = this.localDB!.transaction("data", "readonly");
                    const dataStore = transaction.objectStore("data");
                    const req = dataStore.getAllKeys();
                    req.onsuccess = async () => res.set(await Promise.all(req.result.map(key => {
                        return new Promise<ListedData>((res, rej) => {
                            const infoReq = dataStore.get(key);
                            infoReq.onsuccess = () => {
                                if (!infoReq.result)
                                    {rej(new Error("failed to fetch a piece of data"));return;}
                                res({id: key.toString(), type: infoReq.result.type, name: infoReq.result.name})
                            };
                            infoReq.onerror = () => rej(infoReq.error?.toString());
                        });
                    })));
                });
                return [];
            } else {
                return [];
            }
        });
        return res.asReadonly();
    }
    /**
     * Fetches a specific piece of the user's data by id. The content of the data is decrypted by this method
     * @param id The id of the data to fetch
     * @returns An `Observable` that emits the retrieved data
     */
    getDataForId(id: string): Observable<RetrievedData> {
        if (this.checkRemote()) {
            return this.apiAccess.getData(id, this.token()).pipe(concatMap(res => {
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
        } else if (this.dataSource() == DataSource.LOCAL) {
            const sub = new ReplaySubject<RetrievedData>(1); // The data will just be emitted via a ReplaySubject for local data
            this.openDBIfExists().then(success => {
                if (!success) {
                    sub.next({error: "Failed to open DB", id, type: "?", name: "?", content: {}});
                    return;
                }
                try {
                    const transaction = this.localDB!.transaction("data", "readonly");
                    const dataStore = transaction.objectStore("data");
                    const req = dataStore.get(parseInt(id));
                    req.onsuccess = async () => {
                        try {
                            const data = JSON.parse(req.result.encryptedContent);
                            const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv: new Uint8Array(data.iv)}, this.key!, this.fromBase64(data.e));
                            const decoder = new TextDecoder();
                            sub.next({id, type: req.result.type, name: req.result.name, content: JSON.parse(decoder.decode(decrypted))});
                        } catch (e: any) {
                            sub.next({error: e && e.toString && e.toString(), id, type: "?", name: "?", content: {}});
                        }
                    }
                    req.onerror = () => sub.next({error: req.error?.toString(), id, type: "?", name: "?", content: {}});
                } catch (e: any) {
                    sub.next({error: e && e.toString && e.toString(), id, type: "?", name: "?", content: {}});
                }
            })
            return sub.asObservable();
        } else {
            throw Error("Invalid data source");
        }
    }

    /**
     * Gets a setting as a pair of signals, where one holds the value and one holds an error, if an error occured. If the error was caused due to an expired/invalid remote session token and the user relogs in the session modal, the http request will automatically be reattempted and the returned signal will automatically be updated
     * @param name The name of the setting
     * @param def The default value returned by value() if there is no value yet, or an error occured
     * @returns An object of the form `{[name]Value: WritableSignal<Setting | [default type]>, [name]Error: Signal<string | undefined>}` where [name] is the `name` parameter's value, and [default type] is the `def` parameter's type. Neither signal will throw any error if read
     */
    getSettingSignals<TName extends string, TDefault = undefined>(name: TName, def?: TDefault): SettingSignals<TName, TDefault> {
        if (this.checkRemote()) {
            const resource = this.apiAccess.getSettingSignal(this.token, name);
            return {[name + "Value"]: linkedSignal(() => resource.hasValue() ? resource.value() : def), [name + "Error"]: computed(() => this.processError(resource.error() as HttpErrorResponse | undefined))} as SettingSignals<TName, TDefault>;
        } else if (this.dataSource() == DataSource.LOCAL) {
            const valueSignal = signal<Setting | TDefault>(def!);
            const errorSignal = signal<string | undefined>(undefined);
            this.openDBIfExists().then(success => {
                if (!success) {
                    errorSignal.set("Failed to open DB");
                    return;
                }
                const transaction = this.localDB!.transaction("settings", "readonly");
                const settingStore = transaction.objectStore("settings");
                const req = settingStore.get(name);
                req.onsuccess = () => {
                    if (!req.result)
                        {errorSignal.set("failed to fetch settings");return;};
                    valueSignal.set({value: req.result.value})
                };
                req.onerror = () => errorSignal.set(req.error?.toString());
            });
            return {[name + "Value"]: valueSignal, [name + "Error"]: errorSignal.asReadonly()} as SettingSignals<TName, TDefault>;
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
        if (this.checkRemote()) {
            try {
                return await this.apiAccess.getSettingValue(this.token(), name);
            } catch (e: any) {
                throw this.processError(e);
            }
        } else if (this.dataSource() == DataSource.LOCAL) {
            return await new Promise<Setting>((res, rej) => {
                this.openDBIfExists().then(success => {
                    if (!success) {
                        rej("Failed to open DB");
                        return;
                    }
                    const transaction = this.localDB!.transaction("settings", "readonly");
                    const settingStore = transaction.objectStore("settings");
                    const req = settingStore.get(name);
                    req.onsuccess = () => {
                        if (!req.result)
                            {rej(new Error("failed to fetch setting"));return;}
                        res({value: req.result.value})
                    };
                    req.onerror = () => rej(req.error?.toString());
                });
            });
        } else {
            throw Error("Invalid data source");
        }
    }
    /**
     * Invalidates every session for the currently logged in user except for the current one
     */
    async invalidateOtherSessions() {
        if (this.checkRemote()) {
            try {
                const newSession = await this.apiAccess.invalidateSessions(this.token());
                this.token.set(newSession.token); // To prevent the current session from being invalidated too, a new, valid token is returned by the API with the same details and expiration as the old one
                // Storage
                if (sessionStorage.getItem("token") && this.initialStorageType == InitialStorageType.SESSION) {
                    sessionStorage.setItem("token", newSession.token);
                } else {
                    const localStorageSession: LocalStorageSession | {} = this.localSettings.getSetting("remoteSession", {} as LocalStorageSession | {});
                    if ("token" in localStorageSession && this.initialStorageType == InitialStorageType.LOCAL) {
                        localStorageSession.token = newSession.token;
                        this.localSettings.setSetting("remoteSession", localStorageSession);
                    }
                }
                // Session change event
                for (const listener of this.sessionChangeSubscriptions) {
                    listener();
                }
            } catch (e: any) {
                throw this.processError(e);
            }
        } else {
            throw Error("Sessions may only be invalidated for the API data source");
        }
    }

    /**
     * Updates the value of a setting
     * @param name The name of the setting to update
     * @param newValue The new value for the setting
     * @returns A promise which resolves after the updated setting is saved. Rejects with an error message if something goes wrong.
     */
    async updateSettingValue(name: string, newValue: string) {
        if (this.checkRemote()) {
            try {
                return await this.apiAccess.updateSettingValue(this.token(), name, newValue);
            } catch (e: any) {
                throw this.processError(e);
            }
        } else if (this.dataSource() == DataSource.LOCAL && await this.openDBIfExists()) {
            return await new Promise<void>((res, rej) => {
                const transaction = this.localDB!.transaction("settings", "readwrite");
                const settingStore = transaction.objectStore("settings");
                const req = settingStore.put({name, value: newValue});
                req.onsuccess = () => res();
                req.onerror = () => rej(req.error?.toString());
            });
        } else {
            throw Error("Invalid data source");
        }
    }
    /**
     * Allows a component to listen for session changes (logging in, creating an account, or renewing expired sessions). The listener is automatically unsubscribed when the component is destroyed. This listener is not called during session invalidation or session validation. Must be called in an injection context
     * @param listener A listener to subscribe to this event
     */
    onSessionChange(listener: () => void) {
        const destroyRef = inject(DestroyRef);
        this.sessionChangeSubscriptions.push(listener);
        destroyRef.onDestroy(() => {
            const index = this.sessionChangeSubscriptions.indexOf(listener);
            if (index > -1) {
                this.sessionChangeSubscriptions.splice(index, 1);
            }
        });
    }

    /**
     * Permanently deletes the logged in account and all associated data **forever**, with absolutely no way to undo the operation. Requires a validated session to be called. If an error occurs, the returned promise is rejected with a string containing the error message.
     */
    async deleteAccount() {
        if (this.checkRemote()) {
            try {
                return await this.apiAccess.deleteAccount(this.token());
            } catch (e: any) {
                throw this.processError(e);
            }
        } else if (this.dataSource() == DataSource.LOCAL || this.dataSource() == DataSource.NONE) {
            await this.deleteLocalAccount();
        }
    }

    /**
     * Permanently deletes the brower's local account and all associated data **forever**, with absolutely no way to undo the operation. Does not require a validated session to be called. If an error occurs, the returned promise is rejected with a string containing the error message.
     */
    async deleteLocalAccount() {
        return await new Promise<void>((res, rej) => {
            if (this.localDB)
                this.localDB.close(); // Or else it will hang forever
            const req = indexedDB.deleteDatabase("localPasswords");
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error?.toString());
        });
    }

    /**
     * Opens and assigns this.localDB if it exists and has the right version. The database can only be created or updated by loginLocalUser(), however
     */
    async openDBIfExists(): Promise<boolean> {
        if (this.localDB) {
            return true; // already open :D
        }
        const databases = await indexedDB.databases();
        for (const db of databases) {
            if (db.name === "localPasswords" && db.version === LOCAL_DB_VERSION) {
                return await new Promise<boolean>((res, rej) => {
                    const req = indexedDB.open("localPasswords", LOCAL_DB_VERSION);
                    req.onsuccess = () => {
                        this.localDB = req.result;
                        res(true)
                    };
                    req.onerror = () => rej(req.error);
                });
            }
        }
        return false;
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
    // Convenience type guard, if the datasource is API there is always a token
    private checkRemote(): this is {token: WritableSignal<string>} & this {
        return this.dataSource() == DataSource.API;
    }
    private async setLoginAppTheme() {
        try {
            const themeSetting = await this.getSettingValue("theme");
            if (themeSetting.value === "light") {
                this.appTheme.setDark(false);
            } else if (themeSetting.value === "dark") {
                this.appTheme.setDark(true);
            }
        } catch (e) {}
    }

    // HTTP interceptors
    static sessionExpirationInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
        const backend = inject(Backend);
        return next(req).pipe(tap({
            error: (error: HttpErrorResponse) => {
                if (error.status === 401 && error.error && error.error.error) {
                    backend._sessionExpired.set(true);
                }
            }
        }));
    }
}

// Types
enum DataSource {
    API,
    LOCAL,
    NONE
}
type DataType = "password" | "code";

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

enum InitialStorageType {
    NONE,
    SESSION,
    LOCAL
}