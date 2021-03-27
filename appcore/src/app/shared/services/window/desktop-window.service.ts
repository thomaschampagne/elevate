import { Inject, Injectable } from "@angular/core";
import { WindowService } from "./window.service";
import { MediaObserver } from "@angular/flex-layout";
import { Channel, IpcTunnelService } from "@elevate/shared/electron";
import { IPC_TUNNEL_SERVICE } from "../../../desktop/ipc/ipc-tunnel-service.token";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class DesktopWindowService extends WindowService {
  public isFullScreen$: Subject<boolean>;
  public isMaximized$: Subject<boolean>;

  constructor(
    @Inject(MediaObserver) public mediaObserver: MediaObserver,
    @Inject(IPC_TUNNEL_SERVICE) public readonly ipcTunnelService: IpcTunnelService
  ) {
    super(mediaObserver);
    this.isFullScreen$ = new Subject<boolean>();
    this.isMaximized$ = new Subject<boolean>();
    this.listenForChanges();
  }

  private listenForChanges(): void {
    this.ipcTunnelService.on<[boolean], void>(Channel.isFullscreen, payload => {
      const [isFullscreen] = payload;
      this.isFullScreen$.next(isFullscreen);
    });

    this.ipcTunnelService.on<[boolean], void>(Channel.isMaximized, payload => {
      const [isMaximized] = payload;
      this.isMaximized$.next(isMaximized);
    });
  }
}
