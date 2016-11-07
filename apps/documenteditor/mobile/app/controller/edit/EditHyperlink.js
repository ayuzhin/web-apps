/**
 *  EditLink.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/7/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/edit/EditHyperlink'
], function (core) {
    'use strict';

    DE.Controllers.EditHyperlink = Backbone.Controller.extend((function() {
        // Private
        var _stack = [],
            _linkObject = undefined;

        return {
            models: [],
            collections: [],
            views: [
                'EditHyperlink'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                me.api.asc_registerCallback('asc_onFocusObject', _.bind(me.onApiFocusObject, me));
            },

            onLaunch: function () {
                this.createView('EditHyperlink').render();
            },

            initEvents: function () {
                var me = this;

                $('#edit-link-edit').single('click',    _.bind(me.onEditLink, me));
                $('#edit-link-remove').single('click',  _.bind(me.onRemoveLink, me));

                me.initSettings();
            },

            initSettings: function () {
                if (_linkObject) {
                    if (_linkObject.get_Value()) {
                        $('#edit-link-url input').val([_linkObject.get_Value().replace(new RegExp(" ", 'g'), "%20")]);
                    } else {
                        $('#edit-link-url input').val('');
                    }

                    if (!_.isNull(_linkObject.get_Text())) {
                        $('#edit-link-display input').val([_linkObject.get_Text()]);
                    }

                    $('#edit-link-tip input').val([_linkObject.get_ToolTip()]);

                    $('#edit-link-edit').toggleClass('disabled', _.isEmpty($('#edit-link-url input').val()));
                }
            },


            // Handlers

            onEditLink: function () {
                var me      = this,
                    url     = $('#edit-link-url input').val(),
                    display = $('#edit-link-display input').val(),
                    tip     = $('#edit-link-tip input').val(),
                    urltype = me.api.asc_getUrlType($.trim(url)),
                    isEmail = (urltype == 2);

                if (urltype < 1) {
                    uiApp.alert(me.txtNotUrl);
                    return;
                }

                url = url.replace(/^\s+|\s+$/g,'');

                if (! /(((^https?)|(^ftp)):\/\/)|(^mailto:)/i.test(url) )
                    url = (isEmail ? 'mailto:' : 'http://' ) + url;

                url = url.replace(new RegExp("%20",'g')," ");

                var props = new Asc.asc_CHyperlink();
                // props.asc_setType(1);
                props.asc_setHyperlinkUrl(url);
                props.asc_setText(_.isEmpty(display) ? url : display);
                props.asc_setTooltip(tip);

                me.api.change_Hyperlink(props);

                DE.getController('EditContainer').hideModal();
            },

            onRemoveLink: function () {
                this.api && this.api.remove_Hyperlink();
                DE.getController('EditContainer').hideModal();
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;

                var links = [];

                _.each(_stack, function (object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Hyperlink) {
                        links.push(object);
                    }
                });

                if (links.length > 0) {
                    var object = links[links.length - 1]; // get top
                    _linkObject = object.get_ObjectValue();
                } else {
                    _linkObject = undefined;
                }
            },

            // Helpers

            _closeIfNeed: function () {
                if (!this._isImageInStack()) {
                    DE.getController('EditContainer').hideModal();
                }
            },

            textEmptyImgUrl : 'You need to specify image URL.',
            txtNotUrl       : 'This field should be a URL in the format \"http://www.example.com\"'
        };
    })());
});