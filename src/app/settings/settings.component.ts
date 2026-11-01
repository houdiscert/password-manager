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