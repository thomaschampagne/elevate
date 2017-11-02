import {IAppResources} from "../interfaces/IAppResources";
import * as QRCode from "qrcode";

export class ActivityQRCodeDisplayModifier implements IModifier {

    protected appResources: IAppResources;
    protected activityId: number;

    constructor(appResources: IAppResources, activityId: number) {
        this.appResources = appResources;
        this.activityId = activityId;
    }

    public modify(): void {

        const html: string = '<a href="javascript:;" id="activityFlashCodebutton" class="button" title="Flash code for your mobile app"><img src="' + this.appResources.qrCodeIcon + '"/></a>';

        $(".collapse.button").first().before(html).each(() => {

            // Once dom inserted
            $("#activityFlashCodebutton").click(() => {

                $.fancybox('<div align="center"><h2>#stravistix Activity Flash code</h2><h3>Scan from your smartphone.</h3><p><canvas style="padding: 0px 60px 0px 60px;" id="qrcode"></canvas></p><h3>Save by right click on image then "Save image as..."</h3></div>');

                QRCode.toCanvas(document.getElementById("qrcode"),
                    "http://app.strava.com/activities/" + this.activityId, (error) => {
                        if (error) console.error(error)
                        console.log('QRCode created');
                    })

            });

        });
    }
}
