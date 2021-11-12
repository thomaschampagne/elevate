import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-fitness-info-dialog",
  template: `
    <mat-dialog-content>
      <app-fitness-trend-user-guide [readMore]="true"></app-fitness-trend-user-guide>
    </mat-dialog-content>
  `,
  styles: []
})
export class FitnessInfoDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  constructor() {}

  public ngOnInit(): void {}
}
