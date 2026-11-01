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

import { AsyncPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { concat, of, timer } from "rxjs";

@Component({
    selector: 'pm-error-popdown',
    template: `
        @if (messageWithExpiry() | async; as msg) {
            <div class="error-popdown" animate.enter="enter" animate.leave="leave"><img src="/static/invalid.svg" draggable="false" width="25" height="25" class="icon"/><span>{{msg}}</span></div>
        }
    `,
    styleUrl: "./error-popdown.scss",
    imports: [AsyncPipe],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorPopdown {
    readonly message = input<string[] | null>(null);
    readonly showFor = input<number>(5000);
    readonly messageWithExpiry = computed(() => concat(of(this.message()?.join(", ")), timer(this.showFor())));
}