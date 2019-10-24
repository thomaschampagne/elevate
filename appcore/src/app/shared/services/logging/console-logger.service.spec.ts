import { TestBed } from "@angular/core/testing";
import { LoggerService } from "./logger.service";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../shared.module";
import { environment } from "../../../../environments/environment";

describe("ConsoleLoggerService", () => {

	let service: LoggerService;

	beforeEach((done: () => void) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		});

		service = TestBed.get(LoggerService);

		done();
	});


	it("should provide console debug", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_DEBUG;
		const spyDebug = spyOn(console, "debug");

		// When
		service.debug("hello debug");

		// Then
		expect(spyDebug).toHaveBeenCalled();

		done();
	});

	it("should provide console info", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_INFO;
		const spyDebug = spyOn(console, "info");

		// When
		service.info("hello info");

		// Then
		expect(spyDebug).toHaveBeenCalled();

		done();
	});

	it("should provide console warn", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_INFO;
		const spy = spyOn(console, "warn");

		// When
		service.warn("hello warn");

		// Then
		expect(spy).toHaveBeenCalled();

		done();
	});

	it("should provide console warn", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_WARN;
		const spy = spyOn(console, "warn");

		// When
		service.warn("hello warn");

		// Then
		expect(spy).toHaveBeenCalled();

		done();
	});

	it("should provide console error", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_ERROR;
		const spy = spyOn(console, "error");

		// When
		service.error("hello error");

		// Then
		expect(spy).toHaveBeenCalled();

		done();
	});

	it("should not provide log WARN when level is ERROR", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_ERROR;
		const spy = spyOn(console, "warn");

		// When
		service.warn("hello warn");

		// Then
		expect(spy).not.toHaveBeenCalled();

		done();
	});

	it("should not provide log INFO when level is WARN", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_WARN;
		const spy = spyOn(console, "info");

		// When
		service.info("hello info");

		// Then
		expect(spy).not.toHaveBeenCalled();

		done();
	});

	it("should not provide log DEBUG when level is INFO", (done: () => void) => {

		// Given
		environment.logLevel = LoggerService.LEVEL_INFO;
		const spy = spyOn(console, "debug");

		// When
		service.debug("hello debug");

		// Then
		expect(spy).not.toHaveBeenCalled();

		done();
	});

});
