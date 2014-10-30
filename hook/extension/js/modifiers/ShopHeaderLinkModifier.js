/**
 *   ShopHeaderLinkModifier is responsible of ...
 */
function ShopHeaderLinkModifier() {}

/**
 * Define prototype
 */
ShopHeaderLinkModifier.prototype = {

    modify: function modify() {
        var globalNav = jQuery(".global-nav");
        globalNav.children().last().hide();
    }
};
