import { Component, OnInit } from "@angular/core";

@Component({
	selector: "app-donate",
	templateUrl: "./donate.component.html",
	styleUrls: ["./donate.component.scss"]
})
export class DonateComponent implements OnInit {

	public static readonly DEFAULT_AMOUNT: number = 25;
	public static readonly DEFAULT_CURRENCY: string = "usd";
	public static readonly PAYPAL_ACCOUNT_BASE_URL: string = "https://www.paypal.me/thomaschampagne";
	public donateUrl: string;

	constructor() {
	}

	public ngOnInit() {
		this.donateUrl = DonateComponent.PAYPAL_ACCOUNT_BASE_URL + "/"
			+ DonateComponent.DEFAULT_AMOUNT
			+ DonateComponent.DEFAULT_CURRENCY;
	}

	public onDonateClicked() {
		window.open(this.donateUrl, "_blank");
	}
}
