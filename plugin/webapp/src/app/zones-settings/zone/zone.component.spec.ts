import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneComponent } from './zone.component';
import { MaterialModule } from "../../material.module";
import { FormsModule } from "@angular/forms";
import { ZonesService } from "../../services/zones.service";

xdescribe('ZoneComponent', () => {
	let component: ZoneComponent;
	let fixture: ComponentFixture<ZoneComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule],
			declarations: [ZoneComponent],
			providers: [ZonesService]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ZoneComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
