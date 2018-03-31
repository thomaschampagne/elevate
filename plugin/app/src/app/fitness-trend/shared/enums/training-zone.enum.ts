export enum TrainingZone {
	// TRANSITION is active when upper than FRESHNESS zone
	// For others zones: ZONE = [THRESHOLD_VALUE]
	TRANSITION,
	FRESHNESS = 25,
	NEUTRAL = 5,
	OPTIMAL = -10,
	OVERLOAD = -30
}
