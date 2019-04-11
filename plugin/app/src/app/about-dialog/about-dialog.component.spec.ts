import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AboutDialogComponent } from "./about-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MatDialogRef } from "@angular/material";
import { DataStore } from "../shared/data-store/data-store";
import { MockedDataStore } from "../shared/data-store/impl/mock/mocked-data-store.service";
import { VERSIONS_PROVIDER } from "../shared/services/versions/versions-provider.interface";
import { MockedVersionsProvider } from "../shared/services/versions/impl/mock/mocked-versions-provider";

describe("AboutDialogComponent", () => {
	let component: AboutDialogComponent;
	let fixture: ComponentFixture<AboutDialogComponent>;

	beforeEach((done: Function) => {

		const mockedDataStore: MockedDataStore<void> = new MockedDataStore();
		const mockedVersionsProvider: MockedVersionsProvider = new MockedVersionsProvider();

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{
					provide: MatDialogRef, useValue: {},
				},
				{provide: DataStore, useValue: mockedDataStore},
				{provide: VERSIONS_PROVIDER, useValue: mockedVersionsProvider}
			]
		}).compileComponents();
		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(AboutDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
