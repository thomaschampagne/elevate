import { AnalysisDataModel } from "../../../../common/scripts/models/ActivityData";
import { IComputeActivityThreadMessage } from "../../interfaces/IComputeActivityThreadMessage";
import { ActivityComputer } from "../ActivityComputer";

export function ComputeAnalysisWorker() {

	this.onmessage = function (mainThreadEvent: MessageEvent) {

        const threadMessage: IComputeActivityThreadMessage = mainThreadEvent.data;

        importScripts("chrome-extension://" + mainThreadEvent.data.appResources.extensionId + "/node_modules/systemjs/dist/system.js");
        SystemJS.config(mainThreadEvent.data.systemJsConfig);

        Promise.all([
            SystemJS.import("chrome-extension://" + mainThreadEvent.data.appResources.extensionId + "/node_modules/lodash/lodash.min.js"),
            SystemJS.import("chrome-extension://" + mainThreadEvent.data.appResources.extensionId + "/common/scripts/Helper.js"),
        ]).then(() => {

            return SystemJS.import("chrome-extension://" + mainThreadEvent.data.appResources.extensionId + "/core/scripts/processors/ActivityComputer.js");

        }).then((module: any) => {
            const analysisComputer: ActivityComputer = new module.ActivityComputer(
                threadMessage.activityType,
                threadMessage.isTrainer,
                threadMessage.userSettings,
                threadMessage.athleteWeight,
                threadMessage.isActivityAuthor,
                threadMessage.hasPowerMeter,
                threadMessage.activityStatsMap,
                threadMessage.activityStream,
                threadMessage.bounds,
                threadMessage.returnZones);
			const result: AnalysisDataModel = analysisComputer.compute();
            this.postMessage(result);
        });

    };
}
