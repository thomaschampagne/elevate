import "fancyboxCss";
import "../css/core.css";
import { Elevate } from "./elevate";
import * as $ from "jquery";
import * as fancyboxBoot from "fancybox";
import { CoreMessages } from "../../shared/models/core-messages";
import { StartCoreDataModel } from "../../shared/models/start-core-data.model";

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
