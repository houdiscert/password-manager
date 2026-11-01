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

import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Using a post-build script to rename 404/index.html to 404.html, Cloudflare Pages will automatically display this component with a 404 status code if a page is not found :D
 */
@Component({
    selector: 'pm-not-found',
    template: `
        <h1>404</h1>
        <p>The page you're trying to visit unfortunately could not be found :(</p>
        <a class="homepage-button" routerLink="/">Return to homepage.</a>
    `,
    imports: [RouterLink]
})
export class NotFoundPage {}