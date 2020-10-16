import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HelpComponent } from "./help.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";

describe("HelpComponent", () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();
    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(HelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
