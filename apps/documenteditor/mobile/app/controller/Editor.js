/**
 *  Editor.js
 *  Editor controller
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

    DE.Controllers.Editor = Backbone.Controller.extend({
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
            // Create and render main view
            this.editorView = this.createView('Editor').render();

            $$(window).on('resize', _.bind(this.onWindowResize, this));
        },

        onWindowResize: function(e) {
            this.api && this.api.Resize();
        }
    });
});
