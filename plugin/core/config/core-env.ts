export class CoreEnv {
	public static readonly preview = false; // Must be false in release
	public static readonly analyticsTrackingID = "UA-51167057-4"; // prod:'UA-51167057-4'; test:'UA-51167057-5'
	public static readonly simulateUpdate = false; // Must be false in release
	public static readonly debugMode = false; // Must be false in release
	public static readonly forceIsActivityOwner = false; // Must be false in release
	public static readonly useActivityStreamCache = true; // Must be true in release
	public static readonly endPoint = "https://elevate-prod-${id}.herokuapp.com"; // Elevate endPoint for new features
}
