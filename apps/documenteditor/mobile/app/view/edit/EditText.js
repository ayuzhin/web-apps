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
        var _fontsList,
            _editTextController;

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
                // "click #font-fonts" : "showPage",
                // "click #font-color" : "showPage"
            },

            initialize: function () {
                _editTextController = DE.getController('EditText');
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#font-fonts').single('click',        _.bind(me.showFonts, me));
                $('#font-color').single('click',        _.bind(me.showFontColor, me));
                $('#font-background').single('click',   _.bind(me.showBackgroundColor, me));
                $('#font-additional').single('click',   _.bind(me.showAdditional, me));
                $('#font-line-spacing').single('click', _.bind(me.showLineSpacing, me));

                me.initControls();
            },

            // Render layout
            render: function () {
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

            initControls: function () {
                //
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

                var me = this,
                    $template = $(
                        '<div>' +
                            '<li>' +
                                '<label class="label-radio item-content">' +
                                    '<input type="radio" name="font-name" value="{{name}}">' +
                                    (Framework7.prototype.device.android ? '<div class="item-media"><i class="icon icon-form-radio"></i></div>' : '') +
                                    '<div class="item-inner">' +
                                        '<div class="item-title" style="font-family: \'{{name}}\';">{{name}}</div>' +
                                    '</div>' +
                                '</label>' +
                            '</li>' +
                        '</div>'
                    );

                _fontsList = uiApp.virtualList('#font-list.virtual-list', {
                    items: DE.getController('EditText').getFonts(),
                    template: $template.html(),
                    onItemsAfterInsert: function (list, fragment) {
                        var fontInfo = _editTextController.getFontInfo();
                        $('#font-list input[name=font-name]').val([fontInfo.name]);

                        $('#font-list li').single('click', _.buffered(function (e) {
                            me.fireEvent('font:click', [me, e]);
                        }, 100));
                    }
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
            },

            showLineSpacing: function () {
                this.showPage('#edit-text-linespacing');
            }

        }
    })());
});