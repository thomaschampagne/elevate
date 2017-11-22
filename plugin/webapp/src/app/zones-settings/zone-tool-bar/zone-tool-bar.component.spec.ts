import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneToolBarComponent } from './zone-tool-bar.component';
import { FormsModule } from "@angular/forms";
import { MaterialModule } from "../../material.module";
import { ZonesService } from "../../services/zones.service";

xdescribe('ZoneToolBarComponent', () => {
	let component: ZoneToolBarComponent;
	let fixture: ComponentFixture<ZoneToolBarComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [FormsModule, MaterialModule],
			declarations: [ZoneToolBarComponent],
			providers: [ZonesService]
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
