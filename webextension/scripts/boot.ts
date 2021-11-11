import "fancyboxCss";
import "../css/core.css";
import { Elevate } from "./elevate";
import $ from "jquery";
import * as fancyboxBoot from "fancybox";
import { StartCoreDataModel } from "./models/start-core-data.model";
import { CoreMessages } from "@elevate/shared/models/core-messages";

class Boot {
  public static main(): void {
    fancyboxBoot($);

    addEventListener(CoreMessages.ON_START_CORE_EVENT, (event: any) => {
      const initData: StartCoreDataModel = event.detail as StartCoreDataModel;
      const elevate = new Elevate(initData.userSettings, initData.appResources);
      elevate.run();
    });
  }
}

Boot.main();
