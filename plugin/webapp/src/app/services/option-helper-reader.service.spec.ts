import { inject, TestBed } from '@angular/core/testing';

import { OptionHelperReaderService } from './option-helper-reader.service';

xdescribe('OptionHelperReaderService', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [OptionHelperReaderService]
		});
	});

	it('should be created', inject([OptionHelperReaderService], (service: OptionHelperReaderService) => {
		expect(service).toBeTruthy();
	}));
});
