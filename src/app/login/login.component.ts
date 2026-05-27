import { Component } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";


@Component({
    selector: 'login-page',
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss',
    imports: [NavBar]
})
export class LoginPage {}