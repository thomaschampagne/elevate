import { inject, singleton } from "tsyringe";
import { ObjectsStreamCompressor } from "./objects-stream-compressor";
import { IpcMessage } from "@elevate/shared/electron/ipc-message";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class ProfileBackupService {
  constructor(@inject(ObjectsStreamCompressor) private readonly objectsStreamCompressor: ObjectsStreamCompressor) {}

  public initBackup(targetArchivePath: string): Promise<string> {
    if (this.objectsStreamCompressor.isDeflating) {
      return Promise.reject("ObjectsStreamCompressor is already deflating");
    } else {
      return this.objectsStreamCompressor.deflateInit(targetArchivePath);
    }
  }

  public write(obj: object, isLastObj: boolean): Promise<void> {
    return this.objectsStreamCompressor.write(obj, isLastObj);
  }

  public initRestore(targetArchivePath: string, ipcTunnelService: IpcTunnelService): Promise<void> {
    this.objectsStreamCompressor.inflateInit(
      targetArchivePath,
      (obj: object, index: number, err: Error, readEnded: boolean) => {
        return ipcTunnelService.send<[object, number, Error, boolean], void>(
          new IpcMessage(Channel.restoreReadObj, obj, index, err, readEnded)
        );
      }
    );
    return Promise.resolve();
  }
}
