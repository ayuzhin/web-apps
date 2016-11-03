/**
 *  EditImage.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/3/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditImage.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditImage = Backbone.View.extend((function() {
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

                $('#image-wrap').single('click',                    _.bind(me.showWrap, me));
                $('#image-replace').single('click',                 _.bind(me.showReplace, me));
                $('#image-reorder').single('click',                 _.bind(me.showReorder, me));
                $('#edit-image-url').single('click',                _.bind(me.showEditUrl, me));

                me.initControls();
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
                        .find('#edit-image-root')
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

            showWrap: function () {
                this.showPage('#edit-image-wrap-view');
                $('.image-wrap .list-block.inputs-list').removeClass('inputs-list');
            },

            showReplace: function () {
                this.showPage('#edit-image-replace-view');
            },

            showReorder: function () {
                this.showPage('#edit-image-reorder-view');
            },

            showEditUrl: function () {
                this.showPage('#edit-image-url-view');

                $('.edit-image-url-link input[type="url"]').single('input', _.bind(function(e) {
                    $('.edit-image-url-link .buttons').toggleClass('disabled', _.isEmpty($(e.currentTarget).val()));
                }, this));

                _.delay(function () {
                    $('.edit-image-url-link input[type="url"]').focus();
                }, 1000);
            }
        }
    })());
});