import { inject, singleton } from "tsyringe";
import { Logger } from "../logger";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import https from "https";
import * as rax from "retry-axios";
import tunnel from "https-proxy-agent";

@singleton()
export class HttpClient {
  private static RESOLVE_PROXY_TEST_URL = "https://no.where";
  private static DIRECT_PROXY_TEST_URL = "DIRECT";

  private axios: AxiosInstance;

  constructor(@inject(Logger) private readonly logger: Logger) {}

  private createHttpClient(proxyConfig?: { host: string; port: number }): void {
    // Create axios with proxy config
    this.axios = axios.create({
      httpsAgent: proxyConfig ? new tunnel.HttpsProxyAgent(proxyConfig) : new https.Agent({ rejectUnauthorized: false })
    });

    // Configure retry on failures
    this.axios.defaults.raxConfig = {
      instance: this.axios,
      statusCodesToRetry: [
        [100, 199],
        [500, 599]
      ],
      retry: 5, // Retries on requests that return a response (500, etc) before giving up.
      retryDelay: 250,
      noResponseRetries: 2, // Retries on errors that don't return a response (ENOTFOUND, ETIMEDOUT, etc).
      onRetryAttempt: err => {
        const cfg = rax.getConfig(err);
        this.logger.error(
          `Attempt ${cfg.currentRetryAttempt} failed on url ${err.request.url}. Error message: ${err.message}`
        );
      }
    };

    rax.attach(this.axios);
  }

  public configure(rootBrowserWindow: Electron.BrowserWindow): Promise<void> {
    return this.resolveProxy(rootBrowserWindow).then(httpProxy => {
      let proxyConfig: { host: string; port: number } = null;
      if (httpProxy) {
        const [host, port] = httpProxy.split(":");
        proxyConfig = {
          host: host,
          port: parseInt(port, 10)
        };
        this.logger.info(`Using proxy ${proxyConfig.host}:${proxyConfig.port}`);
      } else {
        this.logger.info("No proxy detected");
      }
      this.createHttpClient(proxyConfig);
      return Promise.resolve();
    });
  }

  private resolveProxy(rootBrowserWindow: Electron.BrowserWindow): Promise<string> {
    return new Promise(resolve => {
      rootBrowserWindow.webContents.session.resolveProxy(HttpClient.RESOLVE_PROXY_TEST_URL).then((proxy: string) => {
        const httpProxy = proxy !== HttpClient.DIRECT_PROXY_TEST_URL ? proxy.replace("PROXY", "").trim() : null;
        resolve(httpProxy);
      });
    });
  }

  public post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R> {
    return this.axios.post(url, data, config);
  }

  public get<T = any, R = AxiosResponse<T>>(url: string, config?: AxiosRequestConfig): Promise<R> {
    return this.axios.get(url, config);
  }
}
