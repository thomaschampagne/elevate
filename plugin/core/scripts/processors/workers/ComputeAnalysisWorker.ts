import * as _ from "lodash";
import { IAnalysisData } from "../../../../common/scripts/interfaces/IActivityData";
import { IComputeActivityThreadMessage } from "../../interfaces/IComputeActivityThreadMessage";
import { ActivityComputer } from "../ActivityComputer";

export default
    onmessage = (mainThreadEvent: MessageEvent) => {

        const threadMessage: IComputeActivityThreadMessage = mainThreadEvent.data;

        if (_.isObject(threadMessage)) {
            const analysisComputer: ActivityComputer = new ActivityComputer(threadMessage.activityType, threadMessage.isTrainer, threadMessage.userSettings, threadMessage.athleteWeight, threadMessage.hasPowerMeter, threadMessage.activityStatsMap, threadMessage.activityStream, threadMessage.bounds, threadMessage.returnZones);
            const result: IAnalysisData = analysisComputer.compute();
            postMessage(result);
        }
    };

