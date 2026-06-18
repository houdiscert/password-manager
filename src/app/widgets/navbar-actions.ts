import { Pipe, PipeTransform } from "@angular/core";

// NavBar items that don't link to pages
export type NavbarActionMap = Record<string, () => void>;
/**
 * pipe to check if a route has a custom action
 */
@Pipe({
    name: "action"
})
export class Action implements PipeTransform {
    transform(value: string, actions: NavbarActionMap | undefined) {
        return actions && actions[value];
    }
}