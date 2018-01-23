import { SwimFtpHelperComponent } from "./swim-ftp-helper.component";
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { MaterialModule } from "../../shared/modules/material.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";

describe("SwimFtpHelperComponent", () => {

	let component: SwimFtpHelperComponent;
	let fixture: ComponentFixture<SwimFtpHelperComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule, BrowserAnimationsModule],
			declarations: [SwimFtpHelperComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SwimFtpHelperComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});

	it("should convert swim speed to pace (1)", () => {

		// Given
		const swimFtp = 1;
		const expected = "01:40:00";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
	});

	it("should convert swim speed to pace (2)", () => {

		// Given
		const swimFtp = 31;
		const expected = "00:03:14";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
	});

	it("should convert swim speed to pace (3)", () => {

		// Given
		const swimFtp = 500;
		const expected = "00:00:12";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
	});

	it("should convert swim speed to pace (4)", () => {

		// Given
		const swimFtp = 57;
		const expected = "00:01:45";

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe(expected);
	});

	it("should convert pace to swim speed (1)", () => {

		// Given
		const pace: string = "00:03:14";
		const expected: number = 30.93;

		// When
		const actual = SwimFtpHelperComponent.convertPaceToSwimSpeed(pace);

		// Then
		expect(actual).toEqual(expected);
	});

	it("should convert pace to swim speed (2)", () => {

		// Given
		const pace: string = "00:00:12";
		const expected: number = 500;

		// When
		const actual = SwimFtpHelperComponent.convertPaceToSwimSpeed(pace);

		// Then
		expect(actual).toEqual(expected);
	});
});
