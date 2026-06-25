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