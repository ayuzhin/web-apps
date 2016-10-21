/**
 *  EditTable.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/20/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/edit/EditTable'
], function (core) {
    'use strict';

    DE.Controllers.EditTable = Backbone.Controller.extend((function() {
        // Private
        var _stack = [],
            _tableObject = {},
            _metricText = Common.Utils.Metric.getCurrentMetricName();

        var c_tableWrap = {
            TABLE_WRAP_NONE: 0,
            TABLE_WRAP_PARALLEL: 1
        };

        var c_tableAlign = {
            TABLE_ALIGN_LEFT: 0,
            TABLE_ALIGN_CENTER: 1,
            TABLE_ALIGN_RIGHT: 2
        };

        return {
            models: [],
            collections: [],
            views: [
                'EditTable'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditTable': {
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
                this.createView('EditTable').render();
            },

            initEvents: function () {
                var me = this;

                $('#table-remove-all').single('click',                  _.bind(function(){me.api.remTable(); me._closeIfNeed()}, me));
                $('#insert-column-left').single('click',                _.bind(function(){me.api.addColumnLeft(); me._closeIfNeed()}, me));
                $('#insert-column-right').single('click',               _.bind(function(){me.api.addColumnRight(); me._closeIfNeed()}, me));
                $('#insert-row-above').single('click',                  _.bind(function(){me.api.addRowAbove(); me._closeIfNeed()}, me));
                $('#insert-row-below').single('click',                  _.bind(function(){me.api.addRowBelow(); me._closeIfNeed()}, me));
                $('#remove-column').single('click',                     _.bind(function(){me.api.remColumn(); me._closeIfNeed()}, me));
                $('#remove-row').single('click',                        _.bind(function(){me.api.remRow(); me._closeIfNeed()}, me));

                me.initSettings();
            },

            onPageShow: function () {
                var me = this;

                $('#table-wrap-type input').single('click',             _.bind(me.onWrapType, me));
                $('#table-move-text input').single('click',             _.bind(me.onWrapMoveText, me));
                $('#table-distance input').single('change',             _.bind(me.onWrapDistance, me));
                $('#table-distance input').single('input',              _.bind(me.onWrapDistanceChanging, me));
                $('#table-align-left').single('click',                  _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_LEFT));
                $('#table-align-center').single('click',                _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_CENTER));
                $('#table-align-right').single('click',                 _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_RIGHT));

                $('#table-option-repeatasheader input').single('click', _.bind(me.onOptionRepeat, me));
                $('#table-option-resizetofit input').single('click',    _.bind(me.onOptionResize, me));
                $('#table-options-margins input').single('change',      _.bind(me.onOptionMargin, me));
                $('#table-options-margins input').single('input',       _.bind(me.onOptionMarginChanging, me));

                me.initSettings();
            },

            initSettings: function () {
                var me = this;

                me.api && me.api.UpdateInterfaceState();

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Table) {
                        _tableObject = object.get_ObjectValue();
                        var type = _tableObject.get_TableWrap() == c_tableWrap.TABLE_WRAP_NONE ? 'inline' : 'flow';

                        /**
                         * Wrapping
                         */

                        // wrap type
                        $('#table-wrap-type input').val([type]);
                        me._uiTransformByWrap(type);

                        // wrap move text
                        $('#table-move-text input').prop('checked', (_tableObject.get_PositionV() && _tableObject.get_PositionV().get_RelativeFrom()==Asc.c_oAscVAnchor.Text));

                        // wrap align
                        var align = _tableObject.get_TableAlignment();
                        $('#table-align-left').toggleClass('active', align == c_tableAlign.TABLE_ALIGN_LEFT);
                        $('#table-align-center').toggleClass('active', align == c_tableAlign.TABLE_ALIGN_CENTER);
                        $('#table-align-right').toggleClass('active', align == c_tableAlign.TABLE_ALIGN_RIGHT);

                        // wrap distance
                        var paddings = _tableObject.get_TablePaddings();
                        if (paddings) {
                            var distance = Common.Utils.Metric.fnRecalcFromMM(paddings.get_Top());
                            $('#table-distance input').val(distance);
                            $('#table-distance .item-after').text(distance + ' ' + _metricText);
                        }

                        /**
                         * Options
                         */

                        $('#table-option-repeatasheader input').prop('checked', _tableObject.get_RowsInHeader());
                        $('#table-option-resizetofit input').prop('checked', _tableObject.get_TableLayout()==Asc.c_oAscTableLayout.AutoFit);

                        var margins = _tableObject.get_DefaultMargins();
                        if (margins) {
                            var distance = Common.Utils.Metric.fnRecalcFromMM(margins.get_Left());
                            $('#table-options-margins input').val(distance);
                            $('#table-options-margins .item-after').text(distance + ' ' + _metricText);
                        }
                    }
                });
            },

            // Public

            getTable: function() {
                return _tableObject;
            },

            // Handlers

            onWrapType: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val();

                me._uiTransformByWrap(value);

                var properties = new Asc.CTableProp();

                if ('inline' == value) {
                    properties.put_TableWrap(c_tableWrap.TABLE_WRAP_NONE);
                } else {
                    properties.put_TableWrap(c_tableWrap.TABLE_WRAP_PARALLEL);
                }

                me.api.tblApply(properties);
            },

            onWrapMoveText :function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    isOn = $target.is(':checked'),
                    properties = new Asc.CTableProp(),
                    position = new Asc.CTablePositionV();

                position.put_UseAlign(false);
                position.put_RelativeFrom(isOn ? Asc.c_oAscVAnchor.Text : Asc.c_oAscVAnchor.Page);
                position.put_Value(_tableObject.get_Value_Y(isOn ? Asc.c_oAscVAnchor.Text : Asc.c_oAscVAnchor.Page));

                properties.put_PositionV(position);

                me.api.tblApply(properties);
            },

            onWrapDistance: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val(),
                    properties = new Asc.CTableProp(),
                    paddings = new Asc.asc_CPaddings();

                $('#table-distance .item-after').text(value + ' ' + _metricText);

                value = Common.Utils.Metric.fnRecalcToMM(value);

                paddings.put_Top(value);
                paddings.put_Right(value);
                paddings.put_Bottom(value);
                paddings.put_Left(value);

                properties.put_TablePaddings(paddings);

                me.api.tblApply(properties);
            },

            onWrapDistanceChanging: function (e) {
                var $target = $(e.currentTarget);
                $('#table-distance .item-after').text($target.val() + ' ' + _metricText);
            },

            onWrapAlign: function (type, e) {
                var me = this,
                    $target = $(e.currentTarget),
                    properties = new Asc.CTableProp();

                $('#table-align .button').removeClass('active');
                $target.addClass('active');

                properties.put_TableAlignment(type);
                me.api.tblApply(properties);
            },

            onOptionRepeat: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    properties = new Asc.CTableProp();

                properties.put_RowsInHeader($target.is(':checked') ? 1 : 0 );
                me.api.tblApply(properties);
            },

            onOptionResize: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    properties = new Asc.CTableProp();

                properties.put_TableLayout($target.is(':checked') ? Asc.c_oAscTableLayout.AutoFit : Asc.c_oAscTableLayout. Fixed);
                me.api.tblApply(properties);
            },

            onOptionMargin: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val(),
                    properties = new Asc.CTableProp(),
                    margins = new Asc.asc_CPaddings();

                $('#table-options-margins .item-after').text(value + ' ' + _metricText);

                value = Common.Utils.Metric.fnRecalcToMM(value);

                margins.put_Top(value);
                margins.put_Right(value);
                margins.put_Bottom(value);
                margins.put_Left(value);

                properties.put_DefaultMargins(margins);

                me.api.tblApply(properties);
            },

            onOptionMarginChanging: function (e) {
                var $target = $(e.currentTarget);
                $('#table-options-margins .item-after').text($target.val() + ' ' + _metricText);
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;
            },

            // Helpers

            _closeIfNeed: function () {
                if (!this._isTableInStack()) {
                    DE.getController('EditContainer').hideModal();
                }
            },

            _isTableInStack: function () {
                var tableExist = false;

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Table) {
                        tableExist = true;
                    }
                });

                return tableExist;
            },

            _uiTransformByWrap: function (type) {
                if ('inline' == type) {
                    $('#edit-tablewrap-page .inline').show();
                    $('#edit-tablewrap-page .flow').hide();
                    $('#table-move-text').addClass('disabled');
                } else {
                    $('#edit-tablewrap-page .inline').hide();
                    $('#edit-tablewrap-page .flow').show();
                    $('#table-move-text').removeClass('disabled');
                }
            }
        }
    })());
});