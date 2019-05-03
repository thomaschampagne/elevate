import * as http from "http";
import * as https from "https";
import * as QueryString from "querystring";
import { BrowserWindow } from "electron";
import HttpsProxyAgent from "https-proxy-agent";
import { Proxy } from "./proxy";

export class StravaAuthentication {

	public static WEB_SERVER_HTTP_PORT: number = 53445;
	public static AUTH_WINDOW_HEIGHT: number = 800;
	public static AUTH_WINDOW_WIDTH: number = 500;
	public static REDIRECT_HTTP_BASE: string = "http://127.0.0.1";
	public static STRAVA_SCOPE: string = "write";
	public static STRAVA_HOSTNAME: string = "www.strava.com";
	public static OAUTH_AUTHORIZE_PATH: string = "/oauth/authorize";
	public static OAUTH_TOKEN_PATH: string = "/oauth/token";
	public static AUTHORIZE_URL: string = "https://" + StravaAuthentication.STRAVA_HOSTNAME + StravaAuthentication.OAUTH_AUTHORIZE_PATH;

	private authenticationWindow: Electron.BrowserWindow;

	constructor() {
	}

	private server: http.Server;

	public onAuthorizeRedirectRequest(handleAuthorizeCode, request: http.IncomingMessage, response: http.ServerResponse): void {

		const url = new URL(request.url, StravaAuthentication.REDIRECT_HTTP_BASE);
		if (url.pathname !== "/code") {
			console.info(`Ignoring request to ${request.url}`);
			return;
		}

		const query = QueryString.parse(request.url);
		handleAuthorizeCode(query.code);
		response.end();

		if (!this.authenticationWindow.isDestroyed()) {
			this.authenticationWindow.close();
		}

		this.server.close();
	}

	public makeTokenExchangeRequest(clientId, clientSecret, code, responseCallback): void {

		const form = {
			client_id: clientId,
			client_secret: clientSecret,
			code: code
		};

		this.exchangeCodeAgainstToken(form, (error, bodyJson) => {
			if (error) {
				responseCallback(error, null);
			} else {
				const body = JSON.parse(bodyJson);
				responseCallback(null, body.access_token);
			}
		});
	}

	public startWebServer(port, onAuthorizeCodeReceived, responseCallback): void {

		this.server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
			this.onAuthorizeRedirectRequest(onAuthorizeCodeReceived, request, response);
		});

		this.server.listen(port);

		this.server.addListener("error", (err: Error) => {
			if (err) {
				this.authenticationWindow.close();
				this.server.close();
				responseCallback(err, null);
			}
		});
	}

	public exchangeCodeAgainstToken(form, callback: (error, body) => void): void {

		const postData = QueryString.stringify(form);

		const options = {
			hostname: StravaAuthentication.STRAVA_HOSTNAME,
			port: 443,
			path: StravaAuthentication.OAUTH_TOKEN_PATH,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": postData.length
			},
			agent: (Proxy.getHttpProxy()) ? new HttpsProxyAgent(Proxy.getHttpProxy()) : null
		};

		const request = https.request(options, (response: http.IncomingMessage) => {

			if (response.statusCode === 200) {
				response.on("data", data => {
					callback(null, Buffer.from(data).toString("utf8"));
				});
			} else {
				request.abort();
				callback("Strava authorization url replied with status code " + response.statusCode, null);
			}
		});

		request.on("timeout", () => {
			callback("Timeout has been reached", null);
			request.abort();
		});

		request.setTimeout(10000); // 10 sec

		request.on("error", err => {
			callback(err, null);
		});

		request.write(postData);
		request.end();
	}


	/**
	 * Authorize against the Strava V3 API and return the Strava access token via a callback.
	 * @param {string} clientId - Strava client ID.
	 * @param {string} clientSecret - Strava client secret.
	 * @param {function} responseCallback - Callback that is passed (error, accessToken).
	 */
	public authorize(clientId: number, clientSecret: string, responseCallback): void {

		this.authenticationWindow = new BrowserWindow({
			height: StravaAuthentication.AUTH_WINDOW_HEIGHT,
			resizable: false,
			width: StravaAuthentication.AUTH_WINDOW_WIDTH,
			title: null,
			autoHideMenuBar: true,
			minimizable: false
		});

		const redirectUrl = `${StravaAuthentication.REDIRECT_HTTP_BASE}:${StravaAuthentication.WEB_SERVER_HTTP_PORT}/code`;

		const authUrl = new URL(StravaAuthentication.AUTHORIZE_URL);
		authUrl.searchParams.append("client_id", clientId.toString());
		authUrl.searchParams.append("response_type", "code");
		authUrl.searchParams.append("redirect_uri", redirectUrl);
		authUrl.searchParams.append("scope", StravaAuthentication.STRAVA_SCOPE);
		authUrl.searchParams.append("approval_prompt", "auto");

		this.authenticationWindow.loadURL(authUrl.href);

		this.authenticationWindow.webContents.on("did-finish-load", () => {
			this.authenticationWindow.show();
			this.authenticationWindow.focus();
		});

		this.authenticationWindow.on("close", () => {
			this.server.close();
		});

		this.startWebServer(StravaAuthentication.WEB_SERVER_HTTP_PORT, (code: string) => {
			this.makeTokenExchangeRequest(clientId, clientSecret, code, responseCallback);
		}, responseCallback);
	}

}
