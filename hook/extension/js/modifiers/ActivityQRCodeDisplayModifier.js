/*
 *   ActivityQRCodeDisplayModifier is responsible of ...
 */
function ActivityQRCodeDisplayModifier(appResources, activityId) {
    this.appResources_ = appResources;
    this.activityId_ = activityId;
}

/**
 * Define prototype
 */
ActivityQRCodeDisplayModifier.prototype = {

    modify: function modify() {

        console.warn("ActivityQRCodeDisplayModifier");

        var html = '<a href="javascript:;" id="activityFlashCodebutton" class="button" title="Flash code for your mobile app"><img src="' + this.appResources_.qrCodeIcon + '"/></a>';

        jQuery('.sharing').children().first().before(html).each(function() {

            // Once dom inserted
            jQuery('#activityFlashCodebutton').click(function() {

                jQuery.fancybox('<div align="center"><h2>Activity Flash code</h2><h3>Scan with your smartphone to display activity on Strava mobile app.</h3><p><div id="qrcode"></div>save image</p></div>');

                var qrcode = new QRCode("qrcode", {
                    text: "http://app.strava.com/activities/" + this.activityId_,
                    width: 384,
                    height: 384,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });

            }.bind(this));

        }.bind(this));
    }
};