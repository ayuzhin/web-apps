/**
 *  EditShape.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/21/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditShape.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditShape = Backbone.View.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('editcategory:show',  _.bind(this.categoryShow, this));
            },

            initEvents: function () {
                var me = this;

                $('#shape-style').single('click',                   _.bind(me.showStyle, me));
                $('#shape-wrap').single('click',                    _.bind(me.showWrap, me));
                $('#shape-replace').single('click',                 _.bind(me.showReplace, me));
                $('#shape-reorder').single('click',                 _.bind(me.showReorder, me));
                $('#edit-shape-bordercolor').single('click',        _.bind(me.showBorderColor, me));

                $('.edit-shape-style .categories a').single('click', _.bind(me.showStyleCategory, me));

                me.initControls();
            },

            categoryShow: function(e) {
                // if ('edit-shape' == $(e.currentTarget).prop('id')) {
                //     this.initEvents();
                // }
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    shapes  : Common.SharedSettings.get('shapes')
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#edit-shape-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId, suspendEvent) {
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

                    if (suspendEvent !== true) {
                        this.fireEvent('page:show', [this, templateId]);
                    }

                    this.initEvents();
                }
            },

            showStyleCategory: function (e) {
                // remove android specific style
                $('.page[data-page=edit-shape-style] .list-block.inputs-list').removeClass('inputs-list');
            },

            showStyle: function () {
                var selector = '#edit-shape-style';
                this.showPage(selector, true);

                this.paletteFillColor = new Common.UI.ThemeColorPalette({
                    el: $('#tab-shape-fill'),
                    transparent: true
                });

                this.fireEvent('page:show', [this, selector]);
            },

            showWrap: function () {
                this.showPage('#edit-shape-wrap');
            },

            showReplace: function () {
                this.showPage('#edit-shape-replace');
            },

            showReorder: function () {
                this.showPage('#edit-shape-reorder');
            },

            showBorderColor: function () {
                var selector = '#edit-shape-border-color-view';
                this.showPage(selector, true);

                this.paletteBorderColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-shape-border-color] .page-content')
                });

                this.fireEvent('page:show', [this, selector]);
            }
        }
    })());
});