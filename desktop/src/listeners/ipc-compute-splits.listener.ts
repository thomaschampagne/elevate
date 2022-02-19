import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";
import { SplitRequest } from "@elevate/shared/models/splits/split-request.model";
import { SplitResponse } from "@elevate/shared/models/splits/split-response.model";
import { SplitCalculatorProcessor } from "../processors/split-calculator/split-calculator.processor";

@singleton()
export class IpcComputeSplitsListener implements IpcListener {
  constructor(@inject(SplitCalculatorProcessor) private readonly splitCalculatorService: SplitCalculatorProcessor) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    // Compute activity
    ipcTunnelService.on<Array<[SplitRequest]>, SplitResponse>(Channel.computeSplits, payload => {
      const [splitRequest] = payload[0];
      return this.handleComputeSplits(splitRequest);
    });
  }

  public handleComputeSplits(splitRequest: SplitRequest): Promise<SplitResponse> {
    return this.splitCalculatorService.computeSplits(splitRequest);
  }
}
