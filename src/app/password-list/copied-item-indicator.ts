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
 * Copy fade text (5 states + starter)
 */
export enum CopiedTextFadeStates {
    FADE_OUT_INFO, // password info is fading out
    FADE_IN_COPIED, // "Copied!" is fading in
    FADE_OUT_COPIED, // "Copied!" is fading back out
    FINAL // info is shown
}

// Pipe to convert from a state to two booleans representing what is shown/hidden
@Pipe({
    name: 'copiedTextFadeStates'
})
export class CopiedTextFadeStatesPipe implements PipeTransform {
    transform(value: CopiedTextFadeStates | null) {
        let showInfo = false, infoFadeOut = true, infoFadeIn = false, showCopyIndicator = false;
        if (value == CopiedTextFadeStates.FADE_OUT_INFO || value == CopiedTextFadeStates.FINAL || value == null) {
            showInfo = true;
        } else if (value == CopiedTextFadeStates.FADE_IN_COPIED) {
            showCopyIndicator = true;
        }
        if (value == CopiedTextFadeStates.FINAL || value == null) {
            infoFadeOut = false;
        }
        if (value == CopiedTextFadeStates.FINAL || value == CopiedTextFadeStates.FADE_OUT_COPIED) {
            infoFadeIn = true;
        }
        return {showInfo, infoFadeOut, infoFadeIn, showCopyIndicator};
    }
}