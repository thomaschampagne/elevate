export enum MessageFlag {
	// From renderer to main
	START_SYNC,
	STOP_SYNC,
	LINK_STRAVA_CONNECTOR,
	GET_MACHINE_ID,

	// From main to renderer
	SYNC_EVENT,
	FIND_ACTIVITY,
}
