/*
    Password Manager is a simple password manager and TOTP web-app.
    Copyright (C) 2026 houdert6 & vqlesoft

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginPage } from './login/login.component';
import { HomePage } from './homepage/homepage.component';
import { SignupPage } from './login/signup.component';
import { LocalSession } from './login/local-session.component';

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
},
{
    path: 'local',
    component: LocalSession,
    title: "Use Local Session - Password Manager"
},
{
    path: '404',
    loadComponent: async () => (await import('./not-found/not-found.component')).NotFoundPage,
    title: 'Page not Found - Password Manager'
},
{
    path: '**',
    loadComponent: async () => (await import('./not-found/not-found.component')).NotFoundPage,
    title: 'Page not Found - Password Manager'
}];
