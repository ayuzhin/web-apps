/**
 *  extendes.js
 *
 *  Created by Alexander Yuzhin on 10/14/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

(function() {

    //Extend jQuery functions
    jQuery.fn.extend( {
        single: function(types, selector, data, fn) {
            return this.off(types, fn).on(types, selector, data, fn);
        }
    });

    //Extend Dom7 functions
    var methods = ['addClass', 'toggleClass', 'removeClass'];

    _.each(methods, function (method, index) {
        var originalMethod = Dom7.fn[method];

        Dom7.fn[method] = function(className) {
            var result = originalMethod.apply(this, arguments);
            this.trigger(method, className);
            return result;
        };
    });

    //Extend Underscope functions
    _.buffered = function(func, buffer, scope, args) {
        var timerId;

        return function() {
            var callArgs = args || Array.prototype.slice.call(arguments, 0),
                me = scope || this;

            if (timerId) {
                clearTimeout(timerId);
            }

            timerId = setTimeout(function(){
                func.apply(me, callArgs);
            }, buffer);
        };
    };

})();