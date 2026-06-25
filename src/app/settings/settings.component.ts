import { Component, computed, inject, linkedSignal, model, WritableSignal, signal } from "@angular/core";
import { Backend } from "../util/backend";
import { Setting } from "../util/api-access";
import { form, FormField } from '@angular/forms/signals';
import { Popdowns } from "../widgets/popdowns.module";
import { DeleteAccountModal } from "./delete-account-modal.component";

interface SettingFormModel {
    storage: string,
    theme: string
}

@Component({
    selector: 'pm-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.scss', '../password-list/password-list.scss'],
    imports: [FormField, Popdowns, DeleteAccountModal]
})
export class SettingsModal {
    readonly show = model.required<boolean>();

    readonly backend = inject(Backend);
    private readonly storageValue: WritableSignal<Setting>;
    private readonly themeValue: WritableSignal<Setting>;

    private readonly settingsModel = linkedSignal<SettingFormModel>(() => ({
        storage: this.storageValue().value,
        theme: this.themeValue().value
    }));

    readonly settingsForm = form(this.settingsModel);

    private readonly storageDefault = linkedSignal(() => this.storageValue().value);
    private readonly themeDefault = linkedSignal(() => this.themeValue().value);
    readonly storageChanged = computed(() => this.settingsForm.storage().value() !== this.storageDefault());
    readonly themeChanged = computed(() => this.settingsForm.theme().value() !== this.themeDefault());

    readonly errorMessage = signal<string[] | null>(null);
    readonly successMessage = signal<string[] | null>(null);

    readonly showAccountDeletionModal = signal(false);

    constructor() {
        this.storageValue = this.backend.getSettingSignals("storage", {value: "session"} as Setting).storageValue;
        this.themeValue = this.backend.getSettingSignals("theme", {value: "none"} as Setting).themeValue;
    }

    closeModal() {
        this.show.set(false);
    }
    noBubble(event: Event) {
        event.stopPropagation();
    }

    async saveSettings() {
        const newSettings = this.settingsForm().value();
        const errors: string[] = [];

        // Storage
        if (this.storageDefault() !== newSettings.storage) {
            try {
                await this.backend.updateSettingValue("storage", newSettings.storage);
                this.storageDefault.set(newSettings.storage) // Update the setting's default value
            } catch (e: any) {
                errors.push(e);
            }
        }
        // Theme
        if (this.themeDefault() !== newSettings.theme) {
            try {
                await this.backend.updateSettingValue("theme", newSettings.theme);
                this.themeDefault.set(newSettings.theme); // Update the setting's default value
            } catch (e: any) {
                errors.push(e);
            }
        }
        
        // Show a popup
        if (errors.length > 0) {
            this.errorMessage.set(errors);
        } else {
            this.successMessage.set(["Settings saved"]);
        }
    }

    async invalidateOtherSessions() {
        try {
            await this.backend.invalidateOtherSessions();
            this.successMessage.set(["Other sessions have been logged out."]);
        } catch (e: any) {
            this.errorMessage.set([e]);
        }
    }

    showDeleteAccount() {
        this.showAccountDeletionModal.set(true);
    }
}