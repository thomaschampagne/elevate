import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AboutDialogComponent } from "./about-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MatDialogRef } from "@angular/material";
import { DataStore } from "../shared/data-store/data-store";
import { MockedDataStore } from "../shared/data-store/impl/spec/mocked-data-store.service";

describe("AboutDialogComponent", () => {
	let component: AboutDialogComponent;
	let fixture: ComponentFixture<AboutDialogComponent>;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<void> = new MockedDataStore();

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{
					provide: MatDialogRef, useValue: {},
				},
				{provide: DataStore, useValue: mockedDataStore}
			]
		}).compileComponents();
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(AboutDialogComponent);
		component = fixture.componentInstance;

		const version = "1.0.0";
		spyOn(component, "getAppVersion").and.returnValue(version);
		spyOn(component, "getProdAppVersion").and.returnValue(Promise.resolve(version));

		fixture.detectChanges();

		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
