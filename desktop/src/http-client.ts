import * as https from "https";
import * as http from "http";
import HttpsProxyAgent from "https-proxy-agent";
import * as QueryString from "querystring";

enum HttpMethod {
	GET = "GET",
	POST = "POST",
}

export class HttpClient {

	public static get<T>(url: string, httpProxy?: string, headers?: http.OutgoingHttpHeaders): Promise<T> {
		return HttpClient.query(url, HttpMethod.GET, httpProxy, headers, null);
	}

	public static post<T>(url: string, body: any, httpProxy?: string, headers?: http.OutgoingHttpHeaders): Promise<T> {
		return HttpClient.query(url, HttpMethod.POST, httpProxy, headers, body);
	}

	private static query(url: string, method: HttpMethod, httpProxy: string, headers: http.OutgoingHttpHeaders, body: any): Promise<any> {

		return new Promise<any>((resolve, reject) => {

			if (method === HttpMethod.POST) {
				if (!headers) {
					headers = {};
				}
				headers["Content-Type"] = "application/x-www-form-urlencoded";
			}

			const urlObj = new URL(url);

			const options: http.RequestOptions = {
				hostname: urlObj.hostname,
				port: (urlObj.port) ? parseInt(urlObj.port) : null,
				path: urlObj.pathname + ((urlObj.search) ? urlObj.search : ""),
				method: method,
				headers: headers,
				agent: (httpProxy) ? new HttpsProxyAgent(httpProxy) : null
			};

			const request: http.ClientRequest = https.request(options, (response: http.IncomingMessage) => {

				if (response.statusCode === 200) {

					let data = "";
					// A chunk of data has been received.
					response.on("data", chunk => {
						data += chunk;
					});

					// The whole response has been received. Print out the result.
					response.on("end", () => {
						if ((headers["Content-Type"] === "application/json")) {
							resolve(JSON.parse(data));
						} else {
							resolve(data);
						}
					});

				} else {
					request.abort();
					reject("Endpoint replied with status code " + response.statusCode);
				}
			});

			if (method === HttpMethod.POST) {
				request.write(QueryString.stringify(body));
			}

			request.on("timeout", () => {
				reject("Timeout has been reached");
				request.abort();
			});

			request.setTimeout(10000); // 10 sec

			request.on("error", err => {
				reject(err);
			});

			request.end();
		});
	}
}
