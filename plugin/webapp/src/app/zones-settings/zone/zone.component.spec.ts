import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IZoneChangeType, ZoneComponent } from './zone.component';
import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
import { IZoneChangeWhisper, ZonesService } from "../../services/zones/zones.service";
import { UserSettingsService } from "../../services/user-settings/user-settings.service";
import { UserSettingsDao } from "../../dao/user-settings/user-settings.dao";

describe('ZoneComponent', () => {

	let component: ZoneComponent;

	let fixture: ComponentFixture<ZoneComponent>;

	let zonesService: ZonesService;

	beforeEach(async(() => {

		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule],
			declarations: [ZoneComponent],
			providers: [ZonesService, UserSettingsService, UserSettingsDao]
		}).compileComponents();

		zonesService = TestBed.get(ZonesService);
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZoneComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should notify properly a "from" zone change', () => {

		// Given
		const sourceId = 5;
		const zoneFrom = 50;
		const zoneTo = 75;
		const changeType: IZoneChangeType = {from: true, to: false};

		const expectedChange: IZoneChangeWhisper = {
			sourceId: sourceId,
			from: true,
			to: false,
			value: zoneFrom
		};

		spyOn(zonesService, 'whisperZoneChange').and.stub();
		spyOnProperty(component, 'zoneId', 'get').and.returnValue(sourceId);
		spyOnProperty(component, 'zone', 'get').and.returnValue({
			from: zoneFrom,
			to: zoneTo
		});

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(1);
		expect(zonesService.whisperZoneChange).toHaveBeenCalledWith(expectedChange);

	});

	it('should notify properly a "to" zone change', () => {

		// Given
		const sourceId = 5;
		const zoneFrom = 50;
		const zoneTo = 75;
		const changeType: IZoneChangeType = {from: false, to: true};

		const expectedChange: IZoneChangeWhisper = {
			sourceId: sourceId,
			from: false,
			to: true,
			value: zoneTo
		};

		spyOn(zonesService, 'whisperZoneChange').and.stub();
		spyOnProperty(component, 'zoneId', 'get').and.returnValue(sourceId);
		spyOnProperty(component, 'zone', 'get').and.returnValue({
			from: zoneFrom,
			to: zoneTo
		});

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(1);
		expect(zonesService.whisperZoneChange).toHaveBeenCalledWith(expectedChange);

	});

	it('should skip notify is from + to changes (On first display)', () => {

		// Given
		const changeType: IZoneChangeType = {from: true, to: true};
		spyOn(zonesService, 'whisperZoneChange').and.stub();

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(0);

	});
});
