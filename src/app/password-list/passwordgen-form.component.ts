import { ChangeDetectionStrategy, Component, model, output, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { ErrorPopdown } from "../widgets/error-popdown.component";

@Component({
    selector: 'pm-password-gen',
    templateUrl: './passwordgen-form.component.html',
    styleUrl: './password-list.scss',
    imports: [ReactiveFormsModule, ErrorPopdown],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordGenForm {
    private readonly lowercaseChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    private readonly uppercaseChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    private readonly numberChars = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    private readonly symbolChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '[', ']', '"', "'", '`', ':', ';', '.', '?', '<', '>'];

    readonly show = model.required<boolean>();
    readonly generate = output<string>();

    readonly lowercase = new FormControl(false);
    readonly uppercase = new FormControl(false);
    readonly numbers = new FormControl(false);
    readonly symbols = new FormControl(false);

    readonly length = new FormControl(0, [Validators.min(0)]);

    readonly errorMessage = signal<string[] | null>(null);

    closeModal() {
        this.show.set(false);
    }

    noBubble(event: Event) {
        event.stopPropagation();
    }

    generatePassword() {
        if (!this.lowercase.value && !this.uppercase.value && !this.numbers.value && !this.symbols.value) {
            this.errorMessage.set(["Please select at least 1 character set"]);
            return;
        }
        const characterSet = [...(this.lowercase.value ? this.lowercaseChars : []), ...(this.uppercase.value ? this.uppercaseChars : []), ...(this.numbers.value ? this.numberChars : []), ...(this.symbols.value ? this.symbolChars : [])];
        const passwordData = crypto.getRandomValues(new Uint8Array(this.length.value ?? 0));
        let password = Array.from(passwordData).map(char => characterSet[char % characterSet.length]).join('');
        this.generate.emit(password);
        this.closeModal();
    }
}