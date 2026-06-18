import { ChangeDetectionStrategy, Component } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { PasswordForm } from "./password-form.component";
import { DataPipe } from "../util/backend";
import { AsyncPipe } from "@angular/common";
import { DeleteForm } from "./delete-form.component";
import { PasswordList } from "./password-list.component";
import { ItemCopyButton } from "./item-copy-button.component";
import { CodeForm } from "./code-form.component";
import { RefreshTOTPPipe, TOTPRefreshAnimationPipe } from "../util/code-pipes";
import { SettingsModal } from "../settings/settings.component";

@Component({
    selector: 'pm-codes-list',
    templateUrl: './password-list.component.html',
    styleUrl: './password-list.scss',
    imports: [NavBar, PasswordForm, DataPipe, AsyncPipe, DeleteForm, ItemCopyButton, CodeForm, RefreshTOTPPipe, TOTPRefreshAnimationPipe, SettingsModal],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodesList extends PasswordList {
    protected override isCodeList = true;
}