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

import { inject, Injectable, signal } from "@angular/core";
import { SettingsStore } from "../util/app-settings";

/**
 * Exposes a signal for checking if the app is in light or dark mode, and a method for editing the mode. Mainly used by the light-dark widget, but this is a service so that other features may independently interact with the app's theme
 */
@Injectable({
    providedIn: "root"
})
export class LightDarkInfo {
    private readonly settings = inject(SettingsStore)
    private readonly _isDark = signal(this.settings.getSetting("isDark", false));
    readonly isDark = this._isDark.asReadonly();

    setDark(isDark: boolean) {
        this._isDark.set(isDark);
        this.settings.setSetting("isDark", isDark);
        document.body.className = (this.isDark() ? "dark " : "") + "mode-transition";
    }
}