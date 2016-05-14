/**
 * Homemade gulp params manager
 */
module.exports = {
    params: null,
    read: function(argv) {
        var paramsClean = [];
        argv.slice(2, argv.length).forEach(function(p) {
            if (p.startsWith('--') && p.length !== 2) {
                paramsClean.push(p.replace('--', ''));
            }
        });
        return paramsClean;
    },

    has: function(param) {
        if (!this.params) {
            this.params = this.read(process.argv);
        }
        return (this.params.indexOf(param) !== -1);
    }
};
