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

import { Component, inject, resource, Signal, signal, untracked } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import {toSignal} from '@angular/core/rxjs-interop';
import { Backend } from "../util/backend";
import { firstValueFrom, of, timer } from "rxjs";
import { applyWhen, form, minLength, required, validate, validateAsync, FormRoot, FormField } from "@angular/forms/signals";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { DeleteAccountModal } from "../settings/delete-account-modal.component";

@Component({
    selector: 'pm-local-login',
    templateUrl: './local-session.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar, FormRoot, FormField, ErrorPopdown, DeleteAccountModal]
})
export class LocalSession {
    private readonly backend = inject(Backend);
    private readonly _hasExisting = resource({
        loader: async() => await this.backend.openDBIfExists()
    })
    readonly hasExisting = this._hasExisting.asReadonly();

    private readonly sessionFormModel = signal({
        localPassword: '',
        confirmPassword: ''
    });

    readonly errorMessage = signal<string[] | null>(null);

    readonly showDeleteModal = signal(false);

    readonly sessionForm = form(this.sessionFormModel, (schemaPath) => {
        applyWhen(schemaPath, () => this.hasExisting.hasValue() && this.hasExisting.value(), (schemaPath) => {
            required(schemaPath.localPassword, {"message": "You must input a password."});
            validateAsync(schemaPath.localPassword, {factory: (pass: Signal<string | undefined>) => {
                return resource({
                    params: () => pass(),
                    loader: async ({params}) => {
                        await firstValueFrom(timer(350)); // Wait 0.2s
                        return await this.backend.validateLocalPassword(params);
                    }
                });
            }, params: ({value}) => value(),
            onSuccess: (res) => {
                return res ? null : {kind: "invalidPassword", message: "The password is invalid"}
            }, onError: (err) => {
                console.error("error: ", err);
                untracked(() => {
                    this.errorMessage.set([`${err}`]);
                });
                return {kind: "error", message: "There was an error"}
            }});
        });
        applyWhen(schemaPath, () => this.hasExisting.hasValue() && !this.hasExisting.value(), (schemaPath) => {
            required(schemaPath.localPassword, {"message": "You must set a local session password."});
            minLength(schemaPath.localPassword, 12, {message: "Your local password should be at least 12 characters."});
            validate(schemaPath.localPassword, ({value}) => {
                if (value() == "V3rySecureP4ssword123") {
                    return {
                        kind: "usedTheDemo",
                        message: "Don't use the example password"
                    }
                }
                return null;
            });
            validate(schemaPath.confirmPassword, ({value, valueOf}) => {
                if (value() != valueOf(schemaPath.localPassword)) {
                    return {
                        kind: "noMatch",
                        "message": "Passwords must match"
                    }
                }
                return null;
            });
        });
    }, {submission: {
        action: async (field) => {
            const submittedValue = field().value();
            if (!await this.backend.validateLocalPassword(submittedValue.localPassword)) {
                this.errorMessage.set(["The password is invalid"])
                return {kind: "invalidPassword", message: "The password is invalid", fieldTree: field.localPassword};
            }
            try {
                await this.backend.loginLocalUser(submittedValue.localPassword);
            } catch (e) {
                return {"kind": "error", message: `An error occurred: ${e}`}
            }
            return null;
        }
    }});
}