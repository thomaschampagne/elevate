class BikeOdoProcessor {

    protected cacheKey: string;
    protected vacuumProcessor: VacuumProcessor;
    protected cacheAgingTime: number;
    protected athleteId: number;

    constructor(vacuumProcessor: VacuumProcessor, athleteId: number) {
        this.vacuumProcessor = vacuumProcessor;
        this.cacheAgingTime = 120 * 60; // 2 hours
        this.athleteId = athleteId;
        this.cacheKey = 'stravistix_bikeOdo_' + athleteId + '_cache';
    }

    public getBikeOdoOfAthlete(callback: (bikeOdoArray: Array<string>) => void): void {

        let cache: string = localStorage.getItem(this.cacheKey);
        let storedOdos: any = JSON.parse(localStorage.getItem(this.cacheKey));

        // Test if cache is still valid
        let cacheDeprecated: boolean = false;
        let now: number = Math.floor(Date.now() / 1000);
        if (storedOdos && (now > storedOdos.cachedOnTimeStamp + this.cacheAgingTime)) {
            console.log('bike ode cache is deprecated');
            cacheDeprecated = true;
        }

        if (!_.isNull(cache) && !_.isEqual(cache, "null") && !cacheDeprecated) {
            if (env.debugMode) console.log("Using bike odo cache: " + cache);
            callback(storedOdos);
            return;
        }

        this.vacuumProcessor.getBikeOdoOfAthlete(this.athleteId, (bikeOdoArray: any) => {

            bikeOdoArray.cachedOnTimeStamp = Math.floor(Date.now() / 1000);

            // Cache result
            if (env.debugMode) console.log("Creating bike odo cache inside cookie " + this.cacheKey);
            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(bikeOdoArray));
            } catch (err) {
                console.warn(err);
                localStorage.clear();
            }
            callback(bikeOdoArray);
        });
    }

    public  getCacheKey(): string {
        return this.cacheKey;
    }
}
