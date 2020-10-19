import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendInputsComponent } from "./fitness-trend-inputs.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { FitnessTrendModule } from "../fitness-trend.module";
import { FitnessTrendComponent } from "../fitness-trend.component";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";

describe("FitnessTrendInputsComponent", () => {
  let component: FitnessTrendInputsComponent;
  let fixture: ComponentFixture<FitnessTrendInputsComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule, FitnessTrendModule]
    }).compileComponents();

    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(FitnessTrendInputsComponent);

    component = fixture.componentInstance;

    component.fitnessTrendConfigModel = FitnessTrendComponent.DEFAULT_CONFIG;

    component.periodViewed = {
      from: new Date(),
      to: new Date()
    };

    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
