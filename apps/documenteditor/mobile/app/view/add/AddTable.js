/**
 *  AddTable.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/17/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/AddTable.template',
    'jquery',
    'underscore',
    'backbone'
], function (addTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.AddTable = Backbone.View.extend((function() {
        // private

        return {
            // el: '.view-main',

            template: _.template(addTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('tablestyles:load',  _.bind(this.render, this));
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
                    styles  : Common.SharedSettings.get('tablestyles')
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#add-table-root')
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