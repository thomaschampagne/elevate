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

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe("01:40:00");
	});

	it("should convert swim speed to pace (2)", () => {

		// Given
		const swimFtp = 31;

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe("00:03:14");
	});

	it("should convert swim speed to pace (3)", () => {

		// Given
		const swimFtp = 500;

		// When
		const actual = SwimFtpHelperComponent.convertSwimSpeedToPace(swimFtp);

		// Then
		expect(actual).toBe("00:00:12");
	});
});
