import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ZonesSettingsComponent } from "./zones-settings.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { userSettings } from "../../../../common/scripts/UserSettings";
import * as _ from "lodash";

describe("ZonesSettingsComponent", () => {

	let component: ZonesSettingsComponent;
	let fixture: ComponentFixture<ZonesSettingsComponent>;

	beforeEach((done: Function) => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			]
		}).compileComponents();

		done();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(ZonesSettingsComponent);
		component = fixture.componentInstance;

		spyOn(component.userSettingsService, "fetch").and.returnValue(Promise.resolve(_.cloneDeep(userSettings)));

		fixture.detectChanges();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

});
