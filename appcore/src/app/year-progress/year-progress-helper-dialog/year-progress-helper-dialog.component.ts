import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-year-progress-helper-dialog",
  template: `
    <mat-dialog-content>
      <app-year-progress-user-guide></app-year-progress-user-guide>
    </mat-dialog-content>
  `,
  styles: []
})
export class YearProgressHelperDialogComponent implements OnInit {
  public static readonly MAX_WIDTH: string = "80%";
  public static readonly MIN_WIDTH: string = "40%";

  public ngOnInit(): void {}
}
