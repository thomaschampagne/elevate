import { Helper } from "../helper";
import { BrowserStorage } from "../browser-storage";
import { ExtensionEnv } from "../../config/extension-env";
import { ActivitiesSynchronize } from "../processors/activities-synchronize";
import { SyncResultModel } from "@elevate/shared/models";
import { SyncNotifyModel } from "../models/sync/sync-notify.model";
import { AbstractModifier } from "./abstract.modifier";
import * as _ from "lodash";
import { AppStorageUsage } from "../models/app-storage-usage.model";
import { BrowserStorageType } from "../models/browser-storage-type.enum";
import { DistributedEndpointsResolver } from "@elevate/shared/resolvers";

export class ActivitiesSyncModifier extends AbstractModifier {

	protected activitiesSynchronize: ActivitiesSynchronize;
	protected extensionId: string;
	protected sourceTabId: number;
	protected forceSync: boolean;
	protected fastSync: boolean;

	public closeWindowIntervalId = -1;

	constructor(extensionId: string, activitiesSynchronize: ActivitiesSynchronize, fastSync: boolean, forceSync: boolean, sourceTabId?: number) {
		super();
		this.activitiesSynchronize = activitiesSynchronize;
		this.extensionId = extensionId;
		this.sourceTabId = sourceTabId;
		this.forceSync = forceSync;
		this.fastSync = fastSync;
	}

	public modify(): void {

		// Make a white page !
		$("body").children().remove();

		let html = "";
		html += "<div>";
		html += "    <div id=\"syncContainer\">";
		html += "       <div id=\"syncMessage\">";
		html += "           <span style=\"font-size: 28px;\">Syncing activities to extension storage.</span> <br/><br/>" +
			"The <strong>first</strong> sync is long due to technical purpose: <strong>~6 minutes / 100 activities</strong>. <strong>Upcoming syncs are short and silent.</strong> " +
			"Keep this window in background, it will close itself when synchronization is done.<br/><br/>" +
			"Synced activities are locally saved in the storage allocated by the extension." +
			"<br/><br/>On a daily use, your recent activities will be automatically pushed to the Elevate app when strava website is loaded." +
			"<br/><br/>In specific cases like \"old\" activities added, edited or deleted from strava, you have to launch synchronization by yourself.<br/><br/>" +
			"<i>Note: closing this window will stop the synchronization.</i>";
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
		html += "           <span style='color: crimson; font-weight: 600;'>Please continue your synchronization in 4~5 hours: you have reached the quota of activities which can be synced at the moment. Of course already synced activities will not be re-synced on next sync.<br/><br/> This limit is intended to avoid Strava servers errors or potential overload.</span>";
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
				this.activitiesSynchronize.clearSyncCache().then(() => {
					this.sync();
				});
			} else {
				this.sync();
			}
		});
	}

	protected updateStorageUsage() {
		BrowserStorage.getInstance().usage(BrowserStorageType.LOCAL).then((storageUsage: AppStorageUsage) => {
			$("#storageUsage").html("Extension local storage occupation: <strong>" + (storageUsage.bytesInUse / (1024 * 1024)).toFixed(1) + "MB</strong>");
		});
	}

	public cancelAutoClose(): void {
		clearInterval(this.closeWindowIntervalId);
		$("#autoClose").hide();
	}

	protected sync(): void {

		// Start sync..
		const syncStart = performance.now();
		this.activitiesSynchronize.sync(this.fastSync).then((syncResult: SyncResultModel) => {

			console.log("Sync finished", syncResult);

			// Global progress
			$("#syncProgressBar").val(100);
			$("#totalProgressText").html("100%");

			if (this.fastSync) {
				ActivitiesSynchronize.notifyBackgroundSyncDone.call(this, this.extensionId, syncResult);
				setTimeout(() => {
					window.close();
				}, 200);
			} else {
				// Reloading source tab if exist
				if (_.isNumber(this.sourceTabId) && this.sourceTabId !== -1) {
					console.log("Reloading source tab with id " + this.sourceTabId);
					Helper.reloadBrowserTab(this.extensionId, this.sourceTabId); // Sending message to reload source tab which asked for a sync
				} else {
					console.log("no source tab id given: no reload of source.");
				}

				// Register instance on the bridge
				window.__elevate_bridge__.activitiesSyncModifierInstance = this;

				let timer: number = 5 * 1000; // 5s for debug...
				this.closeWindowIntervalId = window.setInterval(() => {
					$("#autoClose").html("<div style=\"background: #fff969; padding: 5px;\"><span>Sync done. Added: " + syncResult.activitiesChangesModel.added.length + ", Edited: " + syncResult.activitiesChangesModel.edited.length + ", Deleted: " + syncResult.activitiesChangesModel.deleted.length +
						". Closing in " + (timer / 1000) + "s</span> <a href=\"#\" onclick=\"window.__elevate_bridge__.activitiesSyncModifierInstance.cancelAutoClose()\">Cancel auto close<a></div>");
					if (timer <= 0) {
						window.close();
					}
					timer = timer - 1000; // 1s countdown
				});
			}

		}, (error: any) => {

			console.error("Sync error", error);

			const errorUpdate: any = {
				stravaId: (window.currentAthlete && window.currentAthlete.get("id") ? window.currentAthlete.get("id") : null),
				error: {path: window.location.href, date: new Date(), content: error},
			};

			const endPoint = DistributedEndpointsResolver.resolve(ExtensionEnv.endPoint) + "/api/errorReport";

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

			if (error) { // Too many request :/
				$("#syncStatusError").show();
				$(".progressBarGroup").hide();
				console.error(error);
			}

		}, (progress: SyncNotifyModel) => {

			// Global progress
			$("#syncProgressBar").val(progress.browsedActivitiesCount / progress.totalActivities * 100);
			$("#totalProgressText").html((progress.browsedActivitiesCount / progress.totalActivities * 100).toFixed(0) + "%");

			// Step
			let stepMessage = "";

			switch (progress.step) {

				case "fetchActivitiesPercentage":
					stepMessage = "Batch fetching...";
					break;
				case "fetchedStreamsPercentage":
					stepMessage = "Fetching streams...";
					break;
				case "syncedActivitiesPercentage":
					stepMessage = "Computing extended statistics...";
					break;
				case "savedSyncedActivities":
					stepMessage = "Saving results to local extension storage...";
					this.updateStorageUsage();
					break;
				case "updatingSyncDateTime":
					stepMessage = "Updating your last synchronization date... And you're done.";
					const totalSec = (performance.now() - syncStart) / 1000;
					console.log("Sync time: " + Helper.secondsToHHMMSS(totalSec) + " (" + Math.round(totalSec) + "s)");
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
