import { Component } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";

const MIN_PASSWORD_LENGTH = 12;

@Component({
    selector: 'signup-page',
    templateUrl: './signup.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar, ReactiveFormsModule]
})
export class SignupPage {
    emailControl = new FormControl('', [Validators.required, Validators.email]);
    nameControl = new FormControl('', Validators.required);
    passwordControl = new FormControl('', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH), dontUseTheDemo]);
    confirmPasswordControl = new FormControl('', [Validators.required, passwordMatcher.bind(this, this.passwordControl)]);

    completeSignup() {
        
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