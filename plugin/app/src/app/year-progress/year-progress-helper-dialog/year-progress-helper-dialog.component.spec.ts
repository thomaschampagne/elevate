import { ComponentFixture, TestBed } from "@angular/core/testing";

import { YearProgressHelperDialogComponent } from "./year-progress-helper-dialog.component";
import { CoreModule } from "../../core/core.module";
import { MatDialogRef } from "@angular/material";
import { SharedModule } from "../../shared/shared.module";

describe("YearProgressHelperDialogComponent", () => {
	let component: YearProgressHelperDialogComponent;
	let fixture: ComponentFixture<YearProgressHelperDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
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

	beforeEach(() => {
		fixture = TestBed.createComponent(YearProgressHelperDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
