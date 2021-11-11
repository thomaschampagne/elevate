import { BrowserWindow, IpcMain, IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent, WebContents } from "electron";
import { BridgeApi } from "./bridge.api";
import { Channel } from "./channels.enum";
import { IpcMessage } from "./ipc-message";
import { ElevateException } from "../exceptions/elevate.exception";

enum IpcType {
  MAIN,
  RENDERER
}

export interface IpcChannelSub {
  unsubscribe: () => void;
}

export interface IpcTunnelService {
  /**
   * Receive request from opposite Electron Ipc and respond to her with result
   * @param channel The channel enum value on which param has to transit
   * @param request The callback which return the result or error
   * @return Channel subscription. It includes the ability to unsubscribe (meaning removing channel listeners)
   */
  on<T, R>(channel: Channel, request: (param: T) => R | Promise<R> | void | Error): IpcChannelSub;

  /**
   * Send param in a given channel to the opposite Electron Ipc
   * @param ipcMessage The channel enum value on which payload has to transit
   * @return Result promise
   */
  send<T, R>(ipcMessage: IpcMessage): Promise<R>;

  /**
   * Forward message without acknowledgement and response expectation
   * @param ipcMessage The channel enum value on which payload has to transit
   */
  fwd<T, R>(ipcMessage: IpcMessage): void;
}

export class IpcTunnel {
  private static readonly RESPONSE_SUFFIX: string = "-response";

  private readonly ipcType: IpcType;
  private readonly ipcMain: IpcMain | null;
  private readonly bridgeApi: BridgeApi | null;
  private readonly webContents: WebContents | null;

  constructor(params: { ipcMain?: Electron.IpcMain; browserWindow?: BrowserWindow; bridgeApi?: BridgeApi }) {
    if (
      (!params.ipcMain && !params.bridgeApi) ||
      (params.ipcMain && (!params.browserWindow || !params.browserWindow.webContents)) ||
      (!params.ipcMain && params.browserWindow && params.browserWindow.webContents)
    ) {
      throw new ElevateException("BridgeApi requested on IpcRenderer side OR IpcMain & BrowserWindow for IpcMain side");
    }

    this.ipcMain = params.ipcMain || null;
    this.bridgeApi = params.bridgeApi || null;
    this.webContents = params.browserWindow?.webContents || null;
    this.ipcType = this.ipcMain ? IpcType.MAIN : IpcType.RENDERER;
  }

  /**
   * Send param in a given channel to the opposite Electron Ipc
   * @param channel The channel enum value on which param has to transit
   * @param param The param value to send
   * @return Result promise
   */
  public send<T, R>(channel: Channel, param: T): Promise<R> {
    if (this.ipcType === IpcType.MAIN) {
      return new Promise((resolve, reject) => {
        this.ipcMain.once(`${channel}${IpcTunnel.RESPONSE_SUFFIX}`, (event: IpcMainEvent, ...args: Promise<R>[]) => {
          const response = args[0];
          return response instanceof Error ? reject(response) : resolve(response);
        });
        // Send the request
        this.webContents.send(channel, param);
      });
    } else if (this.ipcType === IpcType.RENDERER) {
      return this.bridgeApi.invoke(channel, param).then(response => {
        return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
      });
    }
  }

  /**
   * Forward message without acknowledgement and response expectation
   * @param channel The channel enum value on which param has to transit
   * @param param The param value to send
   */
  public fwd<T, R>(channel: Channel, param: T): void {
    if (this.ipcType === IpcType.MAIN) {
      this.webContents.send(channel, param);
    } else if (this.ipcType === IpcType.RENDERER) {
      this.bridgeApi.invoke(channel, param).then(() => {});
    }
  }

  /**
   * Receive request from opposite Electron Ipc and respond to her with result
   * @param channel The channel enum value on which param has to transit
   * @param request The callback which return the result or error
   * @return Channel subscription. It includes the ability to unsubscribe (meaning removing channel listeners)
   */
  public on<T, R>(channel: Channel, request: (param: T) => R | Promise<R> | void | Error): IpcChannelSub {
    if (this.ipcType === IpcType.MAIN) {
      this.ipcMain.handle(channel, (event: IpcMainInvokeEvent, ...args: any[]) => {
        return request(args[0]);
      });

      return {
        unsubscribe: () => {
          this.ipcMain.removeHandler(channel);
        }
      };
    } else if (this.ipcType === IpcType.RENDERER) {
      this.bridgeApi.receive(channel, (event: IpcRendererEvent, ...args: any[]) => {
        const response = request(args[0]);
        const responseChannel = `${channel}${IpcTunnel.RESPONSE_SUFFIX}`;

        if (response instanceof Promise) {
          response
            .then(value => {
              event.sender.send(responseChannel, value);
            })
            .catch(errorMessage => {
              event.sender.send(responseChannel, new ElevateException(errorMessage));
            });
        } else {
          event.sender.send(responseChannel, response);
        }
      });

      return {
        unsubscribe: () => {
          this.bridgeApi.unsubscribe(channel);
        }
      };
    }
  }
}
