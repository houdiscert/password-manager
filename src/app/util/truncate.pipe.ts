import { Pipe, PipeTransform } from "@angular/core";

/**
 * Like trucating a string with SlicePipe but this pipe is pure and also it adds "..." after truncating the string
 */
@Pipe({
    name: 'truncate'
})
export class TruncationPipe implements PipeTransform {
    transform(value: string | null, maxLen: number) {
        if (value) {
            if (value.length <= maxLen) {
                return value;
            } else {
                return value.slice(0, maxLen) + "...";
            }
        } else {
            return null;
        }
    }
}