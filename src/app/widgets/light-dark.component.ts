import { afterNextRender, Component, inject, signal } from "@angular/core";
import { SettingsStore } from "../util/app-settings";

@Component({
    selector: 'light-dark',
    template: `
        <button [className]="isDark() ? 'dark-mode-toggle-dark' : 'dark-mode-toggle'" (click)="toggleMode()"></button>
    `,
    styleUrl: './light-dark.scss'
})
export class LightDarkWidget {
    settings = inject(SettingsStore)
    isDark = signal(this.settings.getSetting("isDark", false));

    constructor() {
        afterNextRender({write: () => {
            if (this.isDark()) {
                document.body.className = "dark";
            }
        }});
    }

    toggleMode() {
        const newMode = !this.isDark();
        this.isDark.set(newMode);
        this.settings.setSetting("isDark", newMode);

        document.body.className = (this.isDark() ? "dark " : "") + "mode-transition";
    }
}