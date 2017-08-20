import "fancyboxCss";
import { StravistiX } from "./StravistiX";
import { constants } from "../../common/scripts/Constants";
import * as $ from "jquery";
import * as fancyboxPluginBootstraper from "fancybox";

// bootstrap fancybox plugin
fancyboxPluginBootstraper($);

class ScriptsInjector {
  public static init(): void {
    addEventListener("startCoreEvent", (event: any) => {
      const initData: any = event.detail;

      new StravistiX(initData.chromeSettings, initData.appResources);
    });
  }
}

ScriptsInjector.init();
