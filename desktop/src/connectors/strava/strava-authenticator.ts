import http from "http";
import queryString from "querystring";
import { app, BrowserWindow } from "electron";
import { inject, singleton } from "tsyringe";
import _ from "lodash";
import { Logger } from "../../logger";
import { Subject } from "rxjs";
import pDefer from "p-defer";
import { HttpClient } from "../../clients/http.client";

@singleton()
export class StravaAuthenticator {
  public static WEB_SERVER_HTTP_PORT = _.random(49152, 65535);
  public static AUTH_WINDOW_HEIGHT = 800;
  public static AUTH_WINDOW_WIDTH = 500;
  public static REDIRECT_HTTP_BASE = "http://127.0.0.1";
  public static STRAVA_SCOPE = "activity:read_all";
  public static STRAVA_HOSTNAME = "www.strava.com";
  public static OAUTH_AUTHORIZE_PATH = "/oauth/authorize";
  public static OAUTH_TOKEN_PATH = "/oauth/token";
  public static TOKEN_URL: string =
    "https://" + StravaAuthenticator.STRAVA_HOSTNAME + StravaAuthenticator.OAUTH_TOKEN_PATH;
  public static AUTHORIZE_URL: string =
    "https://" + StravaAuthenticator.STRAVA_HOSTNAME + StravaAuthenticator.OAUTH_AUTHORIZE_PATH;

  private authenticationWindow: Electron.BrowserWindow;
  private server: http.Server;

  private authorizationCode$: Subject<string>;

  constructor(
    @inject(HttpClient) private readonly httpClient: HttpClient,
    @inject(Logger) private readonly logger: Logger
  ) {
    this.authorizationCode$ = new Subject<string>();
  }

  public makeTokensExchangeRequest(
    clientId: number,
    clientSecret: string,
    code: string,
    refreshToken: string,
    responseCallback: (
      error: any,
      accessToken: string,
      refreshToken: string,
      expiresAt: number,
      athlete: object
    ) => void
  ): void {
    let payload = null;

    const isAuthCodeGrantType = code && !refreshToken;
    const isRefreshTokenGrantType = !code && refreshToken;

    if (isAuthCodeGrantType) {
      this.logger.info("Getting tokens with grant_type=authorization_code");
      payload = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code
      };
    } else if (isRefreshTokenGrantType) {
      this.logger.info("Getting tokens with grant_type=refresh_token");

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
        const athlete = isAuthCodeGrantType
          ? {
              id: body.athlete.id,
              username: body.athlete.username,
              firstname: body.athlete.firstname,
              lastname: body.athlete.lastname,
              city: body.athlete.city,
              state: body.athlete.state,
              country: body.athlete.country,
              sex: body.athlete.sex
            }
          : null;

        responseCallback(
          null,
          body.access_token,
          body.refresh_token,
          body.expires_at * 1000 /* expires_at as milli seconds */,
          athlete
        );
      }
    });
  }

  public exchangeForTokens(body: any, callback: (error, body: any) => void): void {
    this.httpClient
      .post(StravaAuthenticator.TOKEN_URL, body)
      .then(response => {
        return Promise.resolve(response.data);
      })
      .then(bodyResponse => {
        callback(null, bodyResponse);
      })
      .catch((error: http.IncomingMessage) => {
        callback(error, null);
      });
  }

  /**
   * Authorize against the Strava V3 API and return the Strava access token via a callback.
   * @param clientId - Strava client ID.
   * @param clientSecret - Strava client secret.
   */
  public authorize(
    clientId: number,
    clientSecret: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: number; athlete: object }> {
    this.setupWebServer();

    const authorizePromise = pDefer<{
      accessToken: string;
      refreshToken: string;
      expiresAt: number;
      athlete: object;
    }>();

    const authorizationCodeSub = this.authorizationCode$.subscribe(
      authorizationCode => {
        this.makeTokensExchangeRequest(
          clientId,
          clientSecret,
          authorizationCode,
          null,
          (error: any, accessToken: string, refreshToken: string, expiresAt: number, athlete: object) => {
            if (error) {
              this.logger.error(error);
              authorizePromise.reject(error);
            } else {
              authorizePromise.resolve({
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: expiresAt,
                athlete: athlete
              });
            }
          }
        );
      },
      error => authorizePromise.reject(error)
    );

    if (this.authenticationWindow) {
      this.authenticationWindow.show();
      this.authenticationWindow.focus();
    } else {
      this.authenticationWindow = new BrowserWindow({
        height: StravaAuthenticator.AUTH_WINDOW_HEIGHT,
        resizable: false,
        width: StravaAuthenticator.AUTH_WINDOW_WIDTH,
        title: null,
        autoHideMenuBar: true,
        minimizable: false
      });
    }

    const redirectUrl = `${StravaAuthenticator.REDIRECT_HTTP_BASE}:${StravaAuthenticator.WEB_SERVER_HTTP_PORT}/code`;

    const authUrl = new URL(StravaAuthenticator.AUTHORIZE_URL);
    authUrl.searchParams.append("client_id", clientId.toString());
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", redirectUrl);
    authUrl.searchParams.append("scope", StravaAuthenticator.STRAVA_SCOPE);
    authUrl.searchParams.append("approval_prompt", "auto");

    this.authenticationWindow.loadURL(authUrl.href, {
      userAgent: app.userAgentFallback.replace(`Chrome/${process.versions.chrome}`, "Chrome")
    });

    this.authenticationWindow.webContents.on("did-finish-load", () => {
      this.authenticationWindow.show();
      this.authenticationWindow.focus();
    });

    this.authenticationWindow.on("closed", () => {
      this.authenticationWindow = null;
      this.server.close();
    });

    return authorizePromise.promise.then(result => {
      authorizationCodeSub.unsubscribe();
      return Promise.resolve(result);
    });
  }

  private setupWebServer(): void {
    if (this.server) {
      if (!this.server.listening) {
        this.server.listen(StravaAuthenticator.WEB_SERVER_HTTP_PORT);
      }
    } else {
      // Create server
      this.server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
        this.authorizationCodeListener(request, response);
      });
      this.server.listen(StravaAuthenticator.WEB_SERVER_HTTP_PORT);

      this.server.on("listening", () => {
        this.logger.info(
          `Strava authentication server now listening on port ${StravaAuthenticator.WEB_SERVER_HTTP_PORT}`
        );
      });

      this.server.on("close", () => {
        this.logger.info(`Strava authentication server now is now closed`);
      });

      this.server.on("error", (err: Error) => {
        if (err) {
          this.logger.error(err);
          this.server.close();
        }
      });
    }
  }

  public authorizationCodeListener(request: http.IncomingMessage, response: http.ServerResponse): void {
    if (request.url.startsWith("/code")) {
      this.logger.info(`Trying to fetch authorization code`);
      const query = queryString.parse(request.url);
      if (query.code) {
        const authorizationCode = query.code as string;
        this.logger.info(`Authorization code found: ${authorizationCode}`);

        // respond and close authentication window then web server
        response.end();
        if (!this.authenticationWindow.isDestroyed()) {
          this.authenticationWindow.close();
        }

        // Close web server, we don't need it any more
        this.server.close();

        // Notify authorization code
        this.authorizationCode$.next(authorizationCode);
      }
    } else {
      this.logger.info(`Ignoring request to ${request.url}`);
    }
  }

  public refresh(
    clientId: number,
    clientSecret: string,
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: number; athlete: object }> {
    return new Promise<{ accessToken: string; refreshToken: string; expiresAt: number; athlete: object }>(
      (resolve, reject) => {
        this.makeTokensExchangeRequest(
          clientId,
          clientSecret,
          null,
          refreshToken,
          (error: any, accessTokenUpdate: string, refreshTokenUpdate: string, expiresAt: number, athlete: object) => {
            if (error) {
              this.logger.error(error);
              reject(error);
            } else {
              resolve({
                accessToken: accessTokenUpdate,
                refreshToken: refreshTokenUpdate,
                expiresAt: expiresAt,
                athlete: athlete
              });
            }
          }
        );
      }
    );
  }
}
