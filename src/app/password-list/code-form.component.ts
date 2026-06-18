import { ChangeDetectionStrategy, Component, computed, inject, model, NO_ERRORS_SCHEMA, signal } from "@angular/core";
import { NavBar } from "../widgets/navbar.component";
import { AbstractControl, FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import QrScanner from 'qr-scanner'
import { ErrorPopdown } from "../widgets/error-popdown.component";
import * as OTPAuth from 'otpauth';
import { QrScannerDirective } from "./qr-scanner.directive";
import { Backend } from "../util/backend";
import { ListedData } from "../util/api-access";

@Component({
    selector: 'pm-code-form',
    templateUrl: './code-form.component.html',
    styleUrl: './password-list.scss',
    imports: [NavBar, ReactiveFormsModule, ErrorPopdown, QrScannerDirective],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeForm {
    readonly show = model.required<boolean>();
    readonly addedCodes = model.required<ListedData[]>();

    readonly isScanQR = signal(false);
    readonly selectedMode = computed(() => this.isScanQR() ? "scanqr" : "pasteqr");
    readonly qrModeActions = {pasteqr: () => this.isScanQR.set(false), scanqr: () => this.isScanQR.set(true)};
    readonly errorMessage = signal<string[] | null>(null);

    readonly otpauthUrlControl = new FormControl('', [Validators.required, validateOTPAuth]);

    readonly otpSecret = signal<OTPAuth.TOTP | OTPAuth.HOTP | null>(null);

    private qrScanner?: QrScanner;

    readonly websiteUrlControl = new FormControl('', Validators.pattern(/^([a-zA-Z0-9-_+%:;.@#,'()*&$![\]\/~=?]+\.[a-zA-Z0-9-_+%:;.@#,'()*&$![\]\/~=?]{2,})?$/));
    readonly websiteNameControl = new FormControl('', [Validators.required, Validators.maxLength(30)]);

    private readonly backend = inject(Backend);

    closeModal() {
        this.show.set(false);
    }
    noBubble(event: Event) {
        event.stopPropagation();
    }

    async onPasteQR(event: ClipboardEvent) {
        if (event.clipboardData && event.clipboardData.files.length > 0) {
            const file = event.clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                try {
                    const scanResult = await QrScanner.scanImage(file, {alsoTryWithoutScanRegion: false});
                    try {
                        OTPAuth.URI.parse(scanResult.data);
                        this.otpauthUrlControl.setValue(scanResult.data);
                        this.otpauthUrlControl.markAsTouched();
                    } catch (e) {
                        this.errorMessage.set(["Not a valid authentication code QR"]);
                    }
                } catch (e: any) {
                    console.error(e);
                    this.errorMessage.set(["No QR Code detected"]);
                }
            }
        }
    }

    initQrScanner(vid: HTMLVideoElement, overlayDiv: HTMLDivElement) {

    }

    nextPagePaste() {
        if (this.otpauthUrlControl.invalid) {
            if (this.otpauthUrlControl.errors && this.otpauthUrlControl.errors['otpauth']) {
                console.error(this.otpauthUrlControl.errors['otpauth']);
                this.errorMessage.set(["Invalid otpauth:// URL"]);
            } else {
                this.errorMessage.set(["otpauth:// URL is required"]);
            }
            this.otpauthUrlControl.markAsTouched();
        } else {
            this.nextPage(this.otpauthUrlControl.value ?? '');
        }
    }

    private prepareNameField() {
        this.websiteNameControl.setValue(this.otpSecret()!.label + " - " + this.otpSecret()!.issuer);
        this.websiteNameControl.markAsTouched();
    }

    nextPageQRScan(scanRes: QrScanner.ScanResult) {
        try {
            const otp = OTPAuth.URI.parse(scanRes.data);
            this.otpSecret.set(otp);
            this.prepareNameField();
        } catch (e) {
            // Just ignore non-otp codes
        }
    }

    nextPage(otpAuth: string) {
        try {
            const otp = OTPAuth.URI.parse(otpAuth);
            this.otpSecret.set(otp);
            this.prepareNameField();
        } catch (e: any) {
            console.error(e);
            this.errorMessage.set(["Failed to parse otpauth:// URL"]);
        }
    }

    saveNewCode() {
        // Form errors on this page don't need to be marked as touched since the URL is optional and thus valid by default unless already touched by the user, and the website name control is prefilled and marked as touched when the form is first shown
        if (this.websiteUrlControl.invalid) {
            this.errorMessage.set(["Invalid URL"]);
        } else if (this.websiteNameControl.invalid) {
            if (this.websiteNameControl.errors && this.websiteNameControl.errors['maxlength']) {
                this.errorMessage.set(["Website Name must be 30 characters or less"]);
            } else {
                this.errorMessage.set(["Website Name is required"]);
            }
        } else {
            // Save the code
            const otp = this.otpSecret()!;
            let data;
            if ('period' in otp) {
                data = {url: this.websiteUrlControl.value ? this.websiteUrlControl.value : undefined, secret: otp.secret.base32, type: "totp", period: otp.period, algo: otp.algorithm, digits: otp.digits};
            } else {
                data = {url: this.websiteUrlControl.value ? this.websiteUrlControl.value : undefined, secret: otp.secret.base32, type: "hotp", counter: otp.counter, algo: otp.algorithm, digits: otp.digits};
            }
            this.backend.addNewData("code", this.websiteNameControl.value ?? '', data).then(data => {
                this.addedCodes.set([...this.addedCodes(), data]);
                this.closeModal();
            }).catch(err => {
                this.errorMessage.set([err.error ? err.error.error : "Something went wrong"]);
            });
        }
    }
}

/**
 * otpauth:// uri validator that validates URIs by parsing them with the otpauth library
 */
function validateOTPAuth(control: AbstractControl) {
    try {
        OTPAuth.URI.parse(control.value);
        return null
    } catch(e) {
        return {otpauth: e};
    }
}