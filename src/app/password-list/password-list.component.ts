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

@Component({
    selector: 'pm-password-list',
    templateUrl: './password-list.component.html',
    styleUrl: './password-list.scss',
    imports: [NavBar, PasswordForm, DataPipe, AsyncPipe, DeleteForm, ItemCopyButton, CodeForm, RefreshTOTPPipe, TOTPRefreshAnimationPipe, SettingsModal],
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
    readonly passwordsList = computed(() => [...this.data.getData()(), ...this.addedPasswords()].filter(data => data.type === (this.isCodeList ? "code" : "password") && !this.removedPasswords().includes(data.id)));
    readonly shownPasswordsList = signal<string[]>([]);

    readonly deletionTarget = signal<DataRes>({id: "", name: "", type: "password", content: ""});
    readonly showDeleteModal = signal(false);

    /**
     * Used to identify if the component is a \<pm-password-list> or a \<pm-codes-list>. Although different components, they're so similar, the codes list actually extends the passwords list and they use the same template and stylesheet.
     */
    protected readonly isCodeList: boolean = false;

    constructor() {
        afterNextRender({write: () => {
            this.backend.validateSession(this.hasSession).then(async () => {
                this.backend.fetchDataInto(this.data);
            });
        }});
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