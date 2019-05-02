import { getProxySettings, ProxySettings } from "get-proxy-settings";

export class ProxyDetector {

	public static httpProxy: string;

	public static init(): Promise<void> {

		return new Promise((resolve, reject) => {

			getProxySettings().then((proxySettings: ProxySettings) => {
				ProxyDetector.httpProxy = (proxySettings.http) ? proxySettings.http.protocol.toString()
					+ "://" + proxySettings.http.host + ":" + proxySettings.http.port : null;
				resolve();
			}, err => {
				reject(err);
			});

		});
	}
}
