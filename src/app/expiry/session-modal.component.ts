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