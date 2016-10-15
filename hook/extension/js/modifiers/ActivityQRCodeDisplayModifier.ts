class ActivityQRCodeDisplayModifier implements IModifier {

    protected appResources: IAppResources;
    protected activityId: number;

    constructor(appResources: IAppResources, activityId: number) {
        this.appResources = appResources;
        this.activityId = activityId;
    }

    public modify(): void {

        let html: string = '<a href="javascript:;" id="activityFlashCodebutton" class="button" title="Flash code for your mobile app"><img src="' + this.appResources.qrCodeIcon + '"/></a>';

        $('.collapse.button').first().before(html).each(() => {

            // Once dom inserted
            $('#activityFlashCodebutton').click(() => {

                $.fancybox('<div align="center"><h2>#stravistix Activity Flash code</h2><h3>Scan from smartphone to get activity on Strava mobile app.</h3><p><div style="padding: 0px 60px 0px 60px;" id="qrcode"></div></p><h3>Save by right click on image then "Save image as..."</h3></div>');

                let qrcode: any = new QRCode("qrcode", {
                    text: "http://app.strava.com/activities/" + this.activityId,
                    width: 384,
                    height: 384,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

            });

        });
    }
}