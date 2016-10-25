/**
 *  Editor.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/22/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/Editor'
], function (core) {
    'use strict';

    DE.Controllers.Editor = Backbone.Controller.extend((function() {
        // private

        function isPhone() {
            var ua = navigator.userAgent,
                isMobile = /Mobile(\/|\s)/.test(ua);

            return /(iPhone|iPod)/.test(ua) ||
                (!/(Silk)/.test(ua) && (/(Android)/.test(ua) && (/(Android 2)/.test(ua) || isMobile))) ||
                (/(BlackBerry|BB)/.test(ua) && isMobile) ||
                /(Windows Phone)/.test(ua);
        }

        function isTablet() {
            var ua = navigator.userAgent;

            return !isPhone(ua) && (/iPad/.test(ua) || /Android/.test(ua) || /(RIM Tablet OS)/.test(ua) ||
                (/MSIE 10/.test(ua) && /; Touch/.test(ua)));
        }

        return {
            // Specifying a EditorController model
            models: [],

            // Specifying a collection of out EditorView
            collections: [],

            // Specifying application views
            views: [
                'Editor'   // is main application layout
            ],

            // When controller is created let's setup view event listeners
            initialize: function() {
                // This most important part when we will tell our controller what events should be handled
            },

            setApi: function(api) {
                this.api = api;
            },

            // When our application is ready, lets get started
            onLaunch: function() {
                // Device detection
                var phone = isPhone();
                console.debug('Layout profile:', phone ? 'Phone' : 'Tablet');

                Common.SharedSettings.set('android', Framework7.prototype.device.android);
                Common.SharedSettings.set('phone', phone);

                $('html').addClass(phone ? 'phone' : 'tablet');

                // Create and render main view
                this.editorView = this.createView('Editor').render();

                $$(window).on('resize', _.bind(this.onWindowResize, this));
            },

            onWindowResize: function(e) {
                this.api && this.api.Resize();
            }
        }
    })());
});
