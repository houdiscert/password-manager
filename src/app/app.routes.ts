import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginPage } from './login/login.component';
import { HomePage } from './homepage/homepage.component';
import { SignupPage } from './login/signup.component';

export const routes: Routes = [{
    path: '',
    component: HomePage
},
{
    path: 'login',
    component: LoginPage,
    title: "Login - Password Manager"
},
{
    path: 'signup',
    component: SignupPage,
    title: "Create Account - Password Manager"
}];
