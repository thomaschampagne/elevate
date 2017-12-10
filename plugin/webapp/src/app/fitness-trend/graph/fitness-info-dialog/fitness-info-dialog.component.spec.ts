import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FitnessInfoDialogComponent } from './fitness-info-dialog.component';

xdescribe('FitnessInfoDialogComponent', () => {
	let component: FitnessInfoDialogComponent;
	let fixture: ComponentFixture<FitnessInfoDialogComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [FitnessInfoDialogComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(FitnessInfoDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
