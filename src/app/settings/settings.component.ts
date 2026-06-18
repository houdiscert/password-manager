import { Component, computed, inject, linkedSignal, model, Signal, WritableSignal } from "@angular/core";
import { Backend } from "../util/backend";
import { Setting } from "../util/api-access";
import { FormControl, FormGroup, FormsModule, NgModel, ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: 'pm-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.scss', '../password-list/password-list.scss'],
    imports: [FormsModule]
})
export class SettingsModal {
    readonly show = model.required<boolean>();

    private readonly backend = inject(Backend);
    private readonly storageValue: WritableSignal<Setting>;
    readonly storageError: Signal<string | undefined>;

    readonly storageModel = linkedSignal(() => this.storageValue().value);

    constructor() {
        ({storageValue: this.storageValue, storageError: this.storageError} = this.backend.getSettingSignals("storage", {value: "session"} as Setting))
    }

    closeModal() {
        this.show.set(false);
    }
    noBubble(event: Event) {
        event.stopPropagation();
    }
}