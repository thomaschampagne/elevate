import { TestBed, inject } from '@angular/core/testing';

import { ChromeStorageService } from './chrome-storage.service';

describe('ChromeStorageService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [ChromeStorageService]
		});
	});

	it('should be created', inject([ChromeStorageService], (service: ChromeStorageService) => {
		expect(service).toBeTruthy();
	}));
});
