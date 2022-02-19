import { Component } from "@angular/core";
import { PlotChart } from "./models/plot-chart.model";
import { AppService } from "../../../shared/services/app-service/app.service";
import { PlotlyService } from "angular-plotly.js";
import { Plotly } from "angular-plotly.js/lib/plotly.interface";

@Component({ template: `` })
export abstract class BaseChartComponent<T extends PlotChart> {
  public chart: T;

  private chartDivId: Plotly.PlotlyHTMLElement;

  abstract createChart(): T;

  protected constructor(protected readonly appService: AppService, protected readonly plotlyService: PlotlyService) {
    this.chart = this.createChart();
    this.chart.setTheme(appService.currentTheme);

    this.appService.themeChanges$.subscribe(theme => {
      this.chart.setTheme(theme);
      this.redraw();
    });
  }

  protected redraw(): void {
    // Fetch plotly html element from chart Id
    if (!this.chartDivId) {
      this.chartDivId = this.plotlyService.getInstanceByDivId(this.chart.id);
    }

    // Force re-draw if div exists
    if (this.chartDivId) {
      this.plotlyService.update(this.chartDivId, this.chart.data, this.chart.layout, this.chart.config);
    }
  }
}
