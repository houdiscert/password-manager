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

import { Directive, signal } from "@angular/core";

/**
 * Can be used to declare a template variable that holds a signal which is true or false depending on if the element is hovered
 * 
 * Usage:
 * ```html
 * <element hoverState #hoverState="hover">is hover: {{hoverState.isHover()}}</element>
 * ```
 */
@Directive({
    selector: '[hoverState]',
    host: {
        '(pointerenter)': 'onPointerEnter()',
        '(pointerleave)': 'onPointerLeave()',
    },
    exportAs: "hover"
})
export class HoverState {
    private readonly _isHover = signal(false);
    public isHover = this._isHover.asReadonly();

    onPointerEnter() {
        this._isHover.set(true);
    }
    onPointerLeave() {
        this._isHover.set(false);
    }
}