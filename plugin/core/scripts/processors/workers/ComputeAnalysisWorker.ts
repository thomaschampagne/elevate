import {IAnalysisData} from "../../interfaces/IActivityData";
import {ActivityComputer} from "../ActivityComputer";
import {IComputeActivityThreadMessage} from "../../interfaces/IComputeActivityThreadMessage";

export function ComputeAnalysisWorker() {

    this.onmessage = function (mainThreadEvent: MessageEvent) {

        let threadMessage: IComputeActivityThreadMessage = mainThreadEvent.data;

        importScripts('chrome-extension://' + mainThreadEvent.data.appResources.extensionId + '/node_modules/systemjs/dist/system.js');
        SystemJS.config(mainThreadEvent.data.systemJsConfig);

        Promise.all([
            SystemJS.import('chrome-extension://' + mainThreadEvent.data.appResources.extensionId + '/node_modules/lodash/lodash.min.js'),
            SystemJS.import('chrome-extension://' + mainThreadEvent.data.appResources.extensionId + '/core/scripts/Helper.js'),
        ]).then(() => {

            return SystemJS.import('chrome-extension://' + mainThreadEvent.data.appResources.extensionId + '/core/scripts/processors/ActivityComputer.js');

        }).then((module: any) => {
            let analysisComputer: ActivityComputer = new module.ActivityComputer(threadMessage.activityType, threadMessage.isTrainer, threadMessage.userSettings, threadMessage.athleteWeight, threadMessage.hasPowerMeter, threadMessage.activityStatsMap, threadMessage.activityStream, threadMessage.bounds, threadMessage.returnZones);
            let result: IAnalysisData = analysisComputer.compute();
            this.postMessage(result);
        });

    };
}

