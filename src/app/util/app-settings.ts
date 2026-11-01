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