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