import { Directive, ElementRef, inject, input, OnDestroy, OnInit, output } from "@angular/core";
import QrScanner from "qr-scanner";

/**
 * A directive that adapts a <video> and <div> in an angular component for use with the vanilla js DOM based QrScanner API. Use this attribute on an overlay div following a video element
 */
@Directive({
    selector: '[qrScanner]'
})
export class QrScannerDirective implements OnInit, OnDestroy {
    readonly qrScanner = input.required<HTMLVideoElement>();
    readonly scan = output<QrScanner.ScanResult>();

    private readonly overlayDiv = inject(ElementRef);
    private qrScannerAPI?: QrScanner;

    ngOnInit() {
        this.qrScannerAPI = new QrScanner(this.qrScanner(), this.scan.emit.bind(this.scan), {
            highlightScanRegion: true,
            overlay: this.overlayDiv.nativeElement
        });
        this.qrScannerAPI.start();
    }
    ngOnDestroy() {
        this.qrScannerAPI?.destroy();
        this.qrScannerAPI = undefined;
    }
}