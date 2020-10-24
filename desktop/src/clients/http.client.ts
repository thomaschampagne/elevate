import { HttpClient as TypedRestClient } from "typed-rest-client/HttpClient";
import { singleton } from "tsyringe";
import logger from "electron-log";

@singleton()
export class HttpClient extends TypedRestClient {
  private static RESOLVE_PROXY_TEST_URL = "https://no.where";
  private static DIRECT_PROXY_TEST_URL = "DIRECT";

  constructor() {
    super("vsts-node-api", null, {});
  }

  public detectProxy(rootBrowserWindow: Electron.BrowserWindow) {
    this.resolveProxy(rootBrowserWindow).then(httpProxy => {
      logger.info("Using proxy value: " + httpProxy);
      this.setProxy(httpProxy);
    });
  }

  public setProxy(httpProxy: string): void {
    this.requestOptions = httpProxy ? { proxy: { proxyUrl: httpProxy } } : null;
  }

  private resolveProxy(rootBrowserWindow: Electron.BrowserWindow): Promise<string> {
    return new Promise(resolve => {
      rootBrowserWindow.webContents.session.resolveProxy(HttpClient.RESOLVE_PROXY_TEST_URL).then((proxy: string) => {
        const httpProxy =
          proxy !== HttpClient.DIRECT_PROXY_TEST_URL ? "http://" + proxy.replace("PROXY", "").trim() : null;
        resolve(httpProxy);
      });
    });
  }
}
