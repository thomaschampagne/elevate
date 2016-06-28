/**
 *   ReliveCCModifier is responsible of ...
 */
function ReliveCCModifier(activityId) {
    this.activityId = activityId;
    // this.appResources = appResources;
    // this.userSettings = userSettings;
}
/**
 * Define prototype
 */

ReliveCCModifier.prototype = {

    modify: function() {

        this.htmlReliveCCStyle = 'background: #fc4c02; color: #333;';
        this.htmlRemoteViewTextStyle = 'color: white;';

        var htmlReliveCC = "<li class='group'>";
        htmlReliveCC += "<div class='title' style='font-size: 14px; cursor: pointer;' id='stravistix_relivecc'>Relive Ride</div>";
        htmlReliveCC = $(htmlReliveCC);

        var self = this;

        $("#pagenav").append(htmlReliveCC).each(function() {

            $('#stravistix_relivecc').click(function(evt) {

                evt.preventDefault();
                evt.stopPropagation();

                var url = 'https://www.relive.cc/view/' + self.activityId;

                var embedUrl = url + '/embed';

                var windowWidth = window.innerWidth * 0.50;

                $.fancybox({
                    fitToView: true,
                    autoSize: true,
                    closeClick: false,
                    openEffect: 'none',
                    closeEffect: 'none',
                    scrolling: 'no',
                    'type': 'iframe',
                    'content': '<div style="text-align:center;"><a href="' + url + '" target="_blank">View in relive.cc website</a></div><iframe src="' + embedUrl + '" width="' + windowWidth + '" height="' + windowWidth * 9 / 16 + '" frameborder="0"></iframe>'
                });
            });
        });
    },
};
