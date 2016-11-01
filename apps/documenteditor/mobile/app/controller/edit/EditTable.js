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
            _metricText = Common.Utils.Metric.getCurrentMetricName(),
            _tableObject = {},
            _tableLook = {},
            _cellBorders = new Asc.CBorders(),
            _cellBorderColor = '000000',
            _cellBorderWidth = 0.5;

        var c_tableWrap = {
            TABLE_WRAP_NONE: 0,
            TABLE_WRAP_PARALLEL: 1
        };

        var c_tableAlign = {
            TABLE_ALIGN_LEFT: 0,
            TABLE_ALIGN_CENTER: 1,
            TABLE_ALIGN_RIGHT: 2
        };

        var borderSizeTransform = (function() {
            var _sizes = [0, 0.5, 1, 1.5, 2.25, 3, 4.5, 6];

            return {
                sizeByIndex: function (index) {
                    if (index < 1) return _sizes[0];
                    if (index > _sizes.length - 1) return _sizes[_sizes.length - 1];
                    return _sizes[index];
                },

                sizeByValue: function (value) {
                    var index = 0;
                    _.each(_sizes, function (size, idx) {
                        if (Math.abs(size - value) < 0.25) {
                            index = idx;
                        }
                    });
                    return _sizes[index];
                }
            }
        })();

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

            onPageShow: function (view, pageId) {
                var me = this,
                    paletteFillColor = me.getView('EditTable').paletteFillColor,
                    paletteBorderColor = me.getView('EditTable').paletteBorderColor;

                $('#table-wrap-type li').single('click',                _.buffered(me.onWrapType, 100, me));
                $('#table-move-text input').single('click',             _.bind(me.onWrapMoveText, me));
                $('#table-distance input').single('change touchend',    _.buffered(me.onWrapDistance, 100, me));
                $('#table-distance input').single('input',              _.bind(me.onWrapDistanceChanging, me));
                $('#table-align-left').single('click',                  _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_LEFT));
                $('#table-align-center').single('click',                _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_CENTER));
                $('#table-align-right').single('click',                 _.bind(me.onWrapAlign, me, c_tableAlign.TABLE_ALIGN_RIGHT));

                $('#table-option-repeatasheader input').single('click', _.bind(me.onOptionRepeat, me));
                $('#table-option-resizetofit input').single('click',    _.bind(me.onOptionResize, me));
                $('#table-options-margins input').single('change touchend',      _.buffered(me.onOptionMargin, 100, me));
                $('#table-options-margins input').single('input',       _.bind(me.onOptionMarginChanging, me));

                $('#table-options-header-row input').single('click',    _.bind(me.onCheckTemplateChange, me, 0));
                $('#table-options-total-row input').single('click',     _.bind(me.onCheckTemplateChange, me, 1));
                $('#table-options-banded-row input').single('click',    _.bind(me.onCheckTemplateChange, me, 2));
                $('#table-options-first-column input').single('click',  _.bind(me.onCheckTemplateChange, me, 3));
                $('#table-options-last-column input').single('click',   _.bind(me.onCheckTemplateChange, me, 4));
                $('#table-options-banded-column input').single('click', _.bind(me.onCheckTemplateChange, me, 5));

                $('#edit-table-bordertypes a').single('click',          _.bind(me.onBorderTypeClick, me));

                // ['l', 'btn-borders-small btn-position-left', 'table-button-border-left',            this.tipLeft],
                // ['c','btn-borders-small btn-position-inner-vert', 'table-button-border-inner-vert', this.tipInnerVert],
                // ['r','btn-border-small btn-position-right', 'table-button-border-right',           this.tipRight],
                // ['t','btn-borders-small btn-position-top', 'table-button-border-top',               this.tipTop],
                // ['m','btn-borders-small btn-position-inner-hor', 'table-button-border-inner-hor',   this.tipInnerHor],
                // ['b', 'btn-borders-small btn-position-bottom', 'table-button-border-bottom',        this.tipBottom],
                // ['cm', 'btn-borders-small btn-position-inner', 'table-button-border-inner',         this.tipInner],
                // ['lrtb', 'btn-borders-small btn-position-outer', 'table-button-border-outer',       this.tipOuter],
                // ['lrtbcm', 'btn-borders-small btn-position-all', 'table-button-border-all',         this.tipAll],
                // ['', 'btn-borders-small btn-position-none', 'table-button-border-none',             this.tipNone]

                paletteFillColor && paletteFillColor.on('select',       _.bind(me.onFillColor, me));
                paletteBorderColor && paletteBorderColor.on('select',   _.bind(me.onBorderColor, me));

                $('.dataview.table-styles .row div').single('click',    _.bind(me.onStyleClick, me));
                $('#edit-table-bordersize input').single('change touchend',  _.buffered(me.onBorderSize, 100, me));
                $('#edit-table-bordersize input').single('input',            _.bind(me.onBorderSizeChanging, me));

                me.initSettings(pageId);
            },

            initSettings: function (pageId) {
                var me = this;

                me.api && me.api.UpdateInterfaceState();

                var tables = [];

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Table) {
                        tables.push(object);
                    }
                });

                if (tables.length > 0) {
                    var object = tables[tables.length - 1]; // get top table

                    _tableObject = object.get_ObjectValue();
                    _tableLook = _tableObject.get_TableLook();

                    if (pageId == '#edit-table-wrap') {
                        me._initWrappView();
                    } else if (pageId == "#edit-table-style" || pageId == '#edit-table-border-color-view') {
                        me._initStyleView();
                    } else if (pageId == '#edit-table-options') {
                        me._initTableOptionsView();
                    } else if (pageId == '#edit-table-style-options-view') {
                        me._initStyleOptionsView();
                    }
                }
            },

            _initStyleOptionsView: function() {
                $('#table-options-header-row input').prop('checked',    _tableLook.get_FirstRow());
                $('#table-options-total-row input').prop('checked',     _tableLook.get_LastRow());
                $('#table-options-banded-row input').prop('checked',    _tableLook.get_BandHor());
                $('#table-options-first-column input').prop('checked',  _tableLook.get_FirstCol());
                $('#table-options-last-column input').prop('checked',   _tableLook.get_LastCol());
                $('#table-options-banded-column input').prop('checked', _tableLook.get_BandVer());
            },

            _initTableOptionsView: function() {
                $('#table-option-repeatasheader input').prop('checked', _tableObject.get_RowsInHeader());
                $('#table-option-resizetofit input').prop('checked', _tableObject.get_TableLayout()==Asc.c_oAscTableLayout.AutoFit);

                var margins = _tableObject.get_DefaultMargins();
                if (margins) {
                    var distance = Common.Utils.Metric.fnRecalcFromMM(margins.get_Left());
                    $('#table-options-margins input').val(distance);
                    $('#table-options-margins .item-after').text(distance + ' ' + _metricText);
                }
            },

            _initWrappView: function() {
                var me = this,
                    type = _tableObject.get_TableWrap() == c_tableWrap.TABLE_WRAP_NONE ? 'inline' : 'flow';

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
            },

            _initStyleView: function() {
                var me = this;

                /**
                 * Style
                 */

                var styleId = _tableObject.get_TableStyle();
                $('#edit-table-styles .table-styles div').removeClass('active');
                $('#edit-table-styles .table-styles div[data-type=' + styleId + ']').addClass('active');

                /**
                 * Fill
                 */

                var background = _tableObject.get_CellsBackground(),
                    fillColor = 'transparent';

                if (background) {
                    if (background.get_Value()==0) {
                        var color = background.get_Color();
                        if (color) {
                            if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                fillColor = {color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()), effectValue: color.get_value()};
                            } else {
                                fillColor = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                            }
                        }
                    }
                }

                var palette = me.getView('EditTable').paletteFillColor;

                if (palette) {
                    palette.select(fillColor);
                }

                /**
                 * Border
                 */

                // if (_.isUndefined(_cellBorderColor) || _.isUndefined(_cellBorderWidth)) {
                //     _cellBorders = _tableObject.get_CellBorders();
                //
                //     _.some([
                //         _cellBorders.get_Left(),
                //         _cellBorders.get_Top(),
                //         _cellBorders.get_Right(),
                //         _cellBorders.get_Bottom(),
                //         _cellBorders.get_InsideV(),
                //         _cellBorders.get_InsideH()
                //     ], function (border) {
                //         if (border.get_Value() > 0) {
                //             var borderColor = border.get_Color();
                //
                //             if (borderColor.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                //                 borderColor = {
                //                     color: Common.Utils.ThemeColor.getHexColor(borderColor.get_r(), borderColor.get_g(), borderColor.get_b()),
                //                     effectValue: borderColor.get_value()
                //                 };
                //             } else {
                //                 borderColor = Common.Utils.ThemeColor.getHexColor(borderColor.get_r(), borderColor.get_g(), borderColor.get_b());
                //             }
                //
                //             _cellBorderWidth = border.get_Size();
                //             _cellBorderColor = borderColor;
                //
                //             return true;
                //         }
                //     });
                // }

                $('#edit-table-bordersize input').val([borderSizeTransform.sizeByIndex(_cellBorderWidth)]);
                $('#edit-table-bordersize .item-after').text(borderSizeTransform.sizeByValue(_cellBorderWidth) + ' ' + _metricText);

                var borderPalette = me.getView('EditTable').paletteBorderColor;

                if (borderPalette) {
                    borderPalette.select(_cellBorderColor);
                }

                $('#edit-table-bordercolor .color-preview').css('background-color', ('transparent' == _cellBorderColor) ? _cellBorderColor : ('#' + (_.isObject(_cellBorderColor) ? _cellBorderColor.color : _cellBorderColor)));
            },

            _updateBordersStyle: function(border) {
                _cellBorders = new Asc.CBorders();
                var updateBorders = _cellBorders;

                var visible = (border != '');

                if (border.indexOf('l') > -1 || !visible) {
                    if (updateBorders.get_Left()===null || updateBorders.get_Left()===undefined)
                        updateBorders.put_Left(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_Left(), visible);
                }
                if (border.indexOf('t') > -1 || !visible) {
                    if (updateBorders.get_Top()===null || updateBorders.get_Top()===undefined)
                        updateBorders.put_Top(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_Top(), visible);
                }
                if (border.indexOf('r') > -1 || !visible) {
                    if (updateBorders.get_Right()===null || updateBorders.get_Right()===undefined)
                        updateBorders.put_Right(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_Right(), visible);
                }
                if (border.indexOf('b') > -1 || !visible) {
                    if (updateBorders.get_Bottom()===null || updateBorders.get_Bottom()===undefined)
                        updateBorders.put_Bottom(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_Bottom(), visible);
                }
                if (border.indexOf('c') > -1 || !visible) {
                    if (updateBorders.get_InsideV()===null || updateBorders.get_InsideV()===undefined)
                        updateBorders.put_InsideV(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_InsideV(), visible);
                }
                if (border.indexOf('m') > -1 || !visible) {
                    if (updateBorders.get_InsideH()===null || updateBorders.get_InsideH()===undefined)
                        updateBorders.put_InsideH(new Asc.asc_CTextBorder());
                    this._updateBorderStyle (updateBorders.get_InsideH(), visible);
                }
            },

            _updateBorderStyle: function(border, visible) {
                if (_.isNull(border)) {
                    border = new Asc.asc_CTextBorder();
                }

                if (visible && _cellBorderWidth > 0){
                    var size = parseFloat(_cellBorderWidth);
                    border.put_Value(1);
                    border.put_Size(size * 25.4 / 72.0);
                    var color = Common.Utils.ThemeColor.getRgbColor(_cellBorderColor);
                    border.put_Color(color);
                }
                else {
                    border.put_Value(0);
                }
            },

            // Public

            getTable: function() {
                return _tableObject;
            },

            // Handlers

            onWrapType: function (e) {
                var me = this,
                    $target = $(e.currentTarget).find('input'),
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

                value = Common.Utils.Metric.fnRecalcToMM(parseInt(value));

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

                properties.put_RowsInHeader($target.is(':checked') ? 1 : 0);
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

            onCheckTemplateChange: function(type, e) {
                if (this.api)   {
                    var properties = new Asc.CTableProp();

                    switch (type) {
                        case 0:
                            _tableLook.put_FirstRow($('#table-options-header-row input').is(':checked'));
                            break;
                        case 1:
                            _tableLook.put_LastRow($('#table-options-total-row input').is(':checked'));
                            break;
                        case 2:
                            _tableLook.put_BandHor($('#table-options-banded-row input').is(':checked'));
                            break;
                        case 3:
                            _tableLook.put_FirstCol($('#table-options-first-column input').is(':checked'));
                            break;
                        case 4:
                            _tableLook.put_LastCol($('#table-options-last-column input').is(':checked'));
                            break;
                        case 5:
                            _tableLook.put_BandVer($('#table-options-banded-column input').is(':checked'));
                            break;
                    }

                    properties.put_TableLook(_tableLook);
                    this.api.tblApply(properties);
                }
            },

            onBorderTypeClick: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    type = $target.data('type');

                this._updateBordersStyle(type);

                if (me.api) {
                    var properties = new Asc.CTableProp();
                    properties.put_CellBorders(_cellBorders);
                    properties.put_CellSelect(true);

                    me.api.tblApply(properties);
                }
            },

            onFillColor: function(palette, color) {
                if (this.api) {
                    var properties = new Asc.CTableProp(),
                        background = new Asc.CBackground();

                    properties.put_CellsBackground(background);

                    if ('transparent' == color) {
                        background.put_Value(1);
                    } else {
                        background.put_Value(0);
                        background.put_Color(Common.Utils.ThemeColor.getRgbColor(color));
                    }

                    properties.put_CellSelect(true);

                    this.api.tblApply(properties);
                }
            },

            onBorderColor: function (palette, color) {
                _cellBorderColor = color;
                $('#edit-table-bordercolor .color-preview').css('background-color', ('transparent' == color) ? color : ('#' + (_.isObject(color) ? color.color : color)));
            },

            onStyleClick: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    type = $target.data('type'),
                    properties = new Asc.CTableProp();

                $('#edit-table-styles .table-styles div').removeClass('active');
                $target.addClass('active');

                properties.put_TableStyle(type);
                me.api.tblApply(properties);
            },

            onBorderSize: function (e) {
                var $target = $(e.currentTarget),
                    value = $target.val();

                _cellBorderWidth = borderSizeTransform.sizeByIndex(parseInt(value));
            },

            onBorderSizeChanging: function (e) {
                var $target = $(e.currentTarget);
                $('#edit-table-bordersize .item-after').text(borderSizeTransform.sizeByIndex($target.val()) + ' ' + _metricText);
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