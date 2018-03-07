import { AfterViewInit, Component, ElementRef, Input, ViewChild } from "@angular/core";
import * as katex from "katex";

@Component({
	selector: "katex",
	template: `<span #element></span>`
})
export class KatexExpressionComponent implements AfterViewInit {

	@Input("expression")
	public expression: string;

	@ViewChild("element")
	public element: ElementRef;

	constructor() {
	}

	public ngAfterViewInit(): void {
		katex.render(this.expression, this.element.nativeElement);
	}
}
