import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ActivityViewComponent } from "./activity-view.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { DesktopModule } from "../shared/modules/desktop/desktop.module";
import { ElectronService, ElectronWindow } from "../shared/services/electron/electron.service";

describe("ActivityViewComponent", () => {
    let component: ActivityViewComponent;
    let fixture: ComponentFixture<ActivityViewComponent>;

    beforeEach(done => {
        TestBed.configureTestingModule({
            imports: [
                CoreModule,
                SharedModule,
                DesktopModule
            ]
        }).compileComponents();
        const electronService: ElectronService = TestBed.inject(ElectronService);
        electronService.instance = {
            ipcRenderer: {}
        };

        const electronWindow = (window as ElectronWindow);
        const electronRequire = (module: string) => {
            console.log("Loading module: " + module);
            return {};
        };
        electronWindow.require = electronRequire;
        spyOn(electronWindow, "require").and.callFake(electronRequire);
        done();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ActivityViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
