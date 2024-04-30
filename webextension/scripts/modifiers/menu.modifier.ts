/**
 * Handles main burger menu
 */
import { AppResourcesModel } from "../models/app-resources.model";
import { AbstractModifier } from "./abstract.modifier";

export class MenuModifier extends AbstractModifier {
  private athleteId: number;
  private appResources: AppResourcesModel;

  constructor(athleteId: number, appResources: AppResourcesModel) {
    super();
    this.athleteId = athleteId;
    this.appResources = appResources;
  }

  public heatmapClick(): void {
    if (window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
        (position: any) => {
          window.open(
            "http://labs.strava.com/heatmap/#12/" +
              position.coords.longitude +
              "/" +
              position.coords.latitude +
              "/gray/both",
            "_blank"
          );
        },
        (error: any) => {
          console.error(error);
          alert(
            "Some Elevate functions will not work without your location position. Please make sure you have allowed location tracking on this site. Click on the location icon placed on the right inside the chrome web address bar => Clear tracking setting => Refresh page > Allow tracking."
          );
        }
      );
    }
  }

  public modify(): void {
    // Add kom-map to global navigation
    const globalNav: JQuery = $(".global-nav");
    let html = "<li class='drop-down-menu nav-item'>";

    const menuStyle = "style='font-size:20px; background-color: transparent; color: #fc4c02;'";
    const menuIcon: string = this.appResources.menuIconOrange;

    const styleSideRight =
      "display: inline; float: right; border-top: 1px solid #DDD; border-left: 1px solid #DDD; width: 50%;";
    const styleSideLeft = "border-top: 1px solid #DDD; width: 50%;";

    html +=
      "<a title='Click Left > \"My Activity Feed\", click right > \"My Activities\"' href='https://www.strava.com/dashboard?feed_type=my_activity' class='nav-item drop-down-menu accessible-nav-dropdown' " +
      menuStyle +
      "><img style='vertical-align:middle' id='drop-down-menu_img' oncontextmenu='return false;' src='" +
      menuIcon +
      "'/></a>";
    html +=
      "<script>document.getElementById('drop-down-menu_img').onmousedown = function(event) { if (event.which == 3) { window.location.href = 'https://www.strava.com/athlete/training?utm_source=top-nav';}}</script>";
    html += "<ul class='options' style='width: 300px; max-height: 650px !important; overflow:hidden;'>";
    html +=
      "<li><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/activities'><img style='vertical-align:middle' src='" +
      this.appResources.viewListIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Activities</span></a></li>";
    html +=
      "<li><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/fitnessTrend'><img style='vertical-align:middle' src='" +
      this.appResources.timelineIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Fitness Trend</span></a></li>";
    html +=
      "<li><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/yearProgressions'><img style='vertical-align:middle' src='" +
      this.appResources.dateRange +
      "'/>&nbsp;&nbsp;&nbsp;<span>Year Progressions</span></a></li>";
    html +=
      "<li><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/globalSettings'><img style='vertical-align:middle' src='" +
      this.appResources.settingsIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Global Settings</span></a></li>";
    html +=
      "<li><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/athleteSettings'><img style='vertical-align:middle' src='" +
      this.appResources.athleteIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Athlete Settings</span></a></li>";
    // html += "<li><a href='http://labs.strava.com/achievement-map/' target='_blank'><img style='vertical-align:middle' src='" + this.appResources.komMapIcon + "'/> <span>KOM/CR Map</span></a></li>";
    html +=
      "<li ><a href='#' class='sx_menu_heatmap' id=\"heatmapGloablButton\"><img style='vertical-align:middle' src='" +
      this.appResources.heatmapIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Global Heatmap</span></a></li>";
    html +=
      "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" +
      this.appResources.settingsLink +
      "#/donate' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.donateIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Donate</span></a></li>";
    html +=
      "<li style='border-top: 1px solid #DDD;'><a style='font-style: italic;' href='" +
      this.appResources.settingsLink +
      "#/releasesNotes' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.systemUpdatesIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span><strong>" +
      this.appResources.extVersionName +
      "</strong> release notes</span></a></li>";

    html +=
      "<li style='" +
      styleSideRight +
      "'><a style='font-style: italic;' href='https://chrome.google.com/webstore/detail/elevate-for-strava/dhiaggccakkgdfcadnklkbljcgicpckn/reviews' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.rateIcon +
      "'/> <span>Rate</span></a></li>";
    html +=
      "<li style='" +
      styleSideLeft +
      "' ><a  style='font-style: italic;' href='https://twitter.com/champagnethomas' style='font-style: italic;' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.twitterIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>What's next?</span></a></li>";

    html +=
      "<li style='" +
      styleSideRight +
      "'><a style='font-style: italic;' href='https://www.strava.com/clubs/elevatestrava' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.peopleIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Join Club</span></a></li>";
    html +=
      "<li style='" +
      styleSideLeft +
      "'><a style='font-style: italic;' href='" +
      this.appResources.settingsLink +
      "#/help' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.helpIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span> FAQ</span></a></li>";

    html +=
      "<li style='" +
      styleSideRight +
      "'><a style='font-style: italic;' href='" +
      this.appResources.settingsLink +
      "#/report' target='_blank'><img style='vertical-align:middle' src='" +
      this.appResources.bugIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Report bug</span></a></li>";
    html +=
      "<li style='border-top: 1px solid #DDD;" +
      styleSideLeft +
      "'><a target='_blank' href='https://thomaschampagne.github.io/elevate/'><img style='vertical-align:middle' src='" +
      this.appResources.shareIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span>Share</span></a></li>";
    html +=
      "<li style='border-top: 1px solid #DDD;'><a target='_blank' href='" +
      this.appResources.settingsLink +
      "#/desktopApp'><img style='vertical-align:middle' src='" +
      this.appResources.systemUpdatesIcon +
      "'/>&nbsp;&nbsp;&nbsp;<span style='color: #fc4c02;'>Download Desktop App</span></a></li>";
    html += "</ul>";
    html += "</li>";
    globalNav.children().first().before(html);

    $("#heatmapGloablButton").click(() => {
      this.heatmapClick();
    });
  }
}
