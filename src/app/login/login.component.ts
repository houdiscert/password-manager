import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
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
                });
            }, e => {
                this.submissionWaiting.set(false);
                this.errorMessage.set([e]);
            });
        }
    }
}