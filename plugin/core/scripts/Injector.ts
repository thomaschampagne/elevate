import "fancyboxCss";
import "../css/core.css";
import { StravistiX } from "./StravistiX";
import * as $ from "jquery";
import * as fancyboxBoot from "fancybox";
import { MessagesModel } from "../shared/models/messages.model";
import { StartCoreDataModel } from "../shared/models/start-core-data.model";

fancyboxBoot($);

class Injector {
	public static init(): void {
		addEventListener(MessagesModel.ON_START_CORE_EVENT, (event: any) => {
			const initData: StartCoreDataModel = event.detail as StartCoreDataModel;
			new StravistiX(initData.userSettings, initData.appResources);
		});
	}
}

Injector.init();
