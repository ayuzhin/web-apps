/**
 *  EditText.js
 *  Document Editor
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

    DE.Controllers.EditText = Backbone.Controller.extend((function() {
        var fontsArray = [],
            stack = [];

        function onApiFontChange(fontobj) {
            Common.NotificationCenter.trigger('fonts:change', fontobj)
        }

        function onApiLoadFonts(fonts, select) {
            _.each(fonts, function(font){
                var fontId = font.asc_getFontId();
                fontsArray.push({
                    id          : fontId,
                    name        : font.asc_getFontName(),
//                    displayValue: font.asc_getFontName(),
                    imgidx      : font.asc_getFontThumbnail(),
                    type        : font.asc_getFontType()
                });
            });

            Common.NotificationCenter.trigger('fonts:load', fontsArray, select);
        }

        return {
            models: [],
            collections: [],
            views: [
                'EditText'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                me.api.asc_registerCallback('asc_onInitEditorFonts',    _.bind(onApiLoadFonts, me));
                me.api.asc_registerCallback('asc_onFontFamily',         _.bind(onApiFontChange, me));
                me.api.asc_registerCallback('asc_onFocusObject',        _.bind(me.onApiFocusObject, me));
            },

            onLaunch: function () {
                this.createView('EditText').render();
            },

            initEvents: function () {
                var me = this;
                $('#font-bold').single('click',             _.bind(me.onBold, me));
                $('#font-italic').single('click',           _.bind(me.onItalic, me));
                $('#font-underline').single('click',        _.bind(me.onUnderline, me));
                $('#font-strikethrough').single('click',    _.bind(me.onStrikethrough, me));
            },

            // Public

            getFonts: function() {
                return fontsArray;
            },

            getStack: function() {
                return stack;
            },

            // Handlers

            onBold: function (e) {
                var pressed = this._toggleButton(e);

                if (this.api) {
                    this.api.put_TextPrBold(pressed);
                }
            },

            onItalic: function (e) {
                var pressed = this._toggleButton(e);

                if (this.api) {
                    this.api.put_TextPrItalic(pressed);
                }
            },

            onUnderline: function (e) {
                var pressed = this._toggleButton(e);

                if (this.api) {
                    this.api.put_TextPrUnderline(pressed);
                }
            },

            onStrikethrough: function (e) {
                var pressed = this._toggleButton(e);

                if (this.api) {
                    this.api.put_TextPrStrikeout(pressed);
                }
            },

            // API handlers

            onApiFocusObject: function (objects) {
                stack = objects;
            },

            // Helpers
            _toggleButton: function (e) {
                return $(e.currentTarget).toggleClass('active').hasClass('active');
            }
        }
    })());
});
