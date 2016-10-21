/**
 *  EditShape.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/21/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/edit/EditShape'
], function (core) {
    'use strict';

    DE.Controllers.EditShape = Backbone.Controller.extend((function() {
        // Private
        var _stack = [],
            _shapeObject = {},
            _metricText = Common.Utils.Metric.getCurrentMetricName();


        return {
            models: [],
            collections: [],
            views: [
                'EditShape'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditShape': {
                        'page:show'     : this.onPageShow
                    }
                });
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                me.api.asc_registerCallback('asc_onFocusObject',        _.bind(me.onApiFocusObject, me));
            },

            onLaunch: function () {
                this.createView('EditShape').render();
            },

            initEvents: function () {
                var me = this;

                // $('#table-remove-all').single('click',                  _.bind(function(){me.api.remTable(); me._closeIfNeed()}, me));
                // $('#insert-column-left').single('click',                _.bind(function(){me.api.addColumnLeft(); me._closeIfNeed()}, me));
                // $('#insert-column-right').single('click',               _.bind(function(){me.api.addColumnRight(); me._closeIfNeed()}, me));
                // $('#insert-row-above').single('click',                  _.bind(function(){me.api.addRowAbove(); me._closeIfNeed()}, me));
                // $('#insert-row-below').single('click',                  _.bind(function(){me.api.addRowBelow(); me._closeIfNeed()}, me));
                // $('#remove-column').single('click',                     _.bind(function(){me.api.remColumn(); me._closeIfNeed()}, me));
                // $('#remove-row').single('click',                        _.bind(function(){me.api.remRow(); me._closeIfNeed()}, me));

                me.initSettings();
            },

            onPageShow: function () {
                var me = this;

                // $('#table-wrap-type input').single('click',             _.bind(me.onWrapType, me));
                // $('#table-move-text input').single('click',             _.bind(me.onWrapMoveText, me));
                // $('#table-distance input').single('change',             _.bind(me.onWrapDistance, me));
                // $('#table-distance input').single('input',              _.bind(me.onWrapDistanceChanging, me));
                // $('#table-align-left').single('click',                  _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_LEFT));
                // $('#table-align-center').single('click',                _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_CENTER));
                // $('#table-align-right').single('click',                 _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_RIGHT));
                //
                // $('#table-option-repeatasheader input').single('click', _.bind(me.onOptionRepeat, me));
                // $('#table-option-resizetofit input').single('click',    _.bind(me.onOptionResize, me));
                // $('#table-options-margins input').single('change',      _.bind(me.onOptionMargin, me));
                // $('#table-options-margins input').single('input',       _.bind(me.onOptionMarginChanging, me));

                me.initSettings();
            },

            initSettings: function () {
                var me = this;

                me.api && me.api.UpdateInterfaceState();

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Shape) {
                        _shapeObject = object.get_ObjectValue();


                    }
                });
            },

            // Public

            getShape: function () {
                return _shapeObject;
            },

            // Handlers



            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;
            },

            // Helpers

            _closeIfNeed: function () {
                if (!this._isShapeInStack()) {
                    DE.getController('EditContainer').hideModal();
                }
            },

            _isShapeInStack: function () {
                var shapeExist = false;

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Shape) {
                        shapeExist = true;
                    }
                });

                return shapeExist;
            }
        }
    })());
});