import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FitnessTrendLegendComponent } from "./fitness-trend-legend.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { FitnessTrendModule } from "../fitness-trend.module";

describe("FitnessTrendLegendComponent", () => {
  let component: FitnessTrendLegendComponent;
  let fixture: ComponentFixture<FitnessTrendLegendComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, FitnessTrendModule],
    }).compileComponents();
    done();
  });

  beforeEach(done => {
    fixture = TestBed.createComponent(FitnessTrendLegendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    done();
  });

  it("should create", done => {
    expect(component).toBeTruthy();
    done();
  });
});
