import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DonateComponent } from "./donate.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";

describe("DonateComponent", () => {
  let component: DonateComponent;
  let fixture: ComponentFixture<DonateComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [{ provide: DataStore, useClass: TestingDataStore }]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(DonateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
