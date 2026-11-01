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

import { booleanAttribute, ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output, output, signal } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { ApiAccess } from "../util/api-access";
import { Backend } from "../util/backend";


@Component({
    selector: 'login-page',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar, ReactiveFormsModule, ErrorPopdown],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
    readonly loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)]),
        password: new FormControl('', Validators.required)
    });


    readonly errorMessage = signal<string[] | null>(null);
    readonly submissionWaiting = signal(false);

    private readonly apiAccess = inject(ApiAccess);
    private readonly backend = inject(Backend);

    readonly showNavbar = input(true, {transform: booleanAttribute});
    readonly showLoginButton = input(true, {transform: booleanAttribute});

    /**
     * Whether the login page should route the user to the passwords list after logging in
     */
    readonly routeToPasswords = input(true, {transform: booleanAttribute});

    completeLogin() {
        if (this.submissionWaiting())
            return;
        if (this.loginForm.controls.email.invalid) {
            this.errorMessage.set(["Invalid email"]);
            this.loginForm.controls.email.markAsTouched();
        } else if (this.loginForm.controls.password.invalid) {
            this.errorMessage.set(["Password is required"])
        } else {
            // Login
            this.submissionWaiting.set(true);
            this.apiAccess.login(this.loginForm.controls.email.value ?? '', this.loginForm.controls.password.value ?? '', res => {
                this.backend.loginRemoteUser(res, this.loginForm.controls.password.value ?? '', e => {
                    this.submissionWaiting.set(false);
                    this.errorMessage.set([e]);
                }, this.routeToPasswords());
            }, e => {
                this.submissionWaiting.set(false);
                this.errorMessage.set([e]);
            });
        }
    }
}