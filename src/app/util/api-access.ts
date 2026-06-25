import { HttpClient, HttpErrorResponse, httpResource } from "@angular/common/http";
import { computed, EnvironmentInjector, inject, Injectable, runInInjectionContext, Signal, WritableResource } from "@angular/core";
import * as argon2 from "argon2-browser/dist/argon2-bundled.min.js";
import { firstValueFrom, map } from "rxjs";

const API = "http://pmapi.houdiscert.com"

export interface AccountRes {
    email: string,
    name: string,
    token: string,
}
export interface DataRes {
    id: string,
    type: string,
    name: string,
    content: string
}
export interface ListedData {
    id: string,
    type: string,
    name: string
}
export interface Setting {
    value: string
}
export interface NewSession {
    token: string
}

/**
 * APIs for logging into remote accounts, and lower-level APIs for some Backend operations that are specific to remote accounts.
 */
@Injectable({providedIn: 'root'})
export class ApiAccess {
    private readonly http = inject(HttpClient);

    /**
     * Creates an account
     * @param email Account email
     * @param name Account name
     * @param password Account password
     * @param onSuccess Success callback
     * @param onError Failure callback
     */
    createAccount(email: string, name: string, password: string, onSuccess: (res: AccountRes) => void, onError: (err: string) => void) {
        // hash the password client-side so the server can't just derive the encryption key the client will use to protect its passwords
        argon2.hash({
            pass: password,
            salt: password + password,
            type: argon2.ArgonType.Argon2id,
            time: 1,
            mem: 1024,
            hashLen: 24,
            parallelism: 1,
        }).then(hash => {
            this.http.post<AccountRes>(API + "/accounts", {email, name, password: hash.encoded}).subscribe({next: onSuccess, error: (e: HttpErrorResponse) => {
                if (e.status == 0) {
                    onError("Something went wrong");
                } else {
                    onError(e.error.error ?? "Something went wrong");
                }
            }});
        }).catch(e => {
            onError(typeof e.toString === 'function' ? e.toString() : 'Something went wrong');
        });
    }

    /**
     * Logs into an account
     * @param email Account email
     * @param password Account password
     * @param onSuccess Success callback
     * @param onError Failure callback
     */
    login(email: string, password: string, onSuccess: (res: AccountRes) => void, onError: (err: string) => void) {
        argon2.hash({
            pass: password,
            salt: password + password,
            type: argon2.ArgonType.Argon2id,
            time: 1,
            mem: 1024,
            hashLen: 24,
            parallelism: 1,
        }).then(hash => {
            this.http.post<AccountRes>(API + "/login", {email, password: hash.encoded}).subscribe({next: onSuccess, error: (e: HttpErrorResponse) => {
                if (e.status == 0) {
                    onError("Something went wrong");
                } else {
                    onError(e.error.error ?? "Something went wrong");
                }
            }});
        }).catch(e => {
            onError(typeof e.toString === 'function' ? e.toString() : 'Something went wrong');
        });
    }

    saveData(type: string, name: string, content: string, authToken: string): Promise<DataRes> {
        let observable = this.http.post<DataRes>(API + "/data", {type, name, content}, {headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable);
    }

    editData(id: string, name: string, content: string, authToken: string): Promise<DataRes> {
        let observable = this.http.patch<DataRes>(API + `/data/${id}/update`, {name, content}, {headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable);
    }

    listData(authToken: Signal<string | null>): WritableResource<ListedData[]> {
        return httpResource<ListedData[]>(() => {
            const token = authToken();
            return token ? {url: API + '/listdata', headers: {'Authorization': 'Bearer ' + token}} : undefined;
        }, {defaultValue: []});
    }

    getData(id: string, authToken: string) {
        return this.http.get<DataRes>(API + '/data/' + id, {headers: {'Authorization': 'Bearer ' + authToken}})
    }

    deleteData(id: string, authToken: string): Promise<void> {
        let observable = this.http.delete(API + `/data/${id}/del`, {headers: {'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable.pipe(map(res => undefined)));
    }

    getSettingSignal(authToken: Signal<string | null>, name: string): WritableResource<Setting | undefined> {
        return httpResource<Setting>(() => {
            const token = authToken();
            if (token) {
                return {url: API + '/settings/' + name, headers: {'Authorization': 'Bearer ' + token}};
            } else {
                return undefined;
            }
        });
    }

    getSettingValue(authToken: string, name: string): Promise<Setting> {
        return firstValueFrom(this.http.get<Setting>(API + '/settings/' + name, {headers: {'Authorization': 'Bearer ' + authToken}}));
    }

    updateSettingValue(authToken: string, name: string, value: string): Promise<void> {
        const observable = this.http.put(API + '/settings', {name, value}, {headers: {'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable.pipe(map(() => {})));
    }

    invalidateSessions(authToken: string): Promise<NewSession> {
        const observable = this.http.delete<NewSession>(API + "/sessions/invalidate", {headers: {'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable);
    }

    deleteAccount(authToken: string): Promise<void> {
        const observable = this.http.delete(API + "/account/delete", {headers: {'Authorization': 'Bearer ' + authToken}});
        return firstValueFrom(observable.pipe(map(() => {})));
    }
}