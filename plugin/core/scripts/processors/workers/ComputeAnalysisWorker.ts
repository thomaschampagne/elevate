// Worker function executed by the main UI Thread
function ComputeAnalysisWorker() {

    // required dependencies for worker job
    this.required = [
        '/core/scripts/Helper.js',
        '/node_modules/underscore/underscore-min.js',
        '/core/scripts/processors/ActivityComputer.js'
    ];

    // Message received from main script
    // Lets begin that ******* compute !
    this.onmessage = (mainThreadEvent: MessageEvent) => {
        // Import required dependencies for worker job
        this.importRequiredLibraries(this.required, mainThreadEvent.data.appResources.extensionId);
        // Lets exec activity processing on extended stats

        let threadMessage: IComputeActivityThreadMessage = mainThreadEvent.data;
        let analysisComputer: ActivityComputer = new ActivityComputer(
            threadMessage.activityType,
            threadMessage.isTrainer,
            threadMessage.userSettings,
            threadMessage.athleteWeight,
            threadMessage.hasPowerMeter,
            threadMessage.activityStatsMap,
            threadMessage.activityStream,
            threadMessage.bounds,
            threadMessage.returnZones
        );

        let result: IAnalysisData = analysisComputer.compute();

        // Result to main thread
        this.postMessage(result);
    };

    this.importRequiredLibraries = (libsFromExtensionPath: Array<string>, chromeExtensionId: string) => {
        for (let i: number = 0; i < libsFromExtensionPath.length; i++) {
            importScripts('chrome-extension://' + chromeExtensionId + libsFromExtensionPath[i]);
        }
    };
}
