import { Component, OnInit } from "@angular/core";
import { ActivityService } from "../shared/services/activity/activity.service";
import { Gzip } from "@elevate/shared/tools";

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

	constructor(private activityService: ActivityService) {
	}

	public ngOnInit() {


		// const value = {
		// 	a: [0, 8, 2],
		// 	b: [10, 3, 1]
		// };
		//
		// const compress =  Buffer.from(require("pako").gzip(JSON.stringify(value), {to: "string"})).toString("base64");
		// const out = JSON.parse(require("pako").ungzip(Buffer.from(compress, "base64").toString(), {to: "string"}));

		// const compress = btoa(gzip(JSON.stringify(value), {to: "string"}));
		// console.log("compress", compress);
		// console.log(out);

		this.activityService.fetch(false).then(list => {
			const streams: string = <string> list[0].streams;
			const data = Gzip.unpack64(streams);
			console.warn(data);
		});

		// console.warn(Gzip.fromBase64("H8KLCAAAAAAAAAPCq1ZKVMKywoo2w5DCscOQMcKKw5VRSgLCsg0NdMKMdQxjawHDocOiw6XDtxoAAAA="))

		this.donateUrl = DonateComponent.PAYPAL_ACCOUNT_BASE_URL + "/"
			+ DonateComponent.DEFAULT_AMOUNT
			+ DonateComponent.DEFAULT_CURRENCY;
	}

	public onDonateClicked() {
		window.open(this.donateUrl, "_blank");
	}
}
