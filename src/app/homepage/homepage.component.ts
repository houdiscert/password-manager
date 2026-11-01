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
import { RouterLink } from "@angular/router";

@Component({
    selector: "home-page",
    template: `
        <img src="/static/logo.svg" draggable="false" class="logo"/>
        <h1 class="app-title">Password Manager</h1>
        <a class="homepage-button" routerLink="/login">Login</a>
    `,
    imports: [RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {}