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

/**
 * Like trucating a string with SlicePipe but this pipe is pure and also it adds "..." after truncating the string
 */
@Pipe({
    name: 'truncate'
})
export class TruncationPipe implements PipeTransform {
    transform(value: string | null, maxLen: number) {
        if (value) {
            if (value.length <= maxLen) {
                return value;
            } else {
                return value.slice(0, maxLen) + "...";
            }
        } else {
            return null;
        }
    }
}