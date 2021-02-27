import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FileConnectorComponent } from "./file-connector.component";
import { CoreModule } from "../../core/core.module";
import { SharedModule } from "../../shared/shared.module";
import { DataStore } from "../../shared/data-store/data-store";
import { TestingDataStore } from "../../shared/data-store/testing-datastore.service";
import { TargetModule } from "../../shared/modules/target/desktop-target.module";
import { TargetBootModule } from "../../boot/desktop-boot.module";
import { IPC_TUNNEL_SERVICE } from "../../desktop/ipc/ipc-tunnel-service.token";
import { IpcRendererTunnelServiceMock } from "../../desktop/ipc/ipc-renderer-tunnel-service.mock";

describe("FileConnectorComponent", () => {
  let component: FileConnectorComponent;
  let fixture: ComponentFixture<FileConnectorComponent>;

  beforeEach(done => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, TargetBootModule, TargetModule],
      providers: [
        { provide: DataStore, useClass: TestingDataStore },
        { provide: IPC_TUNNEL_SERVICE, useClass: IpcRendererTunnelServiceMock }
      ]
    }).compileComponents();
    done();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FileConnectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
