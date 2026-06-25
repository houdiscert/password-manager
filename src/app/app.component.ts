import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LightDarkWidget } from "./widgets/light-dark.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LightDarkWidget],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'password-manager';
}
