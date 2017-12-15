import { inject, TestBed } from '@angular/core/testing';

import { ReleasesNotesService } from './releases-notes.service';

describe('ReleasesNotesService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ReleasesNotesService]
		});
	});

	it('should be created', inject([ReleasesNotesService], (service: ReleasesNotesService) => {
		expect(service).toBeTruthy();
	}));
});
