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