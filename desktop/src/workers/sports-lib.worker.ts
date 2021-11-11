import { SportsLibProcessor } from "../processors/sports-lib.processor";
import { parentPort, workerData } from "worker_threads";
import { serializeError } from "serialize-error";

export interface SportsLibWorkerParams {
  path: string;
}

SportsLibProcessor.getEvent(workerData.path)
  .then(result => {
    parentPort.postMessage({ data: result });
  })
  .catch(error => {
    parentPort.postMessage({ error: serializeError(error) });
  });
