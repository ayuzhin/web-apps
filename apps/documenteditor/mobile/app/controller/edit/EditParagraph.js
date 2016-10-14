/**
 *  EditParagraph.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/14/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/edit/EditParagraph'
], function (core) {
    'use strict';

    DE.Controllers.EditParagraph = Backbone.Controller.extend((function() {
        // Private
        var _styles = [],
            _styleTumbSize;

        return {
            models: [],
            collections: [],
            views: [
                'EditParagraph'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditParagraph': {
                        'page:show'     : this.onPageShow,
                        'style:click'   : this.onStyleClick
                    }
                });
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                this.api.asc_registerCallback('asc_onInitEditorStyles',     _.bind(me.onApiInitEditorStyles, me));
            },

            onLaunch: function () {
                this.createView('EditParagraph').render();
            },

            initEvents: function () {
                var me = this;
                // $('#font-bold').single('click',                 _.bind(me.onBold, me));

            },

            onPageShow: function () {
                var me = this;
                // $('#page-text-additional li').single('click',   _.buffered(me.onAdditional, 100, me));
            },

            onStyleClick: function (view, e) {
                var $item = $(e.currentTarget).find('input');

                if ($item) {
                    this.api.put_Style($item.prop('value'));
                }
            },

            // Public
            getStyles: function () {
                return _styles || [];
            },

            getTumbSize: function () {
                return _styleTumbSize || {width: 0, height: 0};
            },

            // Handlers


            // API handlers

            onApiInitEditorStyles: function (styles) {
                window.styles_loaded = false;

                if (styles.length < 1) {
                    return;
                }

                _styles = [];

                _styleTumbSize = {
                    width   : styles.STYLE_THUMBNAIL_WIDTH,
                    height  : styles.STYLE_THUMBNAIL_HEIGHT
                };

                _.each(styles.get_MergedStyles(), function(style){
                    _styles.push({
                        image   : style.asc_getImage(),
                        name    : style.get_Name()
                    });
                });

                window.styles_loaded = true;
            }
        }
    })());
});
