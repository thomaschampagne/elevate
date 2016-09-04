var Loader = function() {};

Loader.prototype = {

    require: function(scripts, callback) {
        this.loadCount = 0;
        this.totalRequired = scripts.length;
        this.callback = callback;

        for (var i = 0; i < scripts.length; i++) {
            this.writeScript(chrome.extension.getURL(scripts[i]));
        }
    },
    loaded: function(evt) {
        this.loadCount++;
        if (this.loadCount == this.totalRequired && typeof this.callback == 'function') this.callback.call();
    },
    writeScript: function(src) {

        var ext = src.substr(src.lastIndexOf('.') + 1);

        var self = this;

        var head = document.getElementsByTagName('head')[0];

        if (ext === 'js') {
            var s = document.createElement('script');
            s.type = "text/javascript";
            s.async = false;
            s.src = src;
            s.addEventListener('load', function(e) {
                self.loaded(e);
            }, false);
            head.appendChild(s);
        } else if (ext === 'css') {
            var link = document.createElement('link');
            link.href = src;
            link.addEventListener('load', function(e) {
                self.loaded(e);
            }, false);
            link.async = false;
            link.type = 'text/css';
            link.rel = 'stylesheet';
            head.appendChild(link);
        }
    },

    injectJS: function (string) {

        var inner = document.createElement('script');

        inner.textContent = string;

        inner.onload = function() {
            this.parentNode.removeChild(this);
        };

        (document.head || document.documentElement).appendChild(inner);
    }
};
