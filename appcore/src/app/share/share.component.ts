import { Component, Inject, OnInit } from "@angular/core";
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from "@angular/platform-browser";
import { OPEN_RESOURCE_RESOLVER, OpenResourceResolver } from "../shared/services/links-opener/open-resource-resolver";

@Component({
	selector: "app-share",
	templateUrl: "./share.component.html",
	styleUrls: ["./share.component.scss"]
})
export class ShareComponent implements OnInit {

	public static readonly TWEET: string = "https://twitter.com/intent/tweet?text=As%20an%20athlete%2C%20you%20should%20try" +
		"%20the%20%23ElevateTraining%20app%20developed%20by%20%40champagnethomas.%20Get%20it%20here%20%20http%3A%2F%2Fthomaschampagne.github.io%2Felevate%2F%20for%20free." +
		"%20%23cycling%20%23running%20%40GarminFitness%20%40wahoofitness%20%40suunto%20%40PolarGlobal%20%40fitbit%20%40strava";

	public static readonly FACEBOOK_POST: string = "https://www.facebook.com/sharer/sharer.php?u=https%3A//www.facebook.com/elevatestrava";
	public static readonly LANDING_PAGE_URL: string = "http://thomaschampagne.github.io/elevate/";

	constructor(public iconRegistry: MatIconRegistry,
				public sanitizer: DomSanitizer,
				@Inject(OPEN_RESOURCE_RESOLVER) public openResourceResolver: OpenResourceResolver) {
	}

	public ngOnInit(): void {
		this.iconRegistry.addSvgIcon("twitter", this.sanitizer.bypassSecurityTrustResourceUrl("./assets/icons/twitter.svg"));
		this.iconRegistry.addSvgIcon("facebook", this.sanitizer.bypassSecurityTrustResourceUrl("./assets/icons/facebook.svg"));
	}

	public onOpenTweet(): void {
		this.openResourceResolver.openLink(ShareComponent.TWEET);
	}

	public onOpenFacebook(): void {
		this.openResourceResolver.openLink(ShareComponent.FACEBOOK_POST);
	}

	public onOpenLandingPage(): void {
		this.openResourceResolver.openLink(ShareComponent.LANDING_PAGE_URL);
	}


}
