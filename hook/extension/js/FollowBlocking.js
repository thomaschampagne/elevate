function FollowBlocking() {

    var self = this;

    this.followBlockNotDetected = function followBlockNotDetected() {
        self.onChecked(false);
    };

    this.followAdBlockDetected = function() {
        self.onChecked(true);
    };

    this.onChecked = function(onChecked) {
        self.onChecked = onChecked;
        self.check();
    };

    this.check = function() {

        fuckAdBlock.setOption('checkOnLoad', true);

        if (typeof fuckAdBlock === 'undefined') {
            self.followAdBlockDetected();
        } else {
            fuckAdBlock.onDetected(self.followAdBlockDetected);
            fuckAdBlock.onNotDetected(self.followBlockNotDetected);
        }

    }
};
