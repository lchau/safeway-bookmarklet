// Safeway "Just for U" cross-browser compatible batch clicker
// For usage on: http://www.safeway.com/ShopStores/Justforu-CouponCenter.page?
//
// Note: Safeway uses ExtJS 4, which is the only way we can force 
// the page to show all coupons
//
// Compression: http://javascriptcompressor.com
// @author: lchau
function is_null(o) {
    return !o || typeof (o) === "undefined";
}

function not_null(o) {
    return !is_null(o);
}

// methods to roughly emulate Java AssertionError
function AssertionError(message) {
    this.message = message;
    this.toString = function () {
        return 'AssertionError: ' + this.message;
    }
}

function assert(expr, message) {
    if (!expr) {
        throw new AssertionError(message);
    }
}

function assertNotNull(o, message) {
    assert(not_null(o), message);
}
// end AssertionError emulation

// similate a DOM click event
var click = function () {
    var event = document.createEvent("HTMLEvents");
    event.initEvent("click", true, true);
    return function (e) {
        assertNotNull(e, "Element cannot be null");
        console.debug("dispatching click event -> " + e);
        e.dispatchEvent(event);
    };
}();

var get_value = function () {
    var delimiter = "_=_=_";
    return function (name) {
        assertNotNull(name, "Cookie name cannot be null");
        console.debug("Getting value for cookie (name=" + name + ")");
        var value = Ext.util.Cookies.get(name);
        if (is_null(value)) {
            console.warn("Value does not exist (name=" + name + ")");
        } else {
            console.debug("Extracting value: " + value);
            value = value.split(delimiter)[1];
            if (is_null(value)) {
                // delimiter changed
                console.warn("Failed to extract value (name=" + name + ")");
            }
        }
        return value;
    }
}();

// main
(function () {
    function click_coupons() {
        Ext.select("div.lt-add-offer").each(function () {
            // fire events to all anchor tags
            if (this.isVisible()) {
                click(this.first().dom);
            }
        });
    }
    var value = get_value(Loyalty.itemsPerPageCookieName);
    // check page size
    if (parseInt(value) == Loyalty.pageSizeAll) {
        click_coupons();
    } else {
        var components = Ext.ComponentQuery.query("component[cls='lt-pagination']");
        if (not_null(components) && components.length > 0) {
            // event triggers n number of requests for each item through a sequence 
            // of delegators where n is the number of total offers; if the user
            // is unable to see all offers, we'll show it for them [and preserving
            // their cookie setting]
            components[0].fireEvent("pagesizechange", Loyalty.pageSizeAll);
            Ext.onDocumentReady(function () {
                // create a deferred task (easier than adding a listener to 
                // every object as it's created) fires of a large amount of 
                // simultaneous requests
                var task = new Ext.util.DelayedTask(function () {
                    click_coupons();
                });
                // ideally, users will save "all" view , but just in case they don't
                // we create a delayed task to give the request a chance to finish
                // and the browser to finish rendering
                task.delay(10000);
            });

        }
    }
})();