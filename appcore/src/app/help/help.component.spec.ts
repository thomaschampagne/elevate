import { ComponentFixture, TestBed } from "@angular/core/testing";

import { HelpComponent } from "./help.component";
import { CoreModule } from "../core/core.module";
import { SharedModule } from "../shared/shared.module";
import { DataStore } from "../shared/data-store/data-store";
import { TestingDataStore } from "../shared/data-store/testing-datastore.service";
import { TargetModule } from "../shared/modules/target/desktop-target.module";
import { IPC_TUNNEL_SERVICE } from "../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../desktop/ipc/ipc-renderer-tunnel-service.mock";

describe("HelpComponent", () => {
  let component: HelpComponent;
  let fixture: ComponentFixture<HelpComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
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
