import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
    export class SettingsStore {
    getSetting<T>(name: string, def: T): T {
        try {
            const settings = JSON.parse(localStorage.getItem("appSettings") ?? '');
            const type = typeof def;
            return typeof settings[name] === type ? settings[name] : def;
        } catch (e) {
            return def;
        }
    }
    setSetting(name: string, value: any) {
        let settings;
        try {
            settings = JSON.parse(localStorage.getItem("appSettings") ?? '');
        } catch (e) {
            settings = {};
        }
        settings[name] = value;
        localStorage.setItem("appSettings", JSON.stringify(settings));
    }
}