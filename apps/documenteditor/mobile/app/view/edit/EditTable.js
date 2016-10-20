/**
 *  EditTable.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/20/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditTable.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditTable = Backbone.View.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#table-wrap').single('click',        _.bind(me.showTableWrap, me));
                $('#table-options').single('click',     _.bind(me.showTableOptions, me));
                // $('#font-color').single('click',        _.bind(me.showFontColor, me));
                // $('#font-background').single('click',   _.bind(me.showBackgroundColor, me));
                // $('#font-additional').single('click',   _.bind(me.showAdditional, me));
                // $('#font-line-spacing').single('click', _.bind(me.showLineSpacing, me));

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
                        .find('#edit-table-root')
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

            showTableWrap: function () {
                this.showPage('#edit-table-wrap');
            },

            showTableOptions: function () {
                this.showPage('#edit-table-options');
            }

        }
    })());
});