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

import { ChangeDetectionStrategy, Component, inject, input, model, OnInit, output, signal, WritableSignal } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Backend } from "../util/backend";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { ListedData } from "../util/api-access";
import { PasswordGenForm } from "./passwordgen-form.component";

interface FormData {
    id: string,
    name: string,
    content: any
}

@Component({
    selector: 'pm-password-form',
    templateUrl: './password-form.component.html',
    styleUrl: './password-list.scss',
    imports: [ReactiveFormsModule, ErrorPopdown, PasswordGenForm],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordForm implements OnInit {
    readonly show = model.required<boolean>();
    readonly addedPasswords = model.required<ListedData[]>();
    readonly editingPassword = input.required<FormData | null>();

    readonly websiteUrlControl = new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z0-9-_+%:;.@#,'()*&$![\]\/~=?]+\.[a-zA-Z0-9-_+%:;.@#,'()*&$![\]\/~=?]{2,}$/)]);
    readonly websiteNameControl = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    readonly usernameControl = new FormControl('');
    readonly passwordControl = new FormControl('', Validators.required);

    private readonly backend = inject(Backend);

    readonly errorMessage = signal<string[] | null>(null);

    // Emitted with data id when some data is edited (not when new data is added)
    readonly passwordEdited = output<string>();

    readonly showGenerationModal = signal(false);

    ngOnInit(): void {
        const data = this.editingPassword();
        if (data) {
            this.websiteUrlControl.setValue(data.content.url);
            this.websiteNameControl.setValue(data.name);
            this.usernameControl.setValue(data.content.username ?? '')
            this.passwordControl.setValue(data.content.password);
        }
    }

    closeModal() {
        this.websiteUrlControl.reset();
        this.websiteNameControl.reset();
        this.passwordControl.reset();
        this.show.set(false);
    }

    noBubble(event: Event) {
        event.stopPropagation();
    }

    onPasswordGenerate(password: string) {
        this.passwordControl.setValue(password);
        this.passwordControl.markAsTouched();
    }

    saveNewPassword() {
        if (this.websiteUrlControl.invalid) {
            this.errorMessage.set([this.websiteUrlControl.errors && this.websiteUrlControl.errors['pattern'] ? "Invalid URL" : "URL is required"]);
            this.websiteUrlControl.markAsTouched();
        } else if (this.websiteNameControl.invalid) {
            if (this.websiteNameControl.errors && this.websiteNameControl.errors['maxlength']) {
                this.errorMessage.set(["Website Name must be 30 characters or less"]);
            } else {
                this.errorMessage.set(["Website Name is required"]);
            }
            this.websiteNameControl.markAsTouched();
        } else if (this.passwordControl.invalid) {
            this.errorMessage.set(["Password is required"]);
            this.passwordControl.markAsTouched();
        } else {
            const existingData = this.editingPassword();
            if (existingData) {
                // Edit the password
                this.backend.editData(existingData.id, this.websiteNameControl.value ?? '', {url: this.websiteUrlControl.value, username: this.usernameControl.value ?? undefined, password: this.passwordControl.value}).then(data => {
                    this.addedPasswords.set(this.addedPasswords().map(listedData => listedData.id === data.id ? data : listedData));
                    this.passwordEdited.emit(data.id);
                    this.closeModal();
                }).catch(err => {
                    this.errorMessage.set([err.error ? err.error.error : "Something went wrong"]);
                });
            } else {
                // Save the password
                this.backend.addNewData("password", this.websiteNameControl.value ?? '', {url: this.websiteUrlControl.value, username: this.usernameControl.value ?? undefined, password: this.passwordControl.value}).then(data => {
                    this.addedPasswords.set([...this.addedPasswords(), data]);
                    this.closeModal();
                }).catch(err => {
                    this.errorMessage.set([err.error ? err.error.error : "Something went wrong"]);
                });
            }
        }
    }
}