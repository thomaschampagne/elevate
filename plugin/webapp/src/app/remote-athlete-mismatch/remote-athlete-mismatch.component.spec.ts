import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteAthleteMismatchComponent } from './remote-athlete-mismatch.component';

describe('RemoteAthleteMismatchComponent', () => {
	let component: RemoteAthleteMismatchComponent;
	let fixture: ComponentFixture<RemoteAthleteMismatchComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [RemoteAthleteMismatchComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(RemoteAthleteMismatchComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
