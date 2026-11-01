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

import { Component, computed, inject, signal } from "@angular/core";
import { LoginPage } from "../login/login.component";
import { SignupPage } from "../login/signup.component";
import { NavbarActionMap } from "../widgets/navbar-actions";
import { NavBar } from "../widgets/navbar.component";
import { Backend } from "../util/backend";

@Component({
    selector: 'pm-session-modal',
    templateUrl: './session-modal.component.html',
    styleUrls: ['../password-list/password-list.scss', './session-modal.scss'],
    imports: [NavBar, LoginPage, SignupPage]
})
export class SessionModal {
    readonly isSignUp = signal(false);
    readonly currentPage = computed(() => this.isSignUp() ? "signup" : "login");
    readonly sessionModalActions: NavbarActionMap = {login: () => this.isSignUp.set(false), signup: () => this.isSignUp.set(true)};

    private readonly backend = inject(Backend);

    readonly log = console.log;

    doLogout() {
        this.backend.logout();
    }
}