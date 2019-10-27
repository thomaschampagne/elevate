import * as http from "http";
import * as queryString from "querystring";
import { BrowserWindow } from "electron";
import logger from "electron-log";
import { Service } from "../../service";
import { HttpCodes } from "typed-rest-client/HttpClient";

export class StravaAuthenticator {

	public static WEB_SERVER_HTTP_PORT = 53445;
	public static AUTH_WINDOW_HEIGHT = 800;
	public static AUTH_WINDOW_WIDTH = 500;
	public static REDIRECT_HTTP_BASE = "http://127.0.0.1";
	public static STRAVA_SCOPE = "activity:read_all";
	public static STRAVA_HOSTNAME = "www.strava.com";
	public static OAUTH_AUTHORIZE_PATH = "/oauth/authorize";
	public static OAUTH_TOKEN_PATH = "/oauth/token";
	public static TOKEN_URL: string = "https://" + StravaAuthenticator.STRAVA_HOSTNAME + StravaAuthenticator.OAUTH_TOKEN_PATH;
	public static AUTHORIZE_URL: string = "https://" + StravaAuthenticator.STRAVA_HOSTNAME + StravaAuthenticator.OAUTH_AUTHORIZE_PATH;

	private authenticationWindow: Electron.BrowserWindow;

	constructor() {
	}

	private server: http.Server;

	public onAuthorizeRedirectRequest(handleAuthorizeCode, request: http.IncomingMessage, response: http.ServerResponse): void {

		const url = new URL(request.url, StravaAuthenticator.REDIRECT_HTTP_BASE);
		if (url.pathname !== "/code") {
			logger.info(`Ignoring request to ${request.url}`);
			return;
		}

		const query = queryString.parse(request.url);
		handleAuthorizeCode(query.code);
		response.end();

		if (!this.authenticationWindow.isDestroyed()) {
			this.authenticationWindow.close();
		}

		this.server.close();
	}

	public makeTokensExchangeRequest(clientId: number, clientSecret: string, code: string, refreshToken: string,
									 responseCallback: (error: any, accessToken: string, refreshToken: string, expiresAt: number, athlete: object) => void): void {

		let payload = null;

		if (code && !refreshToken) {

			logger.info("Getting tokens with grant_type=authorization_code");

			payload = {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "authorization_code",
				code: code
			};

		} else if (!code && refreshToken) {

			logger.info("Getting tokens with grant_type=refresh_token");

			payload = {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: "refresh_token",
				refresh_token: refreshToken
			};
		}

		if (!payload) {
			responseCallback("Unable to exchange tokens. Body: " + JSON.stringify(payload), null, null, null, null);
			return;
		}

		this.exchangeForTokens(payload, (error, body) => {
			if (error) {
				responseCallback(error, null, null, null, null);
			} else {
				responseCallback(null, body.access_token, body.refresh_token, body.expires_at * 1000  /* expires_at as milli seconds */, {
					id: body.athlete.id,
					username: body.athlete.username,
					firstname: body.athlete.firstname,
					lastname: body.athlete.lastname,
					city: body.athlete.city,
					state: body.athlete.state,
					country: body.athlete.country,
					sex: body.athlete.sex,
				});
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

	public exchangeForTokens(body: any, callback: (error, body: any) => void): void {

		Service.instance().httpClient.post(StravaAuthenticator.TOKEN_URL, queryString.stringify(body)).then(response => {
			return (response.message.statusCode === HttpCodes.OK) ? response.readBody() : Promise.reject(response.message);
		}).then(body => {
			callback(null, JSON.parse(body));
		}).catch((error: http.IncomingMessage) => {
			callback(error, null);
		});
	}

	/**
	 * Authorize against the Strava V3 API and return the Strava access token via a callback.
	 * @param {string} clientId - Strava client ID.
	 * @param {string} clientSecret - Strava client secret.
	 */
	public authorize(clientId: number, clientSecret: string): Promise<{ accessToken: string, refreshToken: string, expiresAt: number, athlete: object }> {

		return new Promise<{ accessToken: string, refreshToken: string, expiresAt: number, athlete: object }>((resolve, reject) => {

			this.authenticationWindow = new BrowserWindow({
				height: StravaAuthenticator.AUTH_WINDOW_HEIGHT,
				resizable: false,
				width: StravaAuthenticator.AUTH_WINDOW_WIDTH,
				title: null,
				autoHideMenuBar: true,
				minimizable: false
			});

			const redirectUrl = `${StravaAuthenticator.REDIRECT_HTTP_BASE}:${StravaAuthenticator.WEB_SERVER_HTTP_PORT}/code`;

			const authUrl = new URL(StravaAuthenticator.AUTHORIZE_URL);
			authUrl.searchParams.append("client_id", clientId.toString());
			authUrl.searchParams.append("response_type", "code");
			authUrl.searchParams.append("redirect_uri", redirectUrl);
			authUrl.searchParams.append("scope", StravaAuthenticator.STRAVA_SCOPE);
			authUrl.searchParams.append("approval_prompt", "auto");

			this.authenticationWindow.loadURL(authUrl.href);

			this.authenticationWindow.webContents.on("did-finish-load", () => {
				this.authenticationWindow.show();
				this.authenticationWindow.focus();
			});

			this.authenticationWindow.on("close", () => {
				this.server.close();
			});

			const responseCallback = (error: any, accessToken: string, refreshToken: string, expiresAt: number, athlete: object) => {
				if (error) {
					logger.error(error);
					reject(error);
				} else {
					resolve({accessToken: accessToken, refreshToken: refreshToken, expiresAt: expiresAt, athlete: athlete});
				}
			};

			this.startWebServer(StravaAuthenticator.WEB_SERVER_HTTP_PORT, (code: string) => {
				this.makeTokensExchangeRequest(clientId, clientSecret, code, null, responseCallback);
			}, responseCallback);

		});

	}

	/**
	 *
	 * @param clientId
	 * @param clientSecret
	 * @param refreshToken
	 */
	public refresh(clientId: number, clientSecret: string, refreshToken: string): Promise<{ accessToken: string, refreshToken: string, expiresAt: number, athlete: object }> {

		return new Promise<{ accessToken: string, refreshToken: string, expiresAt: number, athlete: object }>((resolve, reject) => {

			this.makeTokensExchangeRequest(clientId, clientSecret, null, refreshToken, (error: any, accessToken: string, refreshToken: string, expiresAt: number, athlete: object) => {
				if (error) {
					logger.error(error);
					reject(error);
				} else {
					resolve({accessToken: accessToken, refreshToken: refreshToken, expiresAt: expiresAt, athlete: athlete});
				}
			});

		});

	}
}
