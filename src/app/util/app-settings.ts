import { Injectable } from "@angular/core";

/**
 * Provides some functions for reading/writing values to local storage. Differs from the settings that are get/set in `Backend` as those settings need an active session, only hold strings, are limited to 30 characters, and are saved to a user's account rather than being saved to local storage in the user's browser.
 */
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