import { Component, signal } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ErrorPopdown } from "../widgets/error-popdown.component";

const MIN_PASSWORD_LENGTH = 12;

@Component({
    selector: 'signup-page',
    templateUrl: './signup.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar, ReactiveFormsModule, ErrorPopdown]
})
export class SignupPage {
    readonly emailControl = new FormControl('', [Validators.required, Validators.email]);
    readonly nameControl = new FormControl('', Validators.required);
    readonly passwordControl = new FormControl('', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), dontUseTheDemo]);
    readonly confirmPasswordControl = new FormControl('', [Validators.required, passwordMatcher.bind(this, this.passwordControl)]);

    readonly errorMessage = signal<string | undefined>(undefined);

    completeSignup() {
        this.errorMessage.set("test");
        setTimeout(() => this.errorMessage.set(undefined), 5000);
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