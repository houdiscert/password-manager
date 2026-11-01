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

import { Pipe, PipeTransform } from "@angular/core";

// NavBar items that don't link to pages
export type NavbarActionMap = Record<string, () => void>;
/**
 * pipe to check if a route has a custom action
 */
@Pipe({
    name: "action"
})
export class Action implements PipeTransform {
    transform(value: string, actions: NavbarActionMap | undefined) {
        return actions && actions[value];
    }
}