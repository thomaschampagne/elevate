import logger from "electron-log";

export class Proxy {

	private static httpProxy: string;

	private static RESOLVE_PROXY_TEST_URL: string = "https://no.where";
	private static DIRECT_PROXY_TEST_URL: string = "DIRECT";

	/**
	 * Resolve system proxy if exists
	 * @param rootBrowserWindow
	 */
	public static resolve(rootBrowserWindow: Electron.BrowserWindow): Promise<void> {

		return new Promise(resolve => {
			rootBrowserWindow.webContents.session.resolveProxy(Proxy.RESOLVE_PROXY_TEST_URL, (proxy: string) => {
				Proxy.httpProxy = (proxy !== Proxy.DIRECT_PROXY_TEST_URL) ? "http://" + proxy.replace("PROXY", "").trim() : null;
				logger.info("Using proxy value: " + Proxy.httpProxy);
				resolve();
			});
		});
	}

	public static getHttpProxy(): string {
		return Proxy.httpProxy;
	}
}
