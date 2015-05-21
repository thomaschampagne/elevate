if (typeof(vv_t) === 'undefined') {
    var vv_t
};

function quadKey(x, y, z) {
    var quadKey = [];
    for (var i = z; i > 0; i--) {
        var digit = '0';
        var mask = 1 << (i - 1);
        if ((x & mask) != 0) {
            digit++;
        }
        if ((y & mask) != 0) {
            digit++;
            digit++;
        }
        quadKey.push(digit);
    }
    return quadKey.join('');
}

function vv_flipMap(t) {
    if (typeof(d3) === 'undefined') {
        var s = document.createElement('script');
        s.src = 'http://veloviewer.com/js/d3.v2.js';
        document.getElementsByTagName('head')[0].appendChild(s);
        s.onload = function() {
            vv_flipMap(t);
        };
    } else {
        try {
            clearInterval(vv_t);
        } catch (e) {};

        var url = 'tile3.opencyclemap.org/cycle';
        switch (t) {
            case 'landscape':
                url = 'tile3.opencyclemap.org/landscape';
                break;
            case 'outdoors':
                url = 'tile3.opencyclemap.org/outdoors';
                break;
            case 'street':
                url = 'tile.openstreetmap.org';
                break;
            case 'os':
                url = 'tiles.virtualearth.net/tiles';
                break;
        }

        vv_t = setInterval(function() {
            d3.selectAll('img[src*=googleapis], #main_map img[src*=google]')
                .attr('src', function(d) {
                    if (t == 'os') {
                        var vals = this.src.match(/.*x=([0-9]*).*y=([0-9]*).*z=([0-9]*).*/);
                        if (vals != null && vals.length == 4 && parseInt(vals[3]) > 9) {
                            var x = vals[1];
                            var y = vals[2];
                            var z = vals[3];
                            return 'http://ecn.t' + '0123'.charAt(Math.floor(Math.random() * 3)) + '.' + url + '/r' + quadKey(parseInt(x), parseInt(y), parseInt(z)) + '?g=1567&lbl=l1&productSet=mmOS';
                        }
                        var vals = this.src.match(/i([0-9]*)!2i([0-9]*)!3i([0-9]*)/);
                        if (vals != null && vals.length == 4 && parseInt(vals[3]) > 9) {
                            var x = vals[2];
                            var y = vals[3];
                            var z = vals[1];
                            return 'http://ecn.t' + '0123'.charAt(Math.floor(Math.random() * 3)) + '.' + url + '/r' + quadKey(parseInt(x), parseInt(y), parseInt(z)) + '?g=1567&lbl=l1&productSet=mmOS';
                        }
                        return this.src;
                    } else {
                        return this.src.replace(/.*x=([0-9]*).*y=([0-9]*).*z=([0-9]*).*/,
                            'http://' + 'abc'.charAt(Math.floor(Math.random() * 3)) + '.' + url + '/$3/$1/$2.png');
                    }
                })
        }, 500);

        return vv_t;
    }
}
