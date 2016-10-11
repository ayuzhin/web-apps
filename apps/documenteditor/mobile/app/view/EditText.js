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

    DE.Views.EditText = Backbone.View.extend((function() {
        // private
        var fontNames;

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
                // "click #font-fonts" : "showPage",
                // "click #font-color" : "showPage"
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#font-fonts').single('click',        _.bind(me.showFonts, me));
                $('#font-color').single('click',        _.bind(me.showFontColor, me));
                $('#font-background').single('click',   _.bind(me.showBackgroundColor, me));
                $('#font-additional').single('click',   _.bind(me.showAdditional, me));

                me.initControls();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android: Common.SharedSettings.get('android'),
                    phone: Common.SharedSettings.get('phone')
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

            initControls: function () {
                var api = DE.getController('EditText').api;

                if (api) {
                    var stack = api.getSelectedElements(),
                        paragraph;

                    _.each(stack, function (object) {
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

            showPage: function (templateId) {
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

                    this.fireEvent('page:show', this);
                }
            },

            showFonts: function () {
                this.showPage('#edit-text-fonts');

                var fonts = [];
                for (var i = 0; i < 500; i++) {
                    fonts.push({
                        title: 'Font name ' + i,
                        picture: 'path/to/font.jpg'
                    })
                }

                fontNames = uiApp.virtualList('#font-list.virtual-list', {
                    items: fonts,
                    template:
                    '<li class="item-content">' +
                        '<div class="item-media"><img src="{{picture}}"></div>' +
                        '<div class="item-inner">' +
                            '<div class="item-title">{{title}}</div>' +
                        '</div>' +
                    '</li>'
                });
            },

            showFontColor: function () {
                this.showPage('#edit-text-color');
            },

            showBackgroundColor: function () {
                this.showPage('#edit-text-background');
            },

            showAdditional: function () {
                this.showPage('#edit-text-additional');
            }

        }
    })());
});
