import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwimFtpHelperComponent } from './swim-ftp-helper.component';

describe('SwimFtpHelperComponent', () => {
  let component: SwimFtpHelperComponent;
  let fixture: ComponentFixture<SwimFtpHelperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SwimFtpHelperComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SwimFtpHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
