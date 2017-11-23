import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneComponent } from './zone.component';
import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
import { IZoneChange, ZonesService } from "../../services/zones.service";

describe('ZoneComponent', () => {
	let component: ZoneComponent;
	let fixture: ComponentFixture<ZoneComponent>;
	let zonesService: ZonesService;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule],
			declarations: [ZoneComponent],
			providers: [ZonesService]
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
		const zoneChanges = {_zoneFrom: zoneFrom};

		const expectedChange: IZoneChange = {
			sourceId: sourceId,
			from: true,
			to: false,
			value: zoneFrom
		};

		spyOn(zonesService, 'notifyChange').and.stub();
		spyOnProperty(component, 'zoneId', 'get').and.returnValue(sourceId);
		spyOnProperty(component, 'zone', 'get').and.returnValue({
			from: zoneFrom,
			to: zoneTo
		});

		// When
		component.notifyChange(zoneChanges);

		// Then
		expect(zonesService.notifyChange).toHaveBeenCalledTimes(1);
		expect(zonesService.notifyChange).toHaveBeenCalledWith(expectedChange);

	});

	it('should notify properly a "to" zone change', () => {

		// Given
		const sourceId = 5;
		const zoneFrom = 50;
		const zoneTo = 75;
		const zoneChanges = {_zoneTo: zoneTo};

		const expectedChange: IZoneChange = {
			sourceId: sourceId,
			from: false,
			to: true,
			value: zoneTo
		};

		spyOn(zonesService, 'notifyChange').and.stub();
		spyOnProperty(component, 'zoneId', 'get').and.returnValue(sourceId);
		spyOnProperty(component, 'zone', 'get').and.returnValue({
			from: zoneFrom,
			to: zoneTo
		});

		// When
		component.notifyChange(zoneChanges);

		// Then
		expect(zonesService.notifyChange).toHaveBeenCalledTimes(1);
		expect(zonesService.notifyChange).toHaveBeenCalledWith(expectedChange);

	});

	it('should skip notify is from + to changes (On first display)', () => {

		// Given
		const zoneFrom = 50;
		const zoneTo = 75;
		const zoneChanges = {_zoneFrom: zoneFrom, _zoneTo: zoneTo};
		spyOn(zonesService, 'notifyChange').and.stub();

		// When
		component.notifyChange(zoneChanges);

		// Then
		expect(zonesService.notifyChange).toHaveBeenCalledTimes(0);

	});
});
