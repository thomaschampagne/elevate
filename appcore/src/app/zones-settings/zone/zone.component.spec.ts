import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ZoneComponent } from "./zone.component";
import { ZonesService } from "../shared/zones.service";
import { ZoneChangeWhisperModel } from "../shared/zone-change-whisper.model";
import { ZoneChangeTypeModel } from "./zone-change-type.model";
import { SharedModule } from "../../shared/shared.module";
import { CoreModule } from "../../core/core.module";

describe("ZoneComponent", () => {

	let component: ZoneComponent;

	let fixture: ComponentFixture<ZoneComponent>;

	let zonesService: ZonesService;

	beforeEach((done: Function) => {

		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule
			]
		}).compileComponents();

		zonesService = TestBed.get(ZonesService);

		done();
	});

	beforeEach((done: Function) => {
		fixture = TestBed.createComponent(ZoneComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		done();
	});

	it("should create", (done: Function) => {
		expect(component).toBeTruthy();
		done();
	});

	it("should notify properly a \"from\" zone change", (done: Function) => {

		// Given
		const sourceId = 5;
		const zoneFrom = 50;
		const zoneTo = 75;
		const changeType: ZoneChangeTypeModel = {from: true, to: false};

		const expectedChange: ZoneChangeWhisperModel = {
			sourceId: sourceId,
			from: true,
			to: false,
			value: zoneFrom
		};

		spyOn(zonesService, "whisperZoneChange").and.stub();
		component.zoneId = sourceId;
		component.zone = {
			from: zoneFrom,
			to: zoneTo
		};

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(1);
		expect(zonesService.whisperZoneChange).toHaveBeenCalledWith(expectedChange);
		done();

	});

	it("should notify properly a \"to\" zone change", (done: Function) => {

		// Given
		const sourceId = 5;
		const zoneFrom = 50;
		const zoneTo = 75;
		const changeType: ZoneChangeTypeModel = {from: false, to: true};

		const expectedChange: ZoneChangeWhisperModel = {
			sourceId: sourceId,
			from: false,
			to: true,
			value: zoneTo
		};

		spyOn(zonesService, "whisperZoneChange").and.stub();
		component.zoneId = sourceId;
		component.zone = {
			from: zoneFrom,
			to: zoneTo
		};

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(1);
		expect(zonesService.whisperZoneChange).toHaveBeenCalledWith(expectedChange);
		done();
	});

	it("should skip notify is from + to changes (On first display)", (done: Function) => {

		// Given
		const changeType: ZoneChangeTypeModel = {from: true, to: true};
		spyOn(zonesService, "whisperZoneChange").and.stub();

		// When
		component.whisperZoneChange(changeType);

		// Then
		expect(zonesService.whisperZoneChange).toHaveBeenCalledTimes(0);
		done();
	});
});
