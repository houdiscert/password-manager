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
import { SessionModal } from "../expiry/session-modal.component";
import { TruncationPipe } from "../util/truncate.pipe";

@Component({
    selector: 'pm-codes-list',
    templateUrl: './password-list.component.html',
    styleUrl: './password-list.scss',
    imports: [NavBar, PasswordForm, DataPipe, AsyncPipe, DeleteForm, ItemCopyButton, CodeForm, RefreshTOTPPipe, TOTPRefreshAnimationPipe, SettingsModal, SessionModal, TruncationPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodesList extends PasswordList {
    protected override isCodeList = true;
}