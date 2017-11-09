import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
	name: 'asHtml',
	pure: false,
})
export class AsHtmlPipe implements PipeTransform {

	constructor(private sanitizer: DomSanitizer) {
	}

	transform(content) {
		return this.sanitizer.bypassSecurityTrustHtml(content);
	}
}
