/**
 *  Settings.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/7/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/Settings.template',
    'jquery',
    'underscore',
    'backbone'
], function (settingsTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.Settings = Backbone.View.extend((function() {
        // private
        var isEdit;

        return {
            // el: '.view-main',

            template: _.template(settingsTemplate),

            events: {
                //
            },

            initialize: function() {
                Common.NotificationCenter.on('settingscontainer:show', _.bind(this.initEvents, this));
            },

            initEvents: function () {
                $('#settings-document-info').single('click', _.bind(this.showDocumentInfo, this));

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

            setMode: function (mode) {
                isEdit = (mode === 'edit')
            },

            rootLayout: function () {
                if (this.layout) {
                    var $layour = this.layout
                        .find('#settings-root-view');

                    // Hide edit document item
                    if (isEdit) {
                        $layour.find('#settings-edit-document').hide();
                    }

                    return $layour.html();
                }

                return '';
            },

            initControls: function() {
                //
            },

            showPage: function(templateId) {
                var rootView = DE.getController('Settings').rootView();

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

            showDocumentInfo: function() {
                this.showPage('#settings-info-view');

                var api = DE.getController('Settings').api;
                if (api) {
                    api.startGetDocInfo();

                    var document = Common.SharedSettings.get('document') || {},
                        info = document.info || {};

                    $('#settings-document-title').html(document.title ? document.title : this.unknownText);
                    $('#settings-document-autor').html(info.author ? info.author : this.unknownText);
                    $('#settings-document-date').html(info.created ? info.created : this.unknownText);
                }
            },

            unknownText: 'Unknown'
        }
    })());
});
