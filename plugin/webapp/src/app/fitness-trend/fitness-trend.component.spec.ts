import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessTrendComponent } from './fitness-trend.component';
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { SideNavService } from "../shared/services/side-nav/side-nav.service";

describe('FitnessTrendComponent', () => {
	let component: FitnessTrendComponent;
	let fixture: ComponentFixture<FitnessTrendComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				CoreModule,
				SharedModule,
			],
			providers: [SideNavService]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessTrendComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
