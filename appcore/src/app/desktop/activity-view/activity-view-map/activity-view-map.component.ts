import { Component, Inject, Input, OnInit } from "@angular/core";
import L, {
  Control,
  Icon,
  LatLngTuple,
  Layer,
  Map as LeafLetMap,
  MapOptions,
  marker,
  Marker,
  PointTuple,
  Polyline,
  polyline,
  TileLayer,
  tileLayer
} from "leaflet";
import { ActivityViewService } from "../shared/activity-view.service";
import _ from "lodash";

// Map fullscreen support and declaration
import "../../../../../node_modules/leaflet-fullscreen/dist/Leaflet.fullscreen.js";
import { dirname } from "@elevate/shared/tools";
import { UserSettingsService } from "../../../shared/services/user-settings/user-settings.service";
import { DesktopUserSettingsService } from "../../../shared/services/user-settings/desktop/desktop-user-settings.service";
import { LoggerService } from "../../../shared/services/logging/logger.service";
import { UserSettings } from "@elevate/shared/models";
import { LeafletMapType } from "@elevate/shared/enums";
import DesktopUserSettingsModel = UserSettings.DesktopUserSettingsModel;

declare module "leaflet" {
  namespace Control {
    function Fullscreen(v: any): void;
  }
}

const THUNDERFOREST_KEYS: string[] = JSON.parse(
  atob(
    "WyI3YzM1MmM4ZmYxMjQ0ZGQ4YjczMmUzNDllMGIwZmU4ZCIsImRlZjRkZGFlMTNlNDRiZDc5ODgyY2NjMjRjZjQ4NmQ5IiwiZGI1YWUxZjU3NzhhNDQ4Y2E2NjI1NTQ1ODFmMjgzYzUiLCI4ZGI1YmYzOGUzZDg0MWI2YTU3YTcyMDFmNzhjZmJlYyIsImU2MDQyMmU2MzZmMzQ5ODhhNzkwMTU0MDI3MjQ3NTdiIiwiYWM3Mjc0NDQwMjJjNDYxMzlkYjlkZTU0ZmU4MGJlZTgiLCIxZjEwMzgxM2NjZjA0ZDcyYTExMGM3MGRlYjhlYjZlMSIsIjcyYjc3ZjdmYmU4MTQ4YTlhMDFiODQ2ZjZlODU0MDg5IiwiOTRjYmY1ODYzOTY1NGUzODk2YjliNDVkYTVhOTJmOTgiLCJhMGEwNDdmZWRmMDI0ZmE0OTI1ZGZjMTRkYzhmYmQ1MyIsIjA0NDhjODliMTNhYzQzN2ViNzIxNTNlMGI4ODc5YTU5IiwiN2ZlYjJkY2U2NGQ3NDQyNzhiNjM4NDI4NDYzYzQ1MmYiLCI2NThkNWNkOTUwMzE0NmY4OTE4N2M2MjY0YzZlODNiNiIsIjhmYzE1YTExZWRmOTRhZTA5ZWZjMDNkNDAxYTdkZTRiIiwiZWQ4YThjOTg0NDI5NDk1ODg1MDE0ODllN2Y4MzY4MzEiLCI4YzExMGQ1ZmEwYTc0Y2NmYjIxOWExM2Y5NjU0MWZiMCIsImY1NzBkNzMxZmRkMzQwMDRhNjQ1ODdkODdhMDJjODFkIiwiNjE3MGFhZDEwZGZkNDJhMzhkNGQ4YzcwOWE1MzZmMzgiLCIyMDVmNzU4MDM3ZTI0ZjU0OGI0YzMxMDQzMzA4NzlkYyIsImVjMjQ4ODkwYTZlZDQzYjg4NDFlYTI0MzgxOWY4ZDBkIiwiMmExMTBlZGM4M2U5NDNlZmIxZTgzNjQwNjAzNTFjOTUiLCIxMjVhYTZjY2M3NGY0MzJlYTgxNzE2OTI1YWEzNzRjYSIsIjgxNmY4OTdhNDU2YjQ1OTVhMDliZjhlMWQ0MmNmYTBiIiwiYjQ3YTNjZjg5NWI5NGFlZGFkNDFlNWNmYjUyMjJiODciLCJmNDQzMzQ1NjBiZGI0NzcxYTA0MTYwOWNjNzVhODk4MyIsImVkMDNlNTk2M2ZmZjQ1Nzc5YzcyOGRiZmJkNTlhMTU2IiwiYTEwOWI4MWE5NzliNDFiZTg5NzE2N2YyOWU3ZjM1N2IiLCI4ZWM5ZmYxYTFhNjY0OWFmYTM0NTc1MDIwZWUxOTMwMCIsImFlM2M1NjQ1ZjFmMzQ0MGJiMTk5OWY3N2I1NjE2NGFkIl0="
  )
);

const getThunderForestApiKey = (): string => {
  return THUNDERFOREST_KEYS[_.random(0, THUNDERFOREST_KEYS.length - 1)];
};

const TILES_DEF_MAP: Map<LeafletMapType, TileLayer> = new Map<LeafletMapType, TileLayer>([
  [
    LeafletMapType.ATLAS,
    tileLayer(`https://{s}.tile.thunderforest.com/atlas/{z}/{x}/{y}.png?apikey=${getThunderForestApiKey()}`, {
      subdomains: "abc",
      maxZoom: 18,
      attribution: "&copy; Thunderforest"
    })
  ],

  [
    LeafletMapType.LANDSCAPE,
    tileLayer(`https://{s}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png?apikey=${getThunderForestApiKey()}`, {
      subdomains: "abc",
      maxZoom: 19,
      attribution: "&copy; Thunderforest"
    })
  ],
  [
    LeafletMapType.OUTDOOR,
    tileLayer(`https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=${getThunderForestApiKey()}`, {
      subdomains: "abc",
      maxZoom: 18,
      attribution: "&copy; Thunderforest"
    })
  ],
  [
    LeafletMapType.TOPOGRAPHIC,
    tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      subdomains: "abc",
      opacity: 0.6,
      attribution: "&copy; OpenTopoMap"
    })
  ],
  [
    LeafletMapType.STREETS,
    tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: "abc",
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap"
    })
  ],
  [
    LeafletMapType.SATELLITE,
    tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18,
      attribution: "&copy; Esri"
    })
  ]
]);

@Component({
  selector: "app-activity-view-map",
  templateUrl: "./activity-view-map.component.html",
  styleUrls: ["./activity-view-map.component.scss"]
})
export class ActivityViewMapComponent implements OnInit {
  constructor(
    @Inject(UserSettingsService) private readonly userSettingsService: DesktopUserSettingsService,
    @Inject(ActivityViewService) private readonly activityViewService: ActivityViewService,
    @Inject(LoggerService) private readonly logger: LoggerService
  ) {
    this.map = null;
    this.selectedBoundedPath = null;
    this.activityPath = null;
    this.syncedGraphMarker = null;
    this.layersControl = null;
    this.leafletLayers = [];
  }

  private static readonly DEFAULT_ACTIVITY_PATH_COLOR: string = "#ff4800";

  private static readonly DEFAULT_MAP_ICON_SIZE: PointTuple = [16, 16];

  private static readonly START_ACTIVITY_ICON: Icon = L.icon({
    iconUrl: `${ActivityViewMapComponent.getMapIconDir()}/start.svg`,
    iconSize: ActivityViewMapComponent.DEFAULT_MAP_ICON_SIZE
  });

  private static readonly END_ACTIVITY_ICON: Icon = L.icon({
    iconUrl: `${ActivityViewMapComponent.getMapIconDir()}/end.svg`,
    iconSize: ActivityViewMapComponent.DEFAULT_MAP_ICON_SIZE
  });

  private static readonly MOVE_ACTIVITY_ICON: Icon = L.icon({
    iconUrl: `${ActivityViewMapComponent.getMapIconDir()}/move.svg`,
    iconSize: ActivityViewMapComponent.DEFAULT_MAP_ICON_SIZE
  });

  public static readonly MAP_WIDTH_PERCENT = 100;
  public static readonly MAP_HEIGHT_PX = 375;

  @Input()
  public latLng: LatLngTuple[];

  public readonly MAP_WIDTH_PERCENT = ActivityViewMapComponent.MAP_WIDTH_PERCENT;
  public readonly MAP_HEIGHT_PX = ActivityViewMapComponent.MAP_HEIGHT_PX;

  public options: MapOptions;
  public layersControl: Control.Layers;
  public leafletLayers: Layer[];
  public map: LeafLetMap;
  private syncedGraphMarker: Marker;
  private selectedBoundedPath: Polyline;
  private activityPath: Polyline;

  private static getMapIconDir(): string {
    return `${dirname(location.pathname)}/assets/leaflet-icons`;
  }

  public ngOnInit(): void {
    // Configure leaflet map
    this.options = {
      scrollWheelZoom: false
    };

    this.handleSelectedGraphBounds();
  }

  public onMapReady(map: LeafLetMap): void {
    this.logger.debug("Map is ready");

    // Store map
    this.map = map;

    // Find and apply default layer preference
    this.userSettingsService.fetch().then((userSettings: DesktopUserSettingsModel) => {
      const defaultTileLayerPreferences = TILES_DEF_MAP.get(userSettings.defaultMapType);
      this.map.addLayer(defaultTileLayerPreferences);
    });

    // Configure map fullscreen
    this.map.addControl(new L.Control.Fullscreen({ fullscreenControl: true }));

    // Clean attributions
    this.map.attributionControl.setPrefix(false);

    // Create polyline path of activity
    this.activityPath = polyline(this.latLng, {
      color: ActivityViewMapComponent.DEFAULT_ACTIVITY_PATH_COLOR
    }).addTo(this.map);

    // Add start/end markers
    marker(_.first(this.latLng), { icon: ActivityViewMapComponent.START_ACTIVITY_ICON }).addTo(this.map);
    marker(_.last(this.latLng), { icon: ActivityViewMapComponent.END_ACTIVITY_ICON }).addTo(this.map);

    // Zoom the map to the polyline
    this.fitToActivityPath();

    // Listen for graph hover index changes to update position of syncedGraphMarker on map
    this.syncedGraphMarker = marker(_.first(this.latLng), {
      icon: ActivityViewMapComponent.MOVE_ACTIVITY_ICON,
      opacity: 0
    }).addTo(this.map);

    this.handleMoveOverGraphIndexes();
  }

  private handleMoveOverGraphIndexes(): void {
    this.activityViewService.graphMouseOverIndex$.subscribe(graphMouseOverEvent => {
      if (Number.isFinite(graphMouseOverEvent)) {
        // On graph index event
        this.showMoveMarkerAtLatLngIndex(graphMouseOverEvent as number);
      } else {
        if (!graphMouseOverEvent) {
          // On graph out event
          this.hideMoveMarker();
        }
      }
    });
  }

  private handleSelectedGraphBounds(): void {
    this.activityViewService.selectedGraphBounds$.subscribe(selectedBounds => {
      if (!this.map) {
        return;
      }

      if (selectedBounds && selectedBounds.length === 2) {
        // Remove any existing selected bounded path if exist
        if (this.selectedBoundedPath) {
          this.selectedBoundedPath.remove();
        }

        // We have to ensure overlayPane exists before adding a polyline
        if (!this.map.getPanes().overlayPane) {
          return;
        }

        // Create polyline bounded path from sliced lat/lng array
        const boundedPathLatLng = this.latLng.slice(selectedBounds[0], selectedBounds[1]);
        this.selectedBoundedPath = polyline(boundedPathLatLng, { color: "black" }).addTo(this.map);

        // Zoom in selected path
        const bounds = this.selectedBoundedPath.getBounds();
        if (bounds && bounds.isValid()) {
          this.map.fitBounds(bounds, { maxZoom: 16 });
        }
      } else {
        // Selected bounds might have been reset, remove existing selected bounded path if necessary
        if (this.selectedBoundedPath) {
          this.selectedBoundedPath.remove();
        }

        // Reset map center
        this.fitToActivityPath();
      }
    });
  }

  private fitToActivityPath(): void {
    if (!this.map.getPanes().overlayPane) {
      return;
    }

    if (this.activityPath) {
      const bounds = this.activityPath.getBounds();
      if (bounds && bounds.isValid()) {
        this.map.fitBounds(bounds);
      }
    }
  }

  private hideMoveMarker(): void {
    this.syncedGraphMarker.setOpacity(0);
  }

  private showMoveMarkerAtLatLngIndex(latLngIndex: number): void {
    const latLng = this.latLng[latLngIndex];
    if (latLng) {
      this.syncedGraphMarker.setLatLng(latLng);
      this.syncedGraphMarker.setOpacity(1);
    }
  }

  public onLayersControlReady(layersControl: Control.Layers): void {
    setTimeout(() => {
      this.layersControl = layersControl;

      // Configure available layers
      // Reverse LeafletMapType to get enum values as keys and enum keys as values
      // This will allow to get nice name of the map type in below loop
      const invertedLeafletMapTypes = _.invert(LeafletMapType);
      for (const [mapType, layer] of TILES_DEF_MAP.entries()) {
        layersControl.addBaseLayer(layer, _.startCase(invertedLeafletMapTypes[mapType].toLowerCase()));
      }
    });
  }

  /**
   * This allow centering on map using right click
   */
  public onAuxClick(mouseEvent: MouseEvent): void {
    this.fitToActivityPath();
  }
}
