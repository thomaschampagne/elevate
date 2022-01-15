import { Component, HostListener, Inject, Input, OnDestroy, OnInit } from "@angular/core";
import mapboxgl, { FitBoundsOptions, LngLatBounds } from "mapbox-gl";
import { StylesControl } from "mapbox-gl-controls";
import { dirname } from "@elevate/shared/tools/dirname";
import _ from "lodash";
import { ActivityViewService } from "../shared/activity-view.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { Subscription } from "rxjs";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { DesktopUserSettingsService } from "../../../shared/services/user-settings/desktop/desktop-user-settings.service";
import { UserSettings } from "@elevate/shared/models/user-settings/user-settings.namespace";
import { StyleOption } from "mapbox-gl-controls/lib/StylesControl/types";
import { MapTokenService } from "../../mapbox/map-token.service";
import DesktopUserSettings = UserSettings.DesktopUserSettings;

@Component({
  selector: "app-activity-view-map",
  templateUrl: "./activity-view-map.component.html",
  styleUrls: ["./activity-view-map.component.scss"]
})
export class ActivityViewMapComponent implements OnInit, OnDestroy {
  constructor(
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(MapTokenService) private readonly mapTokenService: MapTokenService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.isMapReady = null;
  }
  private static readonly SELECTED_PATH_NAME = "selectedPath";
  private static readonly STYLES: StyleOption[] = [
    {
      label: "Outdoor",
      styleName: "outdoor",
      styleUrl: "mapbox://styles/thomaschampagne/ckwtg0i5k0lv915paq5sxff4j"
    },
    {
      label: "Satellite",
      styleName: "satellite",
      styleUrl: "mapbox://styles/mapbox/satellite-v9?optimize=true"
    }
  ];

  public static readonly MAP_HEIGHT_PX = 375;
  private static readonly ACTIVITY_PATH_FIT_OPTIONS: FitBoundsOptions = { padding: 20 };
  private static readonly SELECTED_PATH_FIT_OPTIONS: FitBoundsOptions = { padding: 100 };
  private static readonly ACTIVITY_PATH_COLOR: string = "#f1083a";
  private static readonly SELECTED_PATH_COLOR: string = "#1e1e1e";

  @Input()
  public latLng: [number, number][];

  public lngLat: [number, number][];
  private map: mapboxgl.Map;
  private activityBounds: mapboxgl.LngLatBounds;
  private moveMarker: mapboxgl.Marker;
  private selectedGraphBoundsSubscription: Subscription;
  public isMapReady: boolean;

  private static getActivityBounds(lngLat: [number, number][]): LngLatBounds {
    const bounds = new LngLatBounds(lngLat[0], lngLat[1]);

    // Extend the 'LngLatBounds' to include every coordinate in the bounds result.
    for (const point of lngLat) {
      bounds.extend(point);
    }
    return bounds;
  }

  private static createMapMarkerElement(iconName: string): HTMLElement {
    const element = document.createElement("div");
    element.className = "marker";
    element.style.backgroundImage = `url(${dirname(location.pathname)}/assets/map-icons/${iconName}.svg)`;
    element.style.width = "16px";
    element.style.height = "16px";
    element.style.backgroundSize = "100%";
    return element;
  }

  @HostListener("fullscreenchange")
  public onFullScreenChange(): void {
    setTimeout(() => this.map.resize());
  }

  public ngOnInit(): void {
    this.getMapBoxToken().then(token => {
      this.configure(token);
    });
  }

  private getMapBoxToken(): Promise<string> {
    return this.mapTokenService.get();
  }

  private configure(mapBoxToken: string): void {
    if (!mapBoxToken) {
      this.isMapReady = false;
      return;
    }

    // Assign token
    mapboxgl.accessToken = mapBoxToken;

    // Invert lat and long for map box
    this.lngLat = this.latLng.map(latLng => [latLng[1], latLng[0]]) as [number, number][];

    // Get activity path bounds and declare fit options
    this.activityBounds = ActivityViewMapComponent.getActivityBounds(this.lngLat);

    // Create map
    this.map = new mapboxgl.Map({
      optimizeForTerrain: true,
      container: "map", // container ID
      bounds: this.activityBounds,
      fitBoundsOptions: ActivityViewMapComponent.ACTIVITY_PATH_FIT_OPTIONS,
      antialias: false,
      zoom: 13, // starting zoom,
      maxZoom: 17,
      attributionControl: false,
      touchPitch: false,
      touchZoomRotate: false,
      doubleClickZoom: false,
      pitchWithRotate: false
    });

    // Configure fullscreen
    this.map.addControl(new mapboxgl.FullscreenControl());

    // ... and navigation
    this.map.addControl(new mapboxgl.NavigationControl());

    // Setup map styles and switch buttons
    this.setupStyles();

    // Support section selection from user (graph, intervals, best splits)
    this.handleSelectedGraphBounds();

    // Listen mouse over graph event and move "move marker" at proper location
    this.handleMoveOverGraphIndexes();

    // Setup ready callback
    this.map.on("load", () => this.onMapReady());

    // Listen for style data events: we have to wait this event to draw paths/markers on style change
    this.map.on("styledata", evt => {
      this.onStyleReady();
    });

    // Reset map fit to bound on double click
    this.map.on("dblclick", () => {
      this.fitBoundsToActivity();
      this.removePath(ActivityViewMapComponent.SELECTED_PATH_NAME);
    });

    // Handle map error
    this.map.on("error", event => {
      this.logger.error(event.error.message);
      this.isMapReady = false;
    });
  }

  private setupStyles(): void {
    // Find and apply default style preference
    this.userSettingsService.fetch().then((userSettings: DesktopUserSettings) => {
      const preferredStyle =
        _.find<StyleOption>(ActivityViewMapComponent.STYLES, { styleName: userSettings.defaultMapType }) ||
        ActivityViewMapComponent.STYLES[0];
      this.map.setStyle(preferredStyle.styleUrl);
    });

    // Add map switch controls
    this.map.addControl(
      new StylesControl({
        styles: ActivityViewMapComponent.STYLES,
        onChange: () => this.onMapReady() // On change style call map ready callback
      }),
      "bottom-right"
    );
  }

  public onStyleReady(): void {
    this.logger.debug("Style ready");
    this.drawActivityPath();
  }

  public onMapReady(): void {
    this.logger.debug("Map is ready");
    this.createMapMarkers(this.lngLat);
    this.drawActivityPath();
    this.isMapReady = true;
  }

  private handleMoveOverGraphIndexes(): void {
    this.activityViewService.graphMouseOverIndex$.subscribe(graphMouseOverEvent => {
      if (!this.isMapReady) {
        return;
      }

      if (Number.isFinite(graphMouseOverEvent)) {
        this.showMoveMarkerAtLatLngIndex(graphMouseOverEvent as number);
      } else {
        if (!graphMouseOverEvent) {
          this.hideMoveMarker(); // On graph out event
        }
      }
    });
  }

  private drawPath(name: string, color: string, pathLngLat: [number, number][]): void {
    // Remove move marker to avoid move marker duplicate glitch on source+layer add or remove
    if (!this.map.getSource(name)) {
      this.map.addSource(name, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: pathLngLat
          }
        }
      });
    }

    if (!this.map.getLayer(name)) {
      this.map.addLayer({
        id: name,
        type: "line",
        source: name,
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": color,
          "line-width": 3
        }
      });
    }
  }

  private removePath(name: string): void {
    // Remove move marker to avoid move marker duplicate glitch on source+layer add or remove

    if (this.map.getLayer(name)) {
      this.map.removeLayer(name);
    }

    if (this.map.getSource(name)) {
      this.map.removeSource(name);
    }
  }

  private drawActivityPath(): void {
    this.drawPath("activity", ActivityViewMapComponent.ACTIVITY_PATH_COLOR, this.lngLat);
  }

  private createMapMarkers(lngLat: [number, number][]): void {
    // Create start marker
    new mapboxgl.Marker(ActivityViewMapComponent.createMapMarkerElement("start")).setLngLat(lngLat[0]).addTo(this.map);

    // Create end marker
    new mapboxgl.Marker(ActivityViewMapComponent.createMapMarkerElement("end"))
      .setLngLat(_.last(lngLat))
      .addTo(this.map);

    // Create move marker
    this.moveMarker = new mapboxgl.Marker(ActivityViewMapComponent.createMapMarkerElement("move")).setLngLat(lngLat[0]);

    // Add marker to map and don't display the move marker on first load: only when mouse moves on graph
    this.moveMarker.addTo(this.map);
    this.hideMoveMarker();
  }

  private hideMoveMarker(): void {
    this.moveMarker.remove();
  }

  private showMoveMarkerAtLatLngIndex(latLngIndex: number): void {
    const latLng = this.latLng[latLngIndex];

    if (latLng) {
      this.moveMarker.addTo(this.map);
      this.moveMarker.setLngLat([latLng[1], latLng[0]]);
    }
  }

  private handleSelectedGraphBounds(): void {
    this.selectedGraphBoundsSubscription = this.activityViewService.selectedGraphBounds$.subscribe(selectedBounds => {
      // Do we have bounds selected?
      if (selectedBounds?.length === 2) {
        // Remove any existing path if exists
        this.removePath(ActivityViewMapComponent.SELECTED_PATH_NAME);

        // Get activity path bounds from selected indexes
        const boundedLngLat = this.lngLat.slice(selectedBounds[0], selectedBounds[1]);

        // Get path bounds
        const pathBounds = ActivityViewMapComponent.getActivityBounds(boundedLngLat);

        // Draw selected bound path
        this.drawPath(
          ActivityViewMapComponent.SELECTED_PATH_NAME,
          ActivityViewMapComponent.SELECTED_PATH_COLOR,
          boundedLngLat
        );

        // And fit map to him
        this.map.fitBounds(pathBounds, ActivityViewMapComponent.SELECTED_PATH_FIT_OPTIONS);
      } else {
        // No bounds selected, remove any existing path if exists
        this.removePath(ActivityViewMapComponent.SELECTED_PATH_NAME);

        // And fit map to activity
        this.fitBoundsToActivity();
      }
    });
  }

  private fitBoundsToActivity(): void {
    this.map.fitBounds(this.activityBounds, ActivityViewMapComponent.ACTIVITY_PATH_FIT_OPTIONS);
  }

  public ngOnDestroy(): void {
    if (this.selectedGraphBoundsSubscription) {
      this.selectedGraphBoundsSubscription.unsubscribe();
    }
  }
}
