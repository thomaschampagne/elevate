import { ExtensionEnv } from "../../config/extension-env";
import { ActivitiesSynchronize } from "../processors/activities-synchronize";
import { SyncNotifyModel } from "../models/sync/sync-notify.model";
import { AbstractModifier } from "./abstract.modifier";
import { AppStorageUsage } from "../models/app-storage-usage.model";
import { BrowserStorageType } from "../models/browser-storage-type.enum";
import { BrowserStorage } from "../browser-storage";
import { SyncResultModel } from "@elevate/shared/models/sync/sync-result.model";
import { DistributedEndpointsResolver } from "@elevate/shared/resolvers/distributed-endpoints.resolver";
import { Time } from "@elevate/shared/tools/time";

export class ActivitiesSyncModifier extends AbstractModifier {
  public closeWindowIntervalId = -1;
  protected activitiesSynchronize: ActivitiesSynchronize;
  protected extensionId: string;
  protected forceSync: boolean;
  protected fastSync: boolean;

  constructor(
    extensionId: string,
    activitiesSynchronize: ActivitiesSynchronize,
    fastSync: boolean,
    forceSync: boolean
  ) {
    super();
    this.activitiesSynchronize = activitiesSynchronize;
    this.extensionId = extensionId;
    this.forceSync = forceSync;
    this.fastSync = fastSync;
  }

  public modify(): void {
    // Make a white page !
    $("body").children().remove();

    let html = "";
    html += "<div>";
    html += '    <div id="syncContainer">';
    html += '       <div id="syncMessage">';
    html +=
      '           <span style="font-size: 28px;">Syncing activities to extension storage.</span> <br/><br/>' +
      "The <strong>first</strong> sync is long due to technical limitations on Strava side: <strong>~6 minutes / 100 activities</strong>. <strong>Upcoming syncs are short and silent.</strong> " +
      "Keep this window in background, it will close itself when synchronization is done.<br/><br/>" +
      "Synced activities are locally saved in the storage allocated by the extension." +
      "<br/><br/>On a daily use, your recent activities will be automatically pushed to the Elevate app when strava website is loaded." +
      '<br/><br/>In specific cases like "old" activities added, edited or deleted from strava, you have to launch synchronization by yourself.<br/><br/>' +
      "<i>Note: closing this window will stop the synchronization.</i>";
    html += "       </div>";
    html += '       <div class="progressBarGroup">';
    html += '           <div id="totalProgress">Global synchronisation progress</div>';
    html += '           <progress id="syncProgressBar" value="0" max="100"></progress>';
    html += '           <span id="totalProgressText"></span>';
    html += "        </div>";
    html += '        <div class="progressBarGroup">';
    html += '           <div id="syncStep"></div>';
    html += '           <progress id="syncStepProgressBar" value="0" max="100"></progress>';
    html += '           <span id="syncStepProgressText"></span>';
    html += "        </div>";
    html += '        <div id="syncStatusError" style="display: none;">';
    html +=
      "           <span><strong>This message is not an error:</strong> please continue your synchronization in 4~5 hours. Indeed, you actually reached the quota of activities which can be synced from Strava servers at the moment. Of course already synced activities will not be re-synced on next sync.<br/><br/> This limit is intended to avoid Strava servers errors or potential overload.</span>";
    html += "        </div>";
    html += '       <div id="syncInfos">';
    html += '           <div style="padding-bottom: 10px;" id="totalActivities"></div>';
    html += '           <div style="padding-bottom: 10px;" id="browsedActivitiesCount"></div>';
    html += '           <div style="padding-bottom: 10px;" id="storageUsage"></div>';
    html += '           <div style="padding-bottom: 10px;" id="autoClose"></div>';
    html += "       </div>";
    html += "    </div>";
    html += "</div>";

    $("body")
      .append(html)
      .each(() => {
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

  public cancelAutoClose(): void {
    clearInterval(this.closeWindowIntervalId);
    $("#autoClose").hide();
  }

  protected updateStorageUsage() {
    BrowserStorage.getInstance()
      .usage(BrowserStorageType.LOCAL)
      .then((storageUsage: AppStorageUsage) => {
        $("#storageUsage").html(
          "Extension local storage occupation: <strong>" +
            (storageUsage.bytesInUse / (1024 * 1024)).toFixed(1) +
            "MB</strong>"
        );
      });
  }

  protected sync(): void {
    // Start sync..
    const syncStart = performance.now();
    ActivitiesSynchronize.notifyBackgroundSyncStarted.call(this, this.extensionId); // Notify background page that sync is started
    this.activitiesSynchronize.sync(this.fastSync).then(
      (syncResult: SyncResultModel) => {
        console.log("Sync finished", syncResult);

        // Global progress
        $("#syncProgressBar").val(100);
        $("#totalProgressText").html("100%");

        ActivitiesSynchronize.notifyBackgroundSyncDone.call(this, this.extensionId, syncResult);
      },
      (error: any) => {
        console.error("Sync error", error);

        if (error) {
          // Too many request :/
          $("#syncStatusError").show();
          $(".progressBarGroup").hide();
          console.error(error);
        }
      },
      (progress: SyncNotifyModel) => {
        try {
          // Global progress
          $("#syncProgressBar").val((progress.browsedActivitiesCount / progress.totalActivities) * 100);
          $("#totalProgressText").html(
            ((progress.browsedActivitiesCount / progress.totalActivities) * 100).toFixed(0) + "%"
          );

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
              console.log("Sync time: " + Time.secToMilitary(totalSec) + " (" + Math.round(totalSec) + "s)");
              break;
          }

          $("#syncStep").html("Activity group <strong>" + progress.pageGroupId + "</strong> &#10141; " + stepMessage);
          $("#syncStepProgressBar").val(progress.progress);
          $("#syncStepProgressText").html(progress.progress.toFixed(0) + "%");

          document.title =
            "History synchronization @ " +
            ((progress.browsedActivitiesCount / progress.totalActivities) * 100).toFixed(0) +
            "%";

          // Infos
          $("#totalActivities").html("Total activities found <strong>" + progress.totalActivities + "</strong>");
          $("#browsedActivitiesCount").html(
            "Total activities processed <strong>" + progress.browsedActivitiesCount + "</strong>"
          );
        } catch (err) {
          console.warn("SyncNotify Warn", err);
        }
      }
    );
  }
}
