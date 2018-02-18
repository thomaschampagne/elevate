import * as _ from "lodash";
import { Helper } from "../../../common/scripts/Helper";
import { SyncNotifyModel } from "../../../common/scripts/models/Sync";
import { UserSettingsModel } from "../../../common/scripts/models/UserSettings";
import { IStorageUsage, StorageManager } from "../../../common/scripts/modules/StorageManager";
import { env } from "../../config/env";
import { IAppResources } from "../interfaces/IAppResources";
import { ActivitiesSynchronizer, ISyncResult } from "../synchronizer/ActivitiesSynchronizer";
import { HerokuEndpoints } from "../../../common/scripts/modules/HerokuEndpoint";

export class ActivitiesSyncModifier implements IModifier {

    protected activitiesSynchronizer: ActivitiesSynchronizer;
    protected extensionId: string;
    protected sourceTabId: number;
    protected forceSync: boolean;
	protected userSettings: UserSettingsModel;
    protected appResources: IAppResources;

    public closeWindowIntervalId: number = -1;

	constructor(appResources: IAppResources, userSettings: UserSettingsModel, forceSync: boolean, sourceTabId?: number) {
        this.activitiesSynchronizer = new ActivitiesSynchronizer(appResources, userSettings);
        this.userSettings = userSettings;
        this.appResources = appResources;
        this.extensionId = appResources.extensionId;
        this.sourceTabId = sourceTabId;
        this.forceSync = forceSync;
    }

    public modify(): void {

        // Make a white page !
        $("body").children().remove();

        let html = "";
        html += "<div>";
		html += "    <div id=\"syncContainer\">";
		html += "       <div id=\"syncMessage\">";
		html += "           <span style=\"font-size: 28px;\">Syncing history to browser.</span><br/><br/>It can take several minutes on your first synchronisation. Keep that in background. The history is locally saved in the storage allocated by the extension." +
            "<br/><br/>Once the first sync done, your history will be automatically synced every <strong>" + this.userSettings.autoSyncMinutes + " minute(s)</strong> while browsing strava.com. In other words, auto sync is triggered if " + this.userSettings.autoSyncMinutes + " minute(s) have been flow out since your last synchronisation" +
			"<br/><br/><a href=\"" + this.appResources.settingsLink + "#/commonSettings?viewOptionHelperId= autoSyncMinutes&searchText=auto%20sync\" target=\"_blank\" class=\"btn btn-sm btn-primary\">Configure Auto Sync</a>" +
            "<br/><br/>Manual sync also works by clicking the same button.<br/><br/>" +
            "Closing window stops synchronization. It will close itself when done.";
        html += "       </div>";
		html += "       <div class=\"progressBarGroup\">";
		html += "           <div id=\"totalProgress\">Global synchronisation progress</div>";
		html += "           <progress id=\"syncProgressBar\" value=\"0\" max=\"100\"></progress>";
		html += "           <span id=\"totalProgressText\"></span>";
        html += "        </div>";
		html += "        <div class=\"progressBarGroup\">";
		html += "           <div id=\"syncStep\"></div>";
		html += "           <progress id=\"syncStepProgressBar\" value=\"0\" max=\"100\"></progress>";
		html += "           <span id=\"syncStepProgressText\"></span>";
        html += "        </div>";
		html += "        <div id=\"syncStatusError\" style=\"display: none;\">";
		html += "           <div style=\"padding-bottom: 20px;\">Sync error occured. Maybe a network timeout error...<a href=\"#\" onclick=\"window.location.reload();\">Try to sync again</a></div>";
		html += "           <div id=\"syncStatusErrorContent\" style=\"font-size: 11px;\"></div>";
        html += "        </div>";
		html += "       <div id=\"syncInfos\">";
		html += "           <div style=\"padding-bottom: 10px;\" id=\"totalActivities\"></div>";
		html += "           <div style=\"padding-bottom: 10px;\" id=\"browsedActivitiesCount\"></div>";
		html += "           <div style=\"padding-bottom: 10px;\" id=\"storageUsage\"></div>";
		html += "           <div style=\"padding-bottom: 10px;\" id=\"autoClose\"></div>";
        html += "       </div>";
        html += "    </div>";
        html += "</div>";

        $("body").append(html).each(() => {

            this.updateStorageUsage();

            if (this.forceSync) {
                // Clear previous synced cache and start a new sync
                this.activitiesSynchronizer.clearSyncCache().then(() => {
                    this.sync();
                });
            } else {
                this.sync();
            }
        });
    }

    protected updateStorageUsage() {
        Helper.getStorageUsage(this.extensionId, StorageManager.storageLocalType).then((storageUsage: IStorageUsage) => {
            $("#storageUsage").html("Extension local storage occupation: <strong>" + (storageUsage.bytesInUse / (1024 * 1024)).toFixed(1) + "MB</strong>");
        });
    }

    public cancelAutoClose(): void {
        clearInterval(this.closeWindowIntervalId);
        $("#autoClose").hide();
    }

    protected sync(): void {

        // Start sync..
        this.activitiesSynchronizer.sync().then((syncResult: ISyncResult) => {

            console.log("Sync finished", syncResult);

            // Reloading source tab if exist
            if (_.isNumber(this.sourceTabId) && this.sourceTabId !== -1) {
                console.log("Reloading source tab with id " + this.sourceTabId);
                Helper.reloadBrowserTab(this.extensionId, this.sourceTabId); // Sending message to reload source tab which asked for a sync
            } else {
                console.log("no source tab id given: no reload of source.");
            }

            // Global progress
            $("#syncProgressBar").val(100);
            $("#totalProgressText").html("100%");

            // Register instance on the bridge
            window.__stravistix_bridge__.activitiesSyncModifierInstance = this;

            let timer: number = 5 * 1000; // 5s for debug...
            this.closeWindowIntervalId = window.setInterval(() => {
				$("#autoClose").html("<div style=\"background: #fff969; padding: 5px;\"><span>Sync done. Added: " + syncResult.globalHistoryChanges.added.length + ", Edited:" + syncResult.globalHistoryChanges.edited.length + ", Deleted:" + syncResult.globalHistoryChanges.deleted.length +
					". Closing in " + (timer / 1000) + "s</span> <a href=\"#\" onclick=\"javascript:window.__stravistix_bridge__.activitiesSyncModifierInstance.cancelAutoClose()\">Cancel auto close<a></div>");
                if (timer <= 0) {
                    window.close();
                }
                timer = timer - 1000; // 1s countdown
            }, 1000);

        }, (err: any) => {

            console.error("Sync error", err);

            const errorUpdate: any = {
                stravaId: (window.currentAthlete && window.currentAthlete.get("id") ? window.currentAthlete.get("id") : null),
                error: {path: window.location.href, date: new Date(), content: err},
            };

            const endPoint = HerokuEndpoints.resolve(env.endPoint) + "/api/errorReport";

            $.post({
                url: endPoint,
                data: JSON.stringify(errorUpdate),
                dataType: "json",
                contentType: "application/json",
                success: (response: any) => {
                    console.log("Commited: ", response);
                },
                error: (jqXHR: JQueryXHR, textStatus: string, errorThrown: string) => {
                    console.warn("Endpoint <" + endPoint + "> not reachable", jqXHR);
                },
            });

            $("#syncStatusError").show();

            if (err && err.errObject) {
                $("#syncStatusErrorContent").append("<div>ERROR on activity <" + err.activityId + ">: " + err.errObject.message + ". File: " + err.errObject.filename + ":" + err.errObject.lineno + ":" + err.errObject.colno + "</div>");
            } else {
                $("#syncStatusErrorContent").append("<div>" + JSON.stringify(err) + "</div>");
            }

		}, (progress: SyncNotifyModel) => {

            // Global progress
            $("#syncProgressBar").val(progress.browsedActivitiesCount / progress.totalActivities * 100);
            $("#totalProgressText").html((progress.browsedActivitiesCount / progress.totalActivities * 100).toFixed(0) + "%");

            // Step
            let stepMessage: string = "";

            switch (progress.step) {

                case "fetchActivitiesPercentage":
                    stepMessage = "Batch fetching...";
                    break;
                case "fetchedStreamsPercentage":
                    stepMessage = "Fetching streams...";
                    break;
                case "computedActivitiesPercentage":
                    stepMessage = "Computing extended statistics...";
                    break;
                case "savedComputedActivities":
                    stepMessage = "Saving results to local extension storage...";
                    this.updateStorageUsage();
                    break;
                case "updatingLastSyncDateTime":
                    stepMessage = "Updating your last synchronization date... And you're done.";
                    break;
            }

            $("#syncStep").html("Activity group <strong>" + progress.pageGroupId + "</strong> &#10141; " + stepMessage);
            $("#syncStepProgressBar").val(progress.progress);
            $("#syncStepProgressText").html(progress.progress.toFixed(0) + "%");

            document.title = "History synchronization @ " + (progress.browsedActivitiesCount / progress.totalActivities * 100).toFixed(0) + "%";

            // Infos
            $("#totalActivities").html("Total activities found <strong>" + progress.totalActivities + "</strong>");
            $("#browsedActivitiesCount").html("Total activities processed <strong>" + progress.browsedActivitiesCount + "</strong>");
        });
    }
}
