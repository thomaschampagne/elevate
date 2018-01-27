import { Component, OnInit } from "@angular/core";
import { MatIconRegistry } from "@angular/material";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
	selector: "app-share",
	templateUrl: "./share.component.html",
	styleUrls: ["./share.component.scss"]
})
export class ShareComponent implements OnInit {

	public static readonly TWEET: string = "https://twitter.com/intent/tweet?text=As%20%23strava%20user,%20you" +
		"%20should%20try%20%23stravistix%20web%20extension%20by%20%40champagnethomas." +
		"%20Get%20it%20here%20%20http://thomaschampagne.github.io/stravistix/.%20%23cycling%20%23running%20%23geek";

	public static readonly FACEBOOK_POST: string = "https://www.facebook.com/sharer/sharer.php?u=https%3A//www.facebook.com/stravistixforstrava";
	public static readonly LANDING_PAGE_URL: string = "http://thomaschampagne.github.io/stravistix/";

	constructor(public iconRegistry: MatIconRegistry,
				public sanitizer: DomSanitizer) {
	}

	public ngOnInit(): void {
		this.iconRegistry.addSvgIcon("twitter", this.sanitizer.bypassSecurityTrustResourceUrl("./assets/icons/twitter.svg"));
		this.iconRegistry.addSvgIcon("facebook", this.sanitizer.bypassSecurityTrustResourceUrl("./assets/icons/facebook.svg"));
	}

	public onOpenTweet(): void {
		window.open(ShareComponent.TWEET, "_blank", "width=600,height=300");
	}

	public onOpenFacebook(): void {
		window.open(ShareComponent.FACEBOOK_POST, "_blank", "width=600,height=600");
	}

	public onOpenLandingPage(): void {
		window.open(ShareComponent.LANDING_PAGE_URL, "_blank");
	}


}
