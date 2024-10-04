import { Component, Inject, OnInit } from "@angular/core";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";

@Component({
  selector: "app-donate",
  templateUrl: "./vert.component.html",
  styleUrls: ["./vert.component.scss"]
})
export class VertComponent implements OnInit {
  public static readonly DEFAULT_AMOUNT: number = 25;
  public static readonly DEFAULT_CURRENCY: string = "usd";
  public static readonly PAYPAL_ACCOUNT_BASE_URL: string = "https://www.paypal.me/thomaschampagne";

  public donateUrl: string;

  constructor(@Inject(OPEN_RESOURCE_RESOLVER) private readonly openResourceResolver: OpenResourceResolver) {}

  public ngOnInit() {
    this.donateUrl =
      VertComponent.PAYPAL_ACCOUNT_BASE_URL + "/" + VertComponent.DEFAULT_AMOUNT + VertComponent.DEFAULT_CURRENCY;
  }

  public onDonateClicked() {
    this.openResourceResolver.openLink(this.donateUrl);
  }
}
