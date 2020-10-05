import { Component, Inject, OnInit } from "@angular/core";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";

@Component({
    selector: "app-donate",
    templateUrl: "./donate.component.html",
    styleUrls: ["./donate.component.scss"],
})
export class DonateComponent implements OnInit {
    public static readonly DEFAULT_AMOUNT: number = 25;
    public static readonly DEFAULT_CURRENCY: string = "usd";
    public static readonly PAYPAL_ACCOUNT_BASE_URL: string = "https://www.paypal.me/thomaschampagne";

    public donateUrl: string;

    constructor(@Inject(OPEN_RESOURCE_RESOLVER) public openResourceResolver: OpenResourceResolver) {}

    public ngOnInit() {
        this.donateUrl =
            DonateComponent.PAYPAL_ACCOUNT_BASE_URL +
            "/" +
            DonateComponent.DEFAULT_AMOUNT +
            DonateComponent.DEFAULT_CURRENCY;
    }

    public onDonateClicked() {
        this.openResourceResolver.openLink(this.donateUrl);
    }
}
