import { inject, TestBed } from '@angular/core/testing';

import { YearProgressService } from './year-progress.service';

describe('YearProgressService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [YearProgressService]
		});
	});

	it('should be created', inject([YearProgressService], (service: YearProgressService) => {
		expect(service).toBeTruthy();
	}));
});
