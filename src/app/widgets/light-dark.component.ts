import { afterNextRender, ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { SettingsStore } from "../util/app-settings";
import { LightDarkInfo } from "./light-dark.service";

@Component({
    selector: 'light-dark',
    template: `
        <button [className]="info.isDark() ? 'dark-mode-toggle-dark' : 'dark-mode-toggle'" (click)="toggleMode()" aria-label="toggle light or dark theme"></button>
    `,
    styleUrl: './light-dark.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LightDarkWidget {
    settings = inject(SettingsStore)
    info = inject(LightDarkInfo)

    constructor() {
        afterNextRender({write: () => {
            if (this.info.isDark()) {
                document.body.className = "dark";
            }
        }});
    }

    toggleMode() {
        const newMode = !this.info.isDark();
        this.info.setDark(newMode);
    }
}