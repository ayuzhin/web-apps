/**
 *  Editor.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/22/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'text!documenteditor/mobile/app/template/Editor.template',
    'jquery',
    'underscore',
    'backbone'
], function (editorTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.Editor = Backbone.View.extend({
        el: 'body',

        // Compile our stats template
        template: _.template(editorTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
        },

        // Set innerHTML and get the references to the DOM elements
        initialize: function() {
            //
        },

        // Render layout
        render: function() {
            var el = $(this.el);
            el.html(this.template({
                backTitle: Framework7.prototype.device.android ? '' : ''
            }));

            this.f7View = uiApp.addView('.view-main', {
                // params
            });

            return this;
        }
    });
});