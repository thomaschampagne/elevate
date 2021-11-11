import { IpcListener } from "./ipc-listener.interface";
import { inject, singleton } from "tsyringe";
import { ProfileBackupService } from "../backups/profile-backup.service";
import { IpcTunnelService } from "@elevate/shared/electron/ipc-tunnel";
import { Channel } from "@elevate/shared/electron/channels.enum";

@singleton()
export class IpcProfileBackupListener implements IpcListener {
  constructor(@inject(ProfileBackupService) private readonly profileBackupService: ProfileBackupService) {}

  public startListening(ipcTunnelService: IpcTunnelService): void {
    ipcTunnelService.on<Array<[string]>, string>(Channel.backupInit, payload => {
      const [targetArchivePath] = payload[0];
      return this.handleInitProfileBackup(targetArchivePath);
    });

    ipcTunnelService.on<Array<[object, boolean]>, void>(Channel.backupWriteObj, payload => {
      const [obj, isLastObj] = payload[0];
      return this.handleBackupWriteObj(obj, isLastObj);
    });

    ipcTunnelService.on<Array<[string]>, void>(Channel.restoreInit, payload => {
      const [targetArchivePath] = payload[0];
      return this.handleInitProfileRestore(targetArchivePath, ipcTunnelService);
    });
  }

  private handleInitProfileBackup(targetArchivePath: string): Promise<string> {
    return this.profileBackupService.initBackup(targetArchivePath);
  }

  private handleBackupWriteObj(obj: object, isLastObj: boolean): Promise<void> {
    return this.profileBackupService.write(obj, isLastObj);
  }

  private handleInitProfileRestore(targetArchivePath: string, ipcTunnelService: IpcTunnelService): Promise<void> {
    return this.profileBackupService.initRestore(targetArchivePath, ipcTunnelService);
  }
}
