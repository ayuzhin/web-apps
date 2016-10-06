/**
 *  EditText.js
 *  Edit Text viewer
 *
 *  Created by Alexander Yuzhin on 10/4/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditText.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditText = Backbone.View.extend({
        // el: '.view-main',

        template: _.template(editTemplate),

        events: {
            // "click #font-fonts" : "showPage",
            // "click #font-color" : "showPage"
        },

        initialize: function() {
            Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
        },

        initEvents: function () {
            $('#font-fonts').single('click', _.bind(this.showPage, this));
            $('#font-color').single('click', _.bind(this.showPage, this));
        },

        // Render layout
        render: function() {
            this.layout = $('<div/>').append(this.template({
                android: Framework7.prototype.device.android,
                phone: false
            }));

            return this;
        },

        rootLayout: function () {
            if (this.layout) {
                return this.layout
                    .find('#edit-text-root')
                    .html();
            }

            return '';
        },

        showPage: function() {
            var rootView = DE.getController('EditContainer').rootView;

            if (rootView && this.layout) {
                var $content = this.layout.find('#edit-text-fonts');

                // Android fix for navigation
                if (Framework7.prototype.device.android) {
                    $content.find('.page').append($content.find('.navbar'));
                }

                rootView.router.load({
                    content: $content.html()
                });
            }
        }
    });
});