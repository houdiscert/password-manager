import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

/**
 * Using a post-build script to rename 404/index.html to 404.html, Cloudflare Pages will automatically display this component with a 404 status code if a page is not found :D
 */
@Component({
    selector: 'pm-not-found',
    template: `
        <h1>404</h1>
        <p>The page you're trying to visit unfortunately could not be found :(</p>
        <a class="homepage-button" routerLink="/">Return to homepage.</a>
    `,
    imports: [RouterLink]
})
export class NotFoundPage {}