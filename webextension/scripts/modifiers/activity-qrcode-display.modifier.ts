import $ from "jquery";
import { AppResourcesModel } from "../models/app-resources.model";
import * as QRCode from "qrcode";
import { AbstractModifier } from "./abstract.modifier";

export class ActivityQRCodeDisplayModifier extends AbstractModifier {
  protected appResources: AppResourcesModel;
  protected activityId: number;

  constructor(appResources: AppResourcesModel, activityId: number) {
    super();
    this.appResources = appResources;
    this.activityId = activityId;
  }

  public modify(): void {
    const html: string =
      "<a href='javascript:;' id='activityFlashCodeButton' class='button' title='Flash code for your mobile app'><img src='" +
      this.appResources.qrCodeIcon +
      "'/></a>";

    $("header>h2").width("65%");

    $(".collapse.button")
      .first()
      .before(html)
      .each(() => {
        // Once dom inserted
        $("#activityFlashCodeButton").click(() => {
          window.$.fancybox(
            "<div align='center'><h2>#elevate Activity Flash code</h2><h3>Scan from your smart phone.</h3><p><canvas style='padding: 0px 60px 0px 60px;' id='qrcode'></canvas></p><h3>Save by right click on image then \"Save image as...\"</h3></div>"
          );

          QRCode.toCanvas(
            document.getElementById("qrcode"),
            "http://app.strava.com/activities/" + this.activityId,
            error => {
              if (error) {
                console.error(error);
              }
              console.log("QRCode created");
            }
          );
        });
      });
  }
}
