export enum MessageFlag {
	// From renderer to main
	START_SYNC,
	STOP_SYNC,
	LINK_STRAVA_CONNECTOR,

	// From main to renderer
	SYNC_EVENT,
	FIND_ACTIVITY,
}
