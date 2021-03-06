/**
 *  EditParagraph.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/14/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditParagraph.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditParagraph = Backbone.View.extend((function() {
        // private
        // var _paragraphStyles;

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

                $('#paragraph-background').single('click',  _.bind(me.showColors, me));
                $('#paragraph-advanced').single('click',    _.bind(me.showAdvanced, me));

                me.renderStyles();

                DE.getController('EditParagraph').initSettings();
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
                        .find('#edit-paragraph-root')
                        .html();
                }

                return '';
            },

            showPage: function (templateId, customFireEvent) {
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

                    if (customFireEvent !== true) {
                        this.fireEvent('page:show', [this, templateId]);
                    }
                }
            },

            renderStyles: function () {
                var me = this,
                    thimbSize = DE.getController('EditParagraph').getTumbSize(),
                    $styleList = $('#paragraph-list ul'),
                    template = _.template(
                        '<li>' +
                            '<label class="label-radio item-content">' +
                                '<input type="radio" name="paragraph-style" value="<%= name %>">' +
                                (Framework7.prototype.device.android ? '<div class="item-media"><i class="icon icon-form-radio"></i></div>' : '') +
                                '<div class="item-inner">' +
                                    '<div data-name="<%= name %>" class="item-title style" style="background-image: url(<%= image %>); width: ' +  thimbSize.width + 'px; height: ' + thimbSize.height + 'px; background-size: contain;"></div>' +
                                '</div>' +
                            '</label>' +
                        '</li>'
                    );

                _.each(DE.getController('EditParagraph').getStyles(), function(style) {
                    $(template(style)).appendTo($styleList).on('click', _.buffered(function (e) {
                        me.fireEvent('style:click', [me, e]);
                    }, 100))
                });
            },

            showColors: function () {
                this.showPage('#edit-paragraph-color', true);

                this.paletteBackgroundColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-paragraph-color] .page-content'),
                    transparent: true
                });

                this.fireEvent('page:show', [this, '#edit-paragraph-color']);
            },

            showAdvanced: function () {
                this.showPage('#edit-paragraph-advanced');
            }
        }
    })());
});
