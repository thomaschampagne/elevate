import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { UserSettingsService } from "../shared/services/user-settings/user-settings.service";
import _ from "lodash";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { LoggerService } from "../shared/services/logging/logger.service";
import { DomSanitizer } from "@angular/platform-browser";
import leaflet from "leaflet";
import leafletImage from 'leaflet-image';
import 'leaflet-providers';
import 'leaflet-easybutton';

import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { AppService } from "../shared/services/app-service/app.service";

@Component({
  selector: "app-heat-map",
  templateUrl: "./heat-map.component.html",
  styleUrls: ["./heat-map.scss"]
})
export class HeatMapComponent implements OnInit, OnDestroy, AfterViewInit {
  private options: any;
  private tracks: any[];
  private filters: { minDate: null; maxDate: null };
  private map: any;
  private imageMarkers: any[];
  private mapTiles: any;
  constructor(
    @Inject(UserSettingsService) private readonly userSettingsService: UserSettingsService,
    @Inject(DomSanitizer) public readonly domSanitizer: DomSanitizer,
    @Inject(ActivatedRoute) private readonly route: ActivatedRoute,
    @Inject(MatDialog) private readonly dialog: MatDialog,
    @Inject(LoggerService) private readonly logger: LoggerService,
    @Inject(AppService) private readonly appService: AppService
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

  switchTheme(themeName) {
    if (this.mapTiles) {
      this.mapTiles.removeFrom(this.map);
    }

    if (themeName !== "No map") {
      this.mapTiles = leaflet.tileLayer.provider(themeName);
      this.mapTiles.addTo(this.map, { detectRetina: true });
    }
  }

  public ngAfterViewInit(): void {
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
        detectColors: true,
      },
      markerOptions: {
        color: "#00FF00",
        weight: 3,
        radius: 5,
        opacity: 0.5
      }
    };

    this.options = DEFAULT_OPTIONS;
    this.tracks = [];
    this.filters = {
      minDate: null,
      maxDate: null
    };
    this.imageMarkers = [];

    this.map = leaflet.map("background-map", {
      center: INIT_COORDS,
      zoom: 10,
      preferCanvas: true
    });

    this.switchTheme(this.options.theme);
  }
}
