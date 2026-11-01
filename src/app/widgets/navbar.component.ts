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

import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Action, NavbarActionMap } from "./navbar-actions";

/**
 * Component displaying a Houdiscert Password Manager navigation bar.
 */
@Component({
    selector: 'pm-navbar',
    template: `
        <div class="navbar-container">
            @for (page of pages(); track $index) {
                @if (page.route | action: actions(); as action) {
                    <button (click)="action()" class="navbar-button" [class.current]="page.route == currentPage()">{{page.title}}</button>
                } @else {
                    <a [routerLink]="'/'+page.route" class="navbar-button" [class.current]="page.route == currentPage()">{{page.title}}</a>
                }
            }
        </div>
    `,
    styleUrl: './navbar.scss',
    imports: [RouterLink, Action],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavBar {
    /**
     * Pages the navbar can be used to navigate to. Is a Page(title, route)[] but can be specified as a string[0=title, 1=route][] that is converted to a Page[].
     */
    readonly pages = input.required({transform: toPages});
    /**
     * Route name of the current page. Shown in blue in the navbar
     */
    readonly currentPage = input.required<string>();

    // Non-navigation routes
    /**
     * Actions for certain routes to perform instead of being redirects
     */
    readonly actions = input<NavbarActionMap>();
}
export class Page {
    readonly title: string;
    readonly route: string;

    constructor(title: string, route: string) {
        this.title = title;
        this.route = route;
    }
}
function toPages(value: string[][]) {
    let pages: Page[] = [];
    for (const page of value) {
        pages.push(new Page(page[0], page[1]));
    }
    return pages;
}