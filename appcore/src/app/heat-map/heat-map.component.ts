import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import _ from "lodash";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { Subscription, timer } from "rxjs";
import { LoggerService } from "../shared/services/logging/logger.service";
import { DomSanitizer } from "@angular/platform-browser";
import leaflet from "leaflet";
import leafletImage from "leaflet-image";
import "leaflet-providers";
import "leaflet-easybutton";

import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AppService } from "../shared/services/app-service/app.service";
import { Activity } from "@elevate/shared/models/sync/activity.model";
import { WarningException } from "@elevate/shared/exceptions/warning.exception";
import moment from "moment/moment";
import { ProcessStreamMode } from "@elevate/shared/sync/compute/stream-processor";
import { Streams } from "@elevate/shared/models/activity-data/streams.model";
import { debounce } from "rxjs/operators";
import { AppError } from "../shared/models/app-error.model";
import { MeasureSystem } from "@elevate/shared/enums/measure-system.enum";
import { ActivityService } from "../shared/services/activity/activity.service";
import { DesktopActivityService } from "../shared/services/activity/impl/desktop-activity.service";
import DesktopUserSettings = UserSettings.DesktopUserSettings;
import BaseUserSettings = UserSettings.BaseUserSettings;
import { StreamsService } from "../shared/services/streams/streams.service";
import {ElevateSport} from "@elevate/shared/enums/elevate-sport.enum";
import {YearProgressTypeModel} from "../year-progress/shared/models/year-progress-type.model";

@Component({
  selector: "app-heat-map",
  templateUrl: "./heat-map.component.html",
  styleUrls: ["./heat-map.scss"]
})
export class HeatMapComponent implements OnInit, OnDestroy, AfterViewInit {
  private options: any;
  private map: any;
  private mapTiles: any;
  public isLoading: Boolean = true;
  public availableActivityTypes: ElevateSport[];
  public activityTypes: string | any[];
  public includeCommuteRide: Boolean;
  constructor(
    @Inject(UserSettingsService) private readonly userSettingsService: UserSettingsService,
    @Inject(DomSanitizer) public readonly domSanitizer: DomSanitizer,
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(AppService) private readonly appService: AppService,
    @Inject(ActivityService) protected readonly activityService: DesktopActivityService,
    @Inject(StreamsService) protected readonly streamsService: StreamsService
  ) {}

  public historyChangesSub: Subscription;

  public ngOnInit(): void {
    this.logger.debug("HeatMap component initialized");

    // Listen for sync done to reload component
    this.historyChangesSub = this.appService.historyChanges$.subscribe(() => {
      this.ngOnDestroy();
      this.ngOnInit();
    });
  }

  public ngOnDestroy(): void {
    this.historyChangesSub.unsubscribe();
  }

  private switchTheme(themeName): void {
    if (this.mapTiles) {
      this.mapTiles.removeFrom(this.map);
    }

    if (themeName !== "No map") {
      this.mapTiles = leaflet.tileLayer.provider(themeName);
      this.mapTiles.addTo(this.map, { detectRetina: true });
    }
  }

  private async plotActivities(): Promise<void> {
    const activities = await this.activityService.findSorted();
    for (let i = 0; i < activities.length; i++) {
      try {
        const activity = activities[i];
        const streams: Streams = await this.streamsService.getProcessedById(ProcessStreamMode.DISPLAY, activity.id, {
          type: activity.type,
          hasPowerMeter: activity.hasPowerMeter,
          isSwimPool: activity.isSwimPool,
          athleteSnapshot: activity.athleteSnapshot
        });
        leaflet.polyline(streams?.latlng, { color: "red" }).addTo(this.map);
      } catch (err) {
        //this.logger.error(err)
        //this.logger.error("Impossible to load this activity !");
      }
    }
    this.isLoading = false;
  }

  public async ngAfterViewInit(): Promise<void> {
    // Los Angeles is the center of the universe
    const INIT_COORDS = [34.0522, -118.243];

    const DEFAULT_OPTIONS = {
      theme: "CartoDB.DarkMatter",
      lineOptions: {
        color: "#0CB1E8",
        weight: 1,
        opacity: 0.5,
        smoothFactor: 1,
        overrideExisting: true,
        detectColors: true
      },
      markerOptions: {
        color: "#00FF00",
        weight: 3,
        radius: 5,
        opacity: 0.5
      }
    };

    this.options = DEFAULT_OPTIONS;

    this.map = leaflet.map("background-map", {
      center: INIT_COORDS,
      zoom: 10,
      preferCanvas: true
    });

    this.switchTheme(this.options.theme);
    this.plotActivities();
  }

  public async onSelectedActivityTypesChanged(): Promise<void> {
    if (this.activityTypes.length > 0) {
      return await this.plotActivities();
    }
  }

  public async onTickAllActivityTypes(): Promise<void> {
    this.activityTypes = this.availableActivityTypes;
    return await this.onSelectedActivityTypesChanged();
  }

  public async onUnTickAllActivityTypes(): Promise<void> {
    this.activityTypes = [_.first(this.availableActivityTypes)];
    return await this.onSelectedActivityTypesChanged();
  }

  public async onIncludeCommuteRideToggle(): Promise<void> {
    return await this.plotActivities();
  }

  public startCase(sport: string): string {
    return _.startCase(sport);
  }
}
