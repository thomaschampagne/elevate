/**
 *   ActivityQRCodeDisplayModifier is responsible of ...
 */
function ActivityQRCodeDisplayModifier(appResources) {
    this.appResources_ = appResources;
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

                console.warn('innnn');

                jQuery.fancybox('<div><h1>QRCODE :)</h1><p>qrcode here + save as...</p></div>');
            }.bind(this));
        }.bind(this));
    }
};
