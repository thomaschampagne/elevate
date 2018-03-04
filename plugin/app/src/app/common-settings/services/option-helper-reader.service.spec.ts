import { TestBed } from "@angular/core/testing";

import { OptionHelperReaderService } from "./option-helper-reader.service";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";

describe("OptionHelperReaderService", () => {

	let http: HttpClient;
	let optionHelperReaderService: OptionHelperReaderService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientModule],
			providers: [OptionHelperReaderService, HttpClient]
		});

		http = TestBed.get(HttpClient);
		optionHelperReaderService = TestBed.get(OptionHelperReaderService);
	});

	it("should be created", (done: Function) => {
		expect(optionHelperReaderService).not.toBeNull();
		expect(http).not.toBeNull();
		done();
	});

	it("should return markdown data", (done: Function) => {

		// Given
		const markDownData = "## **This Title has bold style**";

		spyOn(http, "get").and.returnValue(Observable.of(markDownData));

		// When
		const promise = optionHelperReaderService.get("test.md");

		// Then
		promise.then((markDownResultData: string) => {
			expect(markDownResultData).not.toBeNull();
			expect(markDownResultData).toBe(markDownData);
			done();
		});

	});
});

