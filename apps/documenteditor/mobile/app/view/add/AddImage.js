/**
 *  AddImage.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/18/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'text!documenteditor/mobile/app/template/AddImage.template',
    'jquery',
    'underscore',
    'backbone'
], function (addTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.AddImage = Backbone.View.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(addTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                var me = this;

                $('#add-image-url').single('click', _.bind(me.showImageUrl, me));

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
                        .find('#addimage-root-view')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId) {
                var rootView = DE.getController('AddContainer').rootView;

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

            showImageUrl: function () {
                this.showPage('#addimage-url-view');
            }
        }
    })());
});