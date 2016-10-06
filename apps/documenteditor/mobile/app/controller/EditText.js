/**
 *  EditText.js
 *  Edit Text settings controller
 *
 *  Created by Alexander Yuzhin on 10/4/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/EditText'
], function (core) {
    'use strict';

    DE.Controllers.EditText = Backbone.Controller.extend({
        models: [],
        collections: [],
        views: [
            'EditText'
        ],

        initialize: function() {
            Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
        },

        setApi: function(api) {
            this.api = api;
        },

        onLaunch: function() {
            this.createView('EditText').render();
        },

        initEvents: function() {
            var me = this;
            $('#font-bold').single('click',             _.bind(me.onBold, me));
            $('#font-italic').single('click',           _.bind(me.onItalic, me));
            $('#font-underline').single('click',        _.bind(me.onUnderline, me));
            $('#font-strikethrough').single('click',    _.bind(me.onStrikethrough, me));
        },

        onBold: function(e) {
            var pressed = this._toggleButton(e);

            if (this.api) {
                this.api.put_TextPrBold(pressed);
            }
        },

        onItalic: function(e) {
            var pressed = this._toggleButton(e);

            if (this.api) {
                this.api.put_TextPrItalic(pressed);
            }
        },

        onUnderline: function(e) {
            var pressed = this._toggleButton(e);

            if (this.api) {
                this.api.put_TextPrUnderline(pressed);
            }
        },

        onStrikethrough: function(e) {
            var pressed = this._toggleButton(e);

            if (this.api) {
                this.api.put_TextPrStrikeout(pressed);
            }
        },

        _toggleButton: function (e) {
            return $(e.currentTarget).toggleClass('active').hasClass('active');
        }
    });
});
