import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AboutDialogComponent } from "./about-dialog.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { MatDialogRef } from "@angular/material";
import { AppUsageService } from "../shared/services/app-usage/app-usage.service";
import { AppUsageDao } from "../shared/dao/app-usage/app-usage.dao";
import { AppUsageDetails } from "../shared/models/app-usage-details.model";
import { AppUsage } from "../shared/models/app-usage.model";

describe("AboutDialogComponent", () => {
	let component: AboutDialogComponent;
	let fixture: ComponentFixture<AboutDialogComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [
				{
					provide: MatDialogRef, useValue: {},
				},
				AppUsageService,
				AppUsageDao
			]
		}).compileComponents();
		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(AboutDialogComponent);
		component = fixture.componentInstance;

		const version = "1.0.0";
		spyOn(component, "getAppVersion").and.returnValue(version);

		const bytes = 1024;
		const appUsage = new AppUsage(bytes, 4096);
		const megaBytesInUse = bytes / (1024 * 1024);
		const percentageUsage = 25;
		spyOn(component.appUsageService, "get").and.returnValue(Promise.resolve(new AppUsageDetails(appUsage, megaBytesInUse, percentageUsage)));

		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});
});
