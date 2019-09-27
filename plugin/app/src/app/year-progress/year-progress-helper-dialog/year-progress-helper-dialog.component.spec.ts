import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog.component";
import { CoreModule } from "../../core/core.module";
import { MatDialogRef } from "@angular/material/dialog";
import { SharedModule } from "../../shared/shared.module";
import { YearProgressModule } from "../year-progress.module";

describe("YearProgressHelperDialogComponent", () => {
	let component: YearProgressHelperDialogComponent;
	let fixture: ComponentFixture<YearProgressHelperDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
				YearProgressModule
			],
			declarations: [],
			providers: [
				{
					provide: MatDialogRef, useValue: {},
				}
			]
		}).compileComponents();

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(YearProgressHelperDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
