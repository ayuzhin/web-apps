/**
 *  AddImage.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/18/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/add/AddImage'
], function (core) {
    'use strict';

    DE.Controllers.AddImage = Backbone.Controller.extend((function() {
        //

        return {
            models: [],
            collections: [],
            views: [
                'AddImage'
            ],

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'AddImage': {
                        'page:show' : this.onPageShow
                    }
                });
            },

            setApi: function (api) {
                this.api = api;
            },

            onLaunch: function () {
                this.createView('AddImage').render();
            },

            initEvents: function () {
                var me = this;
                $('#add-image-file').single('click', _.bind(me.onInsertByFile, me));
            },

            onPageShow: function () {
                var me = this;

                $('#addimage-insert a').single('click', _.buffered(me.onInsertByUrl, 100, me));

                $('#addimage-url input[type="url"]').single('input', _.bind(me.onUrlChange, me));

                _.delay(function () {
                    $('#addimage-link-url input[type="url"]').focus();
                }, 1000);
            },

            // Handlers

            onInsertByFile: function (e) {
                DE.getController('AddContainer').hideModal();

                if (this.api) {
                    this.api.asc_addImage();
                }
            },

            onUrlChange: function (e) {
                $('#addimage-insert')[_.isEmpty($(e.currentTarget).val()) ? 'addClass' : 'removeClass']('disabled');
            },

            onInsertByUrl: function (e) {
                var me = this,
                    $input = $('#addimage-link-url input[type="url"]');

                if ($input) {
                    var value = ($input.val()).replace(/ /g, '');

                    DE.getController('AddContainer').hideModal();

                    _.delay(function () {
                        if (!_.isEmpty(value)) {
                            if ((/((^https?)|(^ftp)):\/\/.+/i.test(value))) {
                                me.api.AddImageUrl(value);
                            } else {
                                uiApp.alert(me.txtNotUrl);
                            }
                        } else {
                            uiApp.alert(me.textEmptyImgUrl);
                        }
                    }, 300);
                }
            },

            textEmptyImgUrl : 'You need to specify image URL.',
            txtNotUrl       : 'This field should be a URL in the format \"http://www.example.com\"'
        }
    })());
});
