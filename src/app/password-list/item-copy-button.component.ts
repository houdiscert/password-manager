import { ChangeDetectionStrategy, Component, input, signal } from "@angular/core";
import { interval, Observable, of, take } from "rxjs";
import { CopiedTextFadeStates, CopiedTextFadeStatesPipe } from "./copied-item-indicator";
import { Tooltip } from "../widgets/tooltip.component";
import { AsyncPipe } from "@angular/common";
import { HoverState } from "../widgets/tooltip-hover";
import { ErrorPopdown } from "../widgets/error-popdown.component";

@Component({
    selector: 'item-copy-button',
    template: `
        <div class="copy-container">
            @if (password()) {
                <button class="item-info copyable-item" hoverState #hoverState="hover" (click)="copyPassword(password(), $event)">
                    @let fadeStates = copySuccess() | async | copiedTextFadeStates;
                    @if (fadeStates.showInfo) {
                        <span class="property-name" [class.info-fade-out]="fadeStates.infoFadeOut" [animate.enter]="fadeStates.infoFadeIn && 'info-fade-in'">{{label()}}: </span>
                        <span [class.info-fade-out]="fadeStates.infoFadeOut" [animate.enter]="fadeStates.infoFadeIn && 'info-fade-in'">{{password()}}</span>
                    }
                    @else if (fadeStates.showCopyIndicator) {
                        <span class="copy-indicator" animate.enter="indicator-fade-in" animate.leave="indicator-fade-out">Copied!</span>
                    }
                </button>
                <pm-tooltip message="Click to copy!" width="100" [show]="hoverState.isHover()"/>
                <pm-error-popdown [message]="errorMessage()"/>
            }
            <ng-content/>
        </div>
    `,
    styleUrl: './password-list.scss',
    imports: [Tooltip, AsyncPipe, CopiedTextFadeStatesPipe, HoverState, ErrorPopdown],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemCopyButton {
    password = input.required<string | null>();
    label = input<string>("password");

    readonly errorMessage = signal<string[] | null>(null);
    readonly copySuccess = signal<Observable<CopiedTextFadeStates | null>>(of(null));

    async copyPassword(password: string | null, event: Event) {
        event.stopPropagation();
        if (password) {
            try {
                await navigator.clipboard.writeText(password);
                // Show success
                this.copySuccess.set(interval(300).pipe(take(4))); // Cycles through the copied text fade states, with each being used for 200ms
            } catch (e: any) {
                this.errorMessage.set([e.toString()]);
            }
        }
    }
}