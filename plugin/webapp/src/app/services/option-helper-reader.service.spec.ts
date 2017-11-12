import { TestBed, inject } from '@angular/core/testing';

import { OptionHelperReaderService } from './option-helper-reader.service';

describe('OptionHelperReaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OptionHelperReaderService]
    });
  });

  it('should be created', inject([OptionHelperReaderService], (service: OptionHelperReaderService) => {
    expect(service).toBeTruthy();
  }));
});
