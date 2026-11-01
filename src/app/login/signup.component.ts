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

import { assertInInjectionContext, booleanAttribute, ChangeDetectionStrategy, Component, EnvironmentInjector, inject, input, runInInjectionContext, signal } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { ApiAccess } from "../util/api-access";
import { Backend } from "../util/backend";

const MIN_PASSWORD_LENGTH = 12;

@Component({
    selector: 'signup-page',
    templateUrl: './signup.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar, ReactiveFormsModule, ErrorPopdown],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupPage {
    // This *could* use Validators.email (which is a thing) but I think it makes more sense to ensure the behaviour of the client matches the server, which uses the below regex.
    readonly emailControl = new FormControl('', [Validators.required, Validators.pattern(/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)]);
    readonly nameControl = new FormControl('', Validators.required);
    readonly passwordControl = new FormControl('', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), dontUseTheDemo]);
    readonly confirmPasswordControl = new FormControl('', [Validators.required, passwordMatcher.bind(this, this.passwordControl)]);

    readonly errorMessage = signal<string[] | null>(null);
    
    private readonly apiAccess = inject(ApiAccess);
    private readonly backend = inject(Backend);

    readonly accExistsError = signal(false);
    readonly submissionWaiting = signal(false);

    readonly showNavbar = input(true, {transform: booleanAttribute});
    readonly showSignupButton = input(true, {transform: booleanAttribute});

    /**
     * Whether the signup page should route the user to the passwords list after creating an account
     */
    readonly routeToPasswords = input(true, {transform: booleanAttribute});

    completeSignup() {
        if (this.submissionWaiting())
            return;
        if (this.emailControl.invalid) {
            this.errorMessage.set(["Invalid email"]);
            this.emailControl.markAsTouched();
        } else if (this.nameControl.invalid) {
            this.errorMessage.set(["Name is required"]);
            this.nameControl.markAsTouched();
        } else if (this.passwordControl.invalid) {
            if (this.passwordControl.errors && this.passwordControl.errors['usedTheDemo']) {
                this.errorMessage.set(["Don't use the example password"]);
            } else {
                this.errorMessage.set(["Password should be at least 12 characters"]);
            }
            this.passwordControl.markAsTouched();
        } else if (this.confirmPasswordControl.invalid) {
            this.errorMessage.set(["Passwords must match"]);
            this.confirmPasswordControl.markAsTouched();
        } else {
            this.submissionWaiting.set(true);
            // Try creating an account
            const password: string = this.passwordControl.value ?? '';
            this.apiAccess.createAccount(this.emailControl.value ?? '', this.nameControl.value ?? '', password ?? '', res => {
                this.backend.loginRemoteUser(res, password, e => {
                    this.submissionWaiting.set(false);
                    this.errorMessage.set([e]);
                }, this.routeToPasswords());
            }, e => {
                this.submissionWaiting.set(false);
                // Specific error messages
                if (e === 'User with that email already exists') {
                    this.accExistsError.set(true);
                    this.emailControl.markAsPristine();
                }
                this.errorMessage.set([e]);
            });
        }
    }
}

function passwordMatcher(passwordControl: FormControl<string | null>, control: AbstractControl) {
    return control.value === passwordControl.value ? null : {noMatch: control.value};
}
/**
 * Blocks someone from trying to sign up with the placeholder password
 */
function dontUseTheDemo(control: AbstractControl) {
    return control.value === "V3rySecureP4ssword123" ? {usedTheDemo: true} : null
}