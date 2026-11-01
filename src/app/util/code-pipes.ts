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

import { Pipe, PipeTransform } from "@angular/core";
import * as OTPAuth from 'otpauth';
import { concat, concatMap, interval, map, of, timer } from "rxjs";

interface CodeDataTOTP {
    url?: string,
    secret: string,
    type: "totp",
    period: number,
    counter?: number,
    algo: string,
    digits: number
}
interface CodeDataHOTP {
    url?: string,
    secret: string,
    type: "hotp",
    counter: number,
    period?: number,
    algo: string,
    digits: number
}
export type CodeData = CodeDataTOTP | CodeDataHOTP;

function parseTOTP(data: CodeDataTOTP) {
    return new OTPAuth.TOTP({
        algorithm: data.algo,
        digits: data.digits,
        period: data.period,
        secret: data.secret
    });
}

/**
 * A pipe that maps a TOTP config to an observable which emits a new code every time the otp expires
 */
@Pipe({
    name: 'refreshTotp'
})
export class RefreshTOTPPipe implements PipeTransform {
    transform(value: CodeDataTOTP) {
        const totp = parseTOTP(value);
        return concat(of(totp.generate()), timer(totp.remaining()).pipe(map(() => totp.generate())), interval(totp.period * 1000).pipe(map(() => totp.generate())));
    }
}

/**
 * A pipe that maps a TOTP config to a CSS animation style where each cycle lines up with the period of time an otp is valid for
 */
@Pipe({
    name: 'refreshAnimation'
})
export class TOTPRefreshAnimationPipe implements PipeTransform {
    transform(value: CodeDataTOTP, animName: string) {
        const totp = parseTOTP(value);
        return `${animName} ${value.period}s linear -${value.period * 1000 - totp.remaining()}ms normal infinite`
    }
}