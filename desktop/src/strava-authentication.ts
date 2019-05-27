import * as http from "http";
import * as QueryString from "querystring";
import { BrowserWindow } from "electron";
import { HttpClient } from "./http-client";
import logger from "electron-log";
import { Service } from "./service";

export class StravaAuthentication {

	public static WEB_SERVER_HTTP_PORT: number = 53445;
	public static AUTH_WINDOW_HEIGHT: number = 800;
	public static AUTH_WINDOW_WIDTH: number = 500;
	public static REDIRECT_HTTP_BASE: string = "http://127.0.0.1";
	public static STRAVA_SCOPE: string = "activity:read_all";
	public static STRAVA_HOSTNAME: string = "www.strava.com";
	public static OAUTH_AUTHORIZE_PATH: string = "/oauth/authorize";
	public static OAUTH_TOKEN_PATH: string = "/oauth/token";
	public static TOKEN_URL: string = "https://" + StravaAuthentication.STRAVA_HOSTNAME + StravaAuthentication.OAUTH_TOKEN_PATH;
	public static AUTHORIZE_URL: string = "https://" + StravaAuthentication.STRAVA_HOSTNAME + StravaAuthentication.OAUTH_AUTHORIZE_PATH;

	private authenticationWindow: Electron.BrowserWindow;

	constructor() {
	}

	private server: http.Server;

	public onAuthorizeRedirectRequest(handleAuthorizeCode, request: http.IncomingMessage, response: http.ServerResponse): void {

		const url = new URL(request.url, StravaAuthentication.REDIRECT_HTTP_BASE);
		if (url.pathname !== "/code") {
			logger.info(`Ignoring request to ${request.url}`);
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

		const body = {
			client_id: clientId,
			client_secret: clientSecret,
			code: code
		};

		this.exchangeCodeAgainstToken(body, (error, bodyJson) => {
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

	public exchangeCodeAgainstToken(body, callback: (error, body: any) => void): void {
		HttpClient.post(StravaAuthentication.TOKEN_URL, body, Service.instance().httpProxy)
			.then(data => callback(null, data), error => callback(error, null));
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
