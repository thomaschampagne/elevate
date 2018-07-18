import { SwimFtpHelperComponent } from "./swim-ftp-helper.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MaterialModule } from "../../shared/modules/material.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";

describe("SwimFtpHelperComponent", () => {

	let component: SwimFtpHelperComponent;
	let fixture: ComponentFixture<SwimFtpHelperComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule, BrowserAnimationsModule],
			declarations: [SwimFtpHelperComponent]
		}).compileComponents();
		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SwimFtpHelperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should convert swim speed to pace (1)", (done: Function) => {

		// Given
		const swimFtp = 1;
		const expected = "01:40:00";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
		done();
	});

	it("should convert swim speed to pace (2)", (done: Function) => {

		// Given
		const swimFtp = 31;
		const expected = "00:03:14";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
		done();
	});

	it("should convert swim speed to pace (3)", (done: Function) => {

		// Given
		const swimFtp = 500;
		const expected = "00:00:12";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
		done();
	});

	it("should convert swim speed to pace (4)", (done: Function) => {

		// Given
		const swimFtp = 57;
		const expected = "00:01:45";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
		done();
	});

	it("should convert pace to swim speed (1)", (done: Function) => {

		// Given
		const pace = "00:03:14";
		const expected = 30.93;

		// When
		const actual = SwimFtpHelperComponent.convertPaceToSwimSpeed(pace);

		// Then
		expect(actual).toEqual(expected);
		done();
	});

	it("should convert pace to swim speed (2)", (done: Function) => {

		// Given
		const pace = "00:00:12";
		const expected = 500;

		// When
		const actual = SwimFtpHelperComponent.convertPaceToSwimSpeed(pace);

		// Then
		expect(actual).toEqual(expected);
		done();
	});
});
