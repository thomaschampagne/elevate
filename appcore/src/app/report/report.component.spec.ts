import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReportComponent } from "./report.component";
import { SharedModule } from "../shared/shared.module";
import { CoreModule } from "../core/core.module";

describe("ReportComponent", () => {
    let component: ReportComponent;
    let fixture: ComponentFixture<ReportComponent>;

    beforeEach(done => {
        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                SharedModule,
            ]
        }).compileComponents();

        done();
    });

    beforeEach(done => {
        fixture = TestBed.createComponent(ReportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        done();
    });

    it("should create", done => {
        expect(component).toBeTruthy();
        done();
    });
});
