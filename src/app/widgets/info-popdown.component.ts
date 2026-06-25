import { AsyncPipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { concat, of, timer } from "rxjs";

@Component({
    selector: 'pm-info-popdown',
    template: `
        @if (messageWithExpiry() | async; as msg) {
            <div class="info-popdown" animate.enter="enter" animate.leave="leave"><img src="/static/info.svg" draggable="false" width="25" height="25" class="icon"/><span>{{msg}}</span></div>
        }
    `,
    styleUrl: "./error-popdown.scss",
    imports: [AsyncPipe],
})
export class InfoPopdown {
    readonly message = input<string[] | null>(null);
    readonly showFor = input<number>(5000);
    readonly messageWithExpiry = computed(() => concat(of(this.message()?.join(", ")), timer(this.showFor())));
}