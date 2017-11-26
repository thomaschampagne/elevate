import { inject, TestBed } from '@angular/core/testing';

import { UserSettingsService } from './user-settings.service';

describe('UserSettingsService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [UserSettingsService]
		});
	});

	it('should be created', inject([UserSettingsService], (service: UserSettingsService) => {
		expect(service).toBeTruthy();
	}));

	it('should be update settings', inject([UserSettingsService], (service: UserSettingsService) => {
		expect(service).toBeTruthy();
	}));
});
