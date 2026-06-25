import { NgModule } from "@angular/core";
import { ErrorPopdown } from "./error-popdown.component";
import { InfoPopdown } from "./info-popdown.component";

/**
 * A module for conveniently importing both ErrorPopdown and InfoPopdown at the same time
 */
@NgModule({
    imports: [ErrorPopdown, InfoPopdown],
    exports: [ErrorPopdown, InfoPopdown]
})
export class Popdowns {}