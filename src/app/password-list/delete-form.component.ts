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