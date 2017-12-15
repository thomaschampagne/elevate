import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleasesNotesComponent } from './releases-notes.component';

describe('ReleasesNotesComponent', () => {
	let component: ReleasesNotesComponent;
	let fixture: ComponentFixture<ReleasesNotesComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ReleasesNotesComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ReleasesNotesComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
