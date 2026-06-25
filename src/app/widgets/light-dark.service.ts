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