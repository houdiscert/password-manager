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