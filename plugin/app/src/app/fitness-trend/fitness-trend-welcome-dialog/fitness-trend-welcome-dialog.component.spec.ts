import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendWelcomeDialogComponent } from "./fitness-trend-welcome-dialog.component";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { MatDialogRef } from "@angular/material";

describe("FitnessTrendWelcomeDialogComponent", () => {
	let component: FitnessTrendWelcomeDialogComponent;
	let fixture: ComponentFixture<FitnessTrendWelcomeDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				FitnessTrendModule
			],
			providers: [
				{
					provide: MatDialogRef, useValue: {},
				},
			]
		}).compileComponents();
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(FitnessTrendWelcomeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
