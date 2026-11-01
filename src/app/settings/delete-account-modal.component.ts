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

import { ChangeDetectionStrategy, Component, inject, input, model, output, signal, WritableSignal } from "@angular/core";
import { DataRes } from "../util/api-access";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { Backend } from "../util/backend";
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";

@Component({
    selector: 'pm-delete-account',
    templateUrl: './delete-account-modal.component.html',
    styleUrls: ['../password-list/password-list.scss', './settings.scss'],
    imports: [ErrorPopdown, ReactiveFormsModule]
})
export class DeleteAccountModal {
    readonly show = model.required<boolean>();

    readonly errorMessage = signal<string[] | null>(null);

    readonly backend = inject(Backend);
    
    readonly deleteConfirmationControl = new FormControl('', [Validators.required, deleteConfirmationValidator(this.backend.getEmail()())]);

    closeModal() {
        this.show.set(false);
    }

    noBubble(event: Event) {
        event.stopPropagation();
    }

    async deleteAccount() {
        if (this.deleteConfirmationControl.invalid) {
            this.deleteConfirmationControl.markAsTouched();
            if (this.deleteConfirmationControl.errors && this.deleteConfirmationControl.errors['required']) {
                this.errorMessage.set(["Confirmation is required"]);
            } else {
                this.errorMessage.set([`Should contain "delete ${this.backend.getEmail()() ?? "account"}"`]);
            }
        } else {
            try {
                await this.backend.deleteAccount();
                this.backend.logout(); // The account is completely deleted at this point so the user should probably be logged out
            } catch (e: any) {
                this.errorMessage.set([e]);
            }
        }
    }
}

/**
 * Validates that the delete confirmation input contains the right string
 */
function deleteConfirmationValidator(email: string | null) {
    return (control: AbstractControl) => 
        control.value === "delete " + (email ?? "account") ? null : {invalidConfirm: true};
}