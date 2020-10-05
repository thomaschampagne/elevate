import { Component } from "@angular/core";

@Component({
    selector: "app-loading-dialog",
    template: `
        <div class="mat-body-1">
            <i>Please wait...</i>
            <mat-progress-bar mode="buffer"></mat-progress-bar>
        </div>
    `,
    styles: [
        `
            mat-progress-bar {
                padding-top: 5px;
            }

            div {
                text-align: center;
                width: 300px;
            }
        `,
    ],
})
export class LoadingDialogComponent {}
