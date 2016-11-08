/**
 *  EditHyperlink.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/7/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'text!documenteditor/mobile/app/template/EditHyperlink.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditHyperlink = Backbone.View.extend((function() {
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
                $('#edit-link-url input[type=url]').single('input', _.bind(function(e) {
                    $('#edit-link-edit').toggleClass('disabled', _.isEmpty($(e.currentTarget).val()));
                }, this));
            },

            categoryShow: function(e) {
                //
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
                        .find('#edit-link-root')
                        .html();
                }

                return '';
            }
        }
    })());
});