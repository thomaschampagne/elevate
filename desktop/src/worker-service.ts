import { inject, singleton } from "tsyringe";
import { AppService } from "./app-service";
import { Worker } from "worker_threads";
import { WorkerType } from "./enum/worker-type.enum";
import { deserializeError } from "serialize-error";

@singleton()
export class WorkerService {
  constructor(@inject(AppService) protected readonly appService: AppService) {}

  private getWorkerScriptPath(workerType: WorkerType): string {
    return this.appService.isPackaged
      ? `${this.appService.getResourceFolder()}/app.asar.unpacked/dist/workers/${workerType}.worker.js`
      : `${__dirname}/workers/${workerType}.worker.js`;
  }

  public exec<P, R>(workerType: WorkerType, params: P): Promise<R> {
    const workerScriptPath = this.getWorkerScriptPath(workerType);
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerScriptPath, {
        workerData: params
      });

      worker.on("message", result => {
        if (result.error) {
          reject(deserializeError(result.error));
        } else {
          resolve(result.data);
        }
      });
    });
  }
}
