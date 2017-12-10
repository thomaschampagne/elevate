import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { AthleteSettingsComponent } from "./athlete-settings.component";
import { MaterialModule } from "../shared/modules/material.module";
import { SwimFtpHelperComponent } from "./swim-ftp-helper/swim-ftp-helper.component";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import { UserSettingsDao } from "../shared/dao/user-settings/user-settings.dao";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

xdescribe("AthleteSettingsComponent", () => {
	let component: AthleteSettingsComponent;
	let fixture: ComponentFixture<AthleteSettingsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule, BrowserAnimationsModule],
			declarations: [AthleteSettingsComponent, SwimFtpHelperComponent],
			providers: [UserSettingsService, UserSettingsDao]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(AthleteSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it("should create", () => {
		expect(component).toBeTruthy();
	});
});
