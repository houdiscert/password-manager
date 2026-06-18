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