import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AthleteSettingsFormComponent } from "./athlete-settings-form.component";
import * as _ from "lodash";
import { CoreModule } from "../../../core/core.module";
import { SharedModule } from "../../../shared/shared.module";
import { AthleteSettingsModel, UserSettings } from "@elevate/shared/models";
import { AthleteSettingsModule } from "../../athlete-settings.module";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { DataStore } from "../../../shared/data-store/data-store";
import { TestingDataStore } from "../../../shared/data-store/testing-datastore.service";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

describe("AthleteSettingsFormComponent", () => {
    let component: AthleteSettingsFormComponent;
    let fixture: ComponentFixture<AthleteSettingsFormComponent>;
    let userSettingsService: UserSettingsService;

    beforeEach(done => {
        TestBed.configureTestingModule({
            imports: [CoreModule, SharedModule, AthleteSettingsModule],
            providers: [{ provide: DataStore, useClass: TestingDataStore }],
        }).compileComponents();

        userSettingsService = TestBed.inject(UserSettingsService);
        spyOn(userSettingsService, "fetch").and.returnValue(
            Promise.resolve(_.cloneDeep(DesktopUserSettingsModel.DEFAULT_MODEL))
        );

        done();
    });

    beforeEach(done => {
        fixture = TestBed.createComponent(AthleteSettingsFormComponent);
        component = fixture.componentInstance;
        component.athleteSettingsModel = _.cloneDeep(AthleteSettingsModel.DEFAULT_MODEL);
        fixture.detectChanges();

        done();
    });

    it("should create", done => {
        expect(component).toBeTruthy();
        done();
    });

    it("should convert runningFtp in seconds to pace using imperial system", done => {
        // Given
        component.athleteSettingsModel.runningFtp = 5 * 60; // 5 Minutes
        const expectedPace = "00:08:03/mi";

        // When
        const pace = component.convertToPace("imperial");

        // Then
        expect(pace).toEqual(expectedPace);
        done();
    });

    it("should convert runningFtp in seconds to pace using metric system", done => {
        // Given
        component.athleteSettingsModel.runningFtp = 5 * 60; // 5 Minutes
        const expectedPace = "00:05:00/km";

        // When
        const pace = component.convertToPace("metric");

        // Then
        expect(pace).toEqual(expectedPace);
        done();
    });
});
