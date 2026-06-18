import { ChangeDetectionStrategy, Component, inject, input, model, output, signal, WritableSignal } from "@angular/core";
import { DataRes } from "../util/api-access";
import { ErrorPopdown } from "../widgets/error-popdown.component";
import { Backend } from "../util/backend";

@Component({
    selector: 'pm-confirm-delete',
    templateUrl: './delete-form.component.html',
    styleUrl: './password-list.scss',
    imports: [ErrorPopdown],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteForm {
    readonly show = model.required<boolean>();
    readonly target = input.required<DataRes>();

    readonly errorMessage = signal<string[] | null>(null);
    
    readonly onDelete = output<void>({alias: "delete"});

    private readonly backend = inject(Backend);

    closeModal() {
        this.show.set(false);
    }

    noBubble(event: Event) {
        event.stopPropagation();
    }

    async deleteItem() {
        try {
            await this.backend.deleteData(this.target().id);
            this.onDelete.emit();
            this.closeModal();
        } catch (e: any) {
            this.errorMessage.set([(e.error?.error) ?? 'Something went wrong']);
            throw e;
        }
    }
}