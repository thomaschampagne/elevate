import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneToolBarComponent } from './zone-tool-bar.component';
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ZonesService } from "../shared/zones.service";
import { UserSettingsService } from "../../shared/services/user-settings/user-settings.service";
import { Router, RouterModule } from "@angular/router";

xdescribe('ZoneToolBarComponent', () => {
	let component: ZoneToolBarComponent;
	let fixture: ComponentFixture<ZoneToolBarComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule, RouterModule],
			declarations: [ZoneToolBarComponent],
			providers: [ZonesService, UserSettingsService, Router]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZoneToolBarComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
