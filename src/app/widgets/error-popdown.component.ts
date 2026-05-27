import { Component, input } from "@angular/core";

@Component({
    selector: 'pm-error-popdown',
    template: `
        @if (message()) {
            <div class="error-popdown"><img src="/static/invalid.svg" draggable="false" width="25" height="25" class="error-icon"/><span>{{message()}}</span></div>
        }
    `
})
export class ErrorPopdown {
    readonly message = input<string>();
}