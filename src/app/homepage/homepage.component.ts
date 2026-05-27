import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
    selector: "home-page",
    template: `
        <img src="/static/logo.svg" draggable="false" class="logo"/>
        <h1 class="app-title">Password Manager</h1>
        <a class="login-button" routerLink="/login">Login</a>
    `,
    imports: [RouterLink]
})
export class HomePage {}