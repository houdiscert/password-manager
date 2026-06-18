import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginPage } from './login/login.component';
import { HomePage } from './homepage/homepage.component';
import { SignupPage } from './login/signup.component';

export const routes: Routes = [{
    path: '',
    component: HomePage,
    title: "Password Manager"
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
},
{
    path: 'passwords',
    loadComponent: async () => (await import('./password-list/password-list.component')).PasswordList,
    title: "Passwords - Password Manager"
},
{
    path: 'codes',
    loadComponent: async () => (await import('./password-list/codes-list.component')).CodesList,
    title: "Codes - Password Manager"
}];
