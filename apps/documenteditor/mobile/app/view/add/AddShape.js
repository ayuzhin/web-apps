/**
 *  AddShape.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/18/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'text!documenteditor/mobile/app/template/AddShape.template',
    'jquery',
    'underscore',
    'backbone'
], function (addTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.AddShape = Backbone.View.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(addTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show',   _.bind(this.initEvents, this));
                Common.NotificationCenter.on('shapes:load',         _.bind(this.render, this));
            },

            initEvents: function () {
                var me = this;

                me.initControls();
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
                        .find('#add-shapes-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            }
        }
    })());
});