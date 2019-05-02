export class StravaApiCredentials {

	public static readonly DEFAULT_MODEL: StravaApiCredentials = new StravaApiCredentials(null, null);

	public clientId: number;
	public clientSecret: string;
	public accessToken: string;

	constructor(clientId: number, clientSecret: string, accessToken?: string) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
		this.accessToken = (accessToken) ? accessToken : null;
	}
}
