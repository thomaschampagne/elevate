import "fancyboxCss";
import "../css/core.css";
import { Elevate } from "./elevate";
import * as fancybox from "fancybox";
import { StartCoreDataModel } from "./models/start-core-data.model";
import { CoreMessages } from "@elevate/shared/models/core-messages";

class Boot {
  public static main(): void {
    if (!window.jQuery) {
      console.warn("Missing jQuery, elevate will not run");
      return;
    }

    window.$ = window.jQuery;
    window.fancybox = fancybox;
    window.fancybox(window.$);

    addEventListener(CoreMessages.ON_START_CORE_EVENT, (event: CustomEvent) => {
      const initData: StartCoreDataModel = event.detail as StartCoreDataModel;
      const elevate = new Elevate(initData.userSettings, initData.appResources);
      elevate.run();
    });
  }
}

Boot.main();
