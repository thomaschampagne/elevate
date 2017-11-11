import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GotItDialogComponent } from './got-it-dialog.component';

describe('GotItDialogComponent', () => {
	let component: GotItDialogComponent;
	let fixture: ComponentFixture<GotItDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
		declarations: [GotItDialogComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
	  fixture = TestBed.createComponent(GotItDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
