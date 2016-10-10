/**
 *  EditText.js
 *  Document Editor
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
            $('#font-fonts').single('click', _.bind(this.showFonts, this));
            $('#font-color').single('click', _.bind(this.showFonts, this));

            this.initControls();
        },

        // Render layout
        render: function() {
            this.layout = $('<div/>').append(this.template({
                android : Common.SharedSettings.get('android'),
                phone   : Common.SharedSettings.get('phone')
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

        initControls: function() {
            var api = DE.getController('EditText').api;

            if (api) {
                var stack = api.getSelectedElements(),
                    paragraph;

                _.each(stack, function(object) {
                    if (Asc.c_oAscTypeSelectElement.Paragraph == object.get_ObjectType()) {
                        paragraph = object.get_ObjectValue();
                        return;
                    }
                });

                if (paragraph) {

                }


            }
            // $('#font-bold').active
            // $('#font-
            // $('#font-
            // $('#font-
        },

        showPage: function(templateId) {
            var rootView = DE.getController('EditContainer').rootView;

            if (rootView && this.layout) {
                var $content = this.layout.find(templateId);

                // Android fix for navigation
                if (Framework7.prototype.device.android) {
                    $content.find('.page').append($content.find('.navbar'));
                }

                rootView.router.load({
                    content: $content.html()
                });
            }
        },

        showFonts: function() {
            this.showPage('#edit-text-fonts')
        }
    });
});