import { TestBed } from "@angular/core/testing";

import { ExtensionActivityService } from "./extension-activity.service";
import { CoreModule } from "../../../../core/core.module";
import { SharedModule } from "../../../shared.module";
import { ExtensionModule } from "../../../modules/extension/extension.module";
import { DataStore } from "../../../data-store/data-store";
import { TestingDataStore } from "../../../data-store/testing-datastore.service";

describe("ExtensionActivityService", () => {
  let service: ExtensionActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule, ExtensionModule],
      providers: [ExtensionActivityService, { provide: DataStore, useClass: TestingDataStore }]
    });
    service = TestBed.inject(ExtensionActivityService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
