import { HttpClient as TypedRestClient } from "typed-rest-client/HttpClient";
import { inject, singleton } from "tsyringe";
import pRetry from "p-retry";
import { IHeaders, IHttpClientResponse } from "typed-rest-client/Interfaces";
import { Logger } from "../logger";

@singleton()
export class HttpClient extends TypedRestClient {
  private static RESOLVE_PROXY_TEST_URL = "https://no.where";
  private static DIRECT_PROXY_TEST_URL = "DIRECT";

  constructor(@inject(Logger) private readonly logger: Logger) {
    super("vsts-node-api", null, {});
  }

  public detectProxy(rootBrowserWindow: Electron.BrowserWindow) {
    this.resolveProxy(rootBrowserWindow).then(httpProxy => {
      this.logger.info("Using proxy value: " + httpProxy);
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

  public getRetryTimeout(
    requestUrl: string,
    additionalHeaders?: IHeaders,
    retries: number = 45,
    minTimeout: number = 1000,
    maxTimeout: number = 5000
  ): Promise<IHttpClientResponse> {
    const exec: () => Promise<IHttpClientResponse> = () => {
      return this.get(requestUrl, additionalHeaders);
    };
    return pRetry(exec, {
      retries: retries,
      minTimeout: minTimeout,
      maxTimeout: maxTimeout,
      onFailedAttempt: error => {
        this.logger.error(
          `Attempt ${error.attemptNumber} failed on url ${requestUrl}. There are ${error.retriesLeft} retries left. Cause:`,
          error
        );
      }
    });
  }
}
