import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendWelcomeDialogComponent } from "./fitness-trend-welcome-dialog.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { FitnessTrendModule } from "../fitness-trend.module";

describe("FitnessTrendWelcomeDialogComponent", () => {
	let component: FitnessTrendWelcomeDialogComponent;
	let fixture: ComponentFixture<FitnessTrendWelcomeDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			]
		}).compileComponents();
		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendWelcomeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
