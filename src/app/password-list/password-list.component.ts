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

import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { Backend, DataPipe } from "../util/backend";
import { NavbarActionMap } from "../widgets/navbar-actions";
import { PasswordForm } from "./password-form.component";
import { DataRes, ListedData } from "../util/api-access";
import { AsyncPipe } from "@angular/common";
import { DeleteForm } from "./delete-form.component";
import { ItemCopyButton } from "./item-copy-button.component";
import { CodeForm } from "./code-form.component";
import { RefreshTOTPPipe, TOTPRefreshAnimationPipe } from "../util/code-pipes";
import { SettingsModal } from "../settings/settings.component";
import { SessionModal } from "../expiry/session-modal.component";
import { TruncationPipe } from "../util/truncate.pipe";

@Component({
    selector: 'pm-password-list',
    templateUrl: './password-list.component.html',
    styleUrl: './password-list.scss',
    imports: [NavBar, PasswordForm, DataPipe, AsyncPipe, DeleteForm, ItemCopyButton, CodeForm, RefreshTOTPPipe, TOTPRefreshAnimationPipe, SettingsModal, SessionModal, TruncationPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordList {
    readonly backend = inject(Backend);
    readonly hasSession = signal(false);
    readonly navActions: NavbarActionMap = { logout: () => this.backend.logout() };
    
    readonly showSettings = signal(false);

    readonly showModalForm = signal(false);
    readonly editingPassword = signal<DataRes | null>(null);

    private readonly data = this.backend.getData();
    readonly addedPasswords = signal<ListedData[]>([]);
    readonly removedPasswords = signal<string[]>([]);
    readonly passwordsList = computed(() => [...this.data(), ...this.addedPasswords()].filter(data => data.type === (this.isCodeList ? "code" : "password") && !this.removedPasswords().includes(data.id)));
    readonly shownPasswordsList = signal<string[]>([]);

    readonly deletionTarget = signal<DataRes>({id: "", name: "", type: "password", content: ""});
    readonly showDeleteModal = signal(false);

    /**
     * Used to identify if the component is a \<pm-password-list> or a \<pm-codes-list>. Although different components, they're so similar, the codes list actually extends the passwords list and they use the same template and stylesheet.
     */
    protected readonly isCodeList: boolean = false;

    constructor() {
        afterNextRender({write: () => {
            this.backend.validateSession(this.hasSession);
        }});

        this.backend.onSessionChange(() => {
            // A session change will reload listed data from the server, so these local lists should be cleared
            this.addedPasswords.set([]);
            this.removedPasswords.set([]);
        });
    }

    addPassword() {
        this.editingPassword.set(null);
        this.showModalForm.set(true);
    }

    revealItem(id: string) {
        this.shownPasswordsList.set([...this.shownPasswordsList(), id]);
    }

    hideItem(id: string) {
        this.shownPasswordsList.set(this.shownPasswordsList().filter(item => item !== id));
    }

    editPassword(password: DataRes, event: Event) {
        event.stopPropagation();
        this.editingPassword.set(password);
        this.showModalForm.set(true);
    }

    deletePassword(data: DataRes, event: Event) {
        event.stopPropagation();
        this.deletionTarget.set(data);
        this.showDeleteModal.set(true);
    }

    removeFromList(id: string) {
        this.removedPasswords.set([...this.removedPasswords(), id]);
    }

    openSettings() {
        this.showSettings.set(true);
    }
}