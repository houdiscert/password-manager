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

import { ChangeDetectionStrategy, Component, input, numberAttribute, signal } from "@angular/core";

@Component({
    selector: 'pm-tooltip',
    template: `
        @if (show()) {
            <div [style.left.px]="mouseX() - (width() / 2)" [style.top.px]="mouseY() + vertOffset()" [style.width.px]="width()" (body:pointermove)="onMouseMove($event)" animate.enter="fadein" animate.leave="fadeout"><span>{{message()}}</span></div>
        }
    `,
    styleUrl: './tooltip.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tooltip {
    readonly message = input.required<string>();
    readonly show = input.required<boolean>();
    readonly vertOffset = input(-35);
    readonly width = input(50, {transform: numberAttribute});

    readonly mouseX = signal(0);
    readonly mouseY = signal(0);

    onMouseMove(event: PointerEvent) {
        this.mouseX.set(event.clientX);
        this.mouseY.set(event.clientY);
    }
}