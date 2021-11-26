import { Config, Layout, PlotData, PlotMarker, PlotType, ScatterLine } from "plotly.js";
import _ from "lodash";
import { Theme } from "../../../../shared/enums/theme.enum";
import { Identifier } from "@elevate/shared/tools/identifier";
import { Sensor } from "./sensors/sensor.model";

interface ChartThemeStyle {
  textColor: string;
  gridColor: string;
}

export abstract class PlotChart {
  private static readonly THEME_CHART_STYLE_MAP = new Map<Theme, ChartThemeStyle>([
    [Theme.LIGHT, { textColor: "black", gridColor: "#efefef" }],
    [Theme.DARK, { textColor: "white", gridColor: "#4d4d4d" }]
  ]);

  protected constructor(layout: Partial<Layout> = {}, config: Partial<Config> = {}) {
    this.layout = _.merge(_.cloneDeep(PlotChart.DEFAULT_LAYOUT), layout);
    this.config = _.merge(_.cloneDeep(PlotChart.DEFAULT_CFG), config);
    this.useResizeHandler = PlotChart.DEFAULT_RESIZE_HANDLER;
    this.data = [];
    this.plotDataMap = new Map<string, Partial<PlotData>>();
    this.id = Identifier.generate();
  }

  private static readonly DEFAULT_LAYOUT: Partial<Layout> = {
    font: { size: 11, family: "Roboto" },
    title: {},
    xaxis: {},
    yaxis: {},
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent"
  };

  private static readonly DEFAULT_CFG: Partial<Config> = { showTips: false, displaylogo: false, displayModeBar: false };

  private static readonly DEFAULT_RESIZE_HANDLER = true;

  public id: string;
  public data: Partial<PlotData>[];
  public layout: Partial<Layout>;
  public config: Partial<Config>;
  public useResizeHandler: boolean;
  protected plotDataMap: Map<string, Partial<PlotData>>;

  protected abstract getThemedLayout(chartThemeStyle: ChartThemeStyle): Partial<Layout>;

  protected addPlotData(type: PlotType, name: string): Partial<PlotData> {
    // Create trace data
    const traceData: Partial<PlotData> = {
      name: name,
      type: type,
      x: [],
      y: []
    };

    // Add to map for tracking
    this.plotDataMap.set(name, traceData);

    // Register it
    this.data.push(traceData);

    // Return as pointer for external specific config
    return traceData;
  }

  public getPlotData(key: string): Partial<PlotData> {
    return this.plotDataMap.get(key);
  }

  public setTheme(theme: Theme): void {
    // Fetch chart theme config and layout
    const chartThemeStyle = PlotChart.THEME_CHART_STYLE_MAP.get(theme);
    const themedLayout = this.getThemedLayout(chartThemeStyle);

    // Apply themed layout to current layout
    this.layout = _.merge(this.layout, themedLayout);
  }

  public clear(): void {
    this.data = [];
    this.plotDataMap.clear();
  }
}

export class ScatterChart extends PlotChart {
  constructor(layout: Partial<Layout> = {}, config: Partial<Config> = {}) {
    super(layout, config);
  }

  public addTrace(traceIndex: number, sensor: Sensor, lineProperty: Partial<ScatterLine>): Partial<PlotData> {
    // Create trace data
    const traceData = super.addPlotData("scatter", sensor.name);

    // Add trace specifics
    traceData.yaxis = `y${traceIndex}`;
    traceData.line = lineProperty;
    if (sensor.areaColor) {
      traceData.fill = "tozeroy";
      traceData.fillcolor = sensor.areaColor;
    }

    // Return as pointer for external specific config
    return traceData;
  }

  public getTraceData(key: string): Partial<PlotData> {
    return this.getPlotData(key);
  }

  protected getThemedLayout(chartThemeStyle: ChartThemeStyle): Partial<Layout> {
    return {
      xaxis: {
        gridcolor: chartThemeStyle.gridColor,
        tickfont: {
          color: chartThemeStyle.textColor
        },
        titlefont: {
          color: chartThemeStyle.textColor
        }
      },
      yaxis: {
        gridcolor: chartThemeStyle.gridColor,
        titlefont: {
          color: chartThemeStyle.textColor
        }
      },
      legend: {
        font: {
          color: chartThemeStyle.textColor
        }
      }
    };
  }
}

export class LogChart extends ScatterChart {
  private static readonly CHART_LAYOUT_SPECIFICS: Partial<Layout> = {
    xaxis: { fixedrange: true, type: "log" },
    yaxis: { fixedrange: true }
  };

  constructor(layout: Partial<Layout> = {}, config: Partial<Config> = {}) {
    super(_.merge(_.cloneDeep(LogChart.CHART_LAYOUT_SPECIFICS), layout), config);
  }

  protected getThemedLayout(chartThemeStyle: ChartThemeStyle): Partial<Layout> {
    const parentThemedLayout = super.getThemedLayout(chartThemeStyle);

    const logChartThemedLayout: Partial<Layout> = {
      yaxis: {
        tickfont: {
          color: chartThemeStyle.textColor
        },
        titlefont: {
          color: chartThemeStyle.textColor
        }
      }
    };
    return _.merge(parentThemedLayout, logChartThemedLayout);
  }
}

export class BarsChart extends PlotChart {
  private static readonly CHART_LAYOUT_SPECIFICS: Partial<Layout> = {
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true, type: "date", tickformat: "%H:%M:%S" }
  };

  constructor(layout: Partial<Layout> = {}, config: Partial<Config> = {}) {
    super(_.merge(_.cloneDeep(BarsChart.CHART_LAYOUT_SPECIFICS), layout), config);
  }

  public addBarsData(name: string, marker: Partial<PlotMarker>): Partial<PlotData> {
    // Create trace data
    const traceData = super.addPlotData("bar", name);

    // Add trace specifics
    traceData.marker = marker;

    // Return as pointer for external specific config
    return traceData;
  }

  protected getThemedLayout(chartThemeStyle: ChartThemeStyle): Partial<Layout> {
    return {
      title: {
        font: {
          color: chartThemeStyle.textColor
        }
      },
      xaxis: {
        tickfont: {
          color: chartThemeStyle.textColor
        },
        titlefont: {
          color: chartThemeStyle.textColor
        }
      },
      yaxis: {
        gridcolor: chartThemeStyle.gridColor,
        tickfont: {
          color: chartThemeStyle.textColor
        },
        titlefont: {
          color: chartThemeStyle.textColor
        }
      },
      legend: {
        font: {
          color: chartThemeStyle.textColor
        }
      }
    };
  }
}
