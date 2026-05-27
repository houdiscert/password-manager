import { Component, input } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Component displaying a Houdiscert Password Manager navigation bar.
 */
@Component({
    selector: 'pm-navbar',
    template: `
        <div class="navbar-container">
            @for (page of pages(); track $index) {
                <a [routerLink]="'/'+page.route" class="navbar-button" [class.current]="page.route == currentPage()">{{page.title}}</a>
            }
        </div>
    `,
    styleUrl: './navbar.scss',
    imports: [RouterLink]
})
export class NavBar {
    /**
     * Pages the navbar can be used to navigate to. Is a Page(title, route)[] but can be specified as a string[0=title, 1=route][] that is converted to a Page[].
     */
    readonly pages = input.required({transform: toPages});
    /**
     * Route name of the current page. Shown in blue in the navbar
     */
    readonly currentPage = input.required<string>();
}
export class Page {
    readonly title: string;
    readonly route: string;

    constructor(title: string, route: string) {
        this.title = title;
        this.route = route;
    }
}
function toPages(value: string[][]) {
    let pages: Page[] = [];
    for (const page of value) {
        pages.push(new Page(page[0], page[1]));
    }
    return pages;
}