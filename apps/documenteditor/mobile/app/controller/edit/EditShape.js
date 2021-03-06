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
            _shapeObject = undefined,
            _metricText = Common.Utils.Metric.getCurrentMetricName();

        var wrapTypesTransform = (function() {
            var map = [
                { ui:'inline', sdk: Asc.c_oAscWrapStyle2.Inline },
                { ui:'square', sdk: Asc.c_oAscWrapStyle2.Square },
                { ui:'tight', sdk: Asc.c_oAscWrapStyle2.Tight },
                { ui:'through', sdk: Asc.c_oAscWrapStyle2.Through },
                { ui:'top-bottom', sdk: Asc.c_oAscWrapStyle2.TopAndBottom },
                { ui:'behind', sdk: Asc.c_oAscWrapStyle2.Behind },
                { ui:'infront', sdk: Asc.c_oAscWrapStyle2.InFront }
            ];

            return {
                sdkToUi: function(type) {
                    var record = map.filter(function(obj) {
                        return obj.sdk === type;
                    })[0];
                    return record ? record.ui : '';
                },

                uiToSdk: function(type) {
                    var record = map.filter(function(obj) {
                        return obj.ui === type;
                    })[0];
                    return record ? record.sdk : 0;
                },
            }
        })();

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
                'EditShape'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditShape': {
                        'page:show': this.onPageShow
                    }
                });
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                me.api.asc_registerCallback('asc_onFocusObject', _.bind(me.onApiFocusObject, me));
            },

            onLaunch: function () {
                this.createView('EditShape').render();
            },

            initEvents: function () {
                var me = this;

                $('#shape-remove').single('click', _.bind(me.onRemoveShape, me));

                me.initSettings();
            },

            onPageShow: function (view, pageId) {
                var me = this;

                $('.shape-reorder a').single('click',                       _.bind(me.onReorder, me));
                $('.shape-replace li').single('click',                      _.buffered(me.onReplace, 100, me));
                $('.shape-wrap .shape-wrap-types li').single('click',       _.buffered(me.onWrapType, 100, me));
                $('.shape-wrap .align a').single('click',                   _.bind(me.onAlign, me));
                $('#edit-shape-movetext input').single('click',             _.bind(me.onMoveText, me));
                $('#edit-shape-overlap input').single('click',              _.bind(me.onOverlap, me));
                $('.shape-wrap .distance input').single('change touchend',  _.buffered(me.onWrapDistance, 100, me));
                $('.shape-wrap .distance input').single('input',            _.bind(me.onWrapDistanceChanging, me));

                $('#edit-shape-bordersize input').single('change touchend', _.buffered(me.onBorderSize, 100, me));
                $('#edit-shape-bordersize input').single('input',        _.bind(me.onBorderSizeChanging, me));
                $('#edit-shape-effect input').single('change touchend',     _.buffered(me.onOpacity, 100, me));
                $('#edit-shape-effect input').single('input',               _.bind(me.onOpacityChanging, me));

                me.initSettings(pageId);
            },

            initSettings: function (pageId) {
                var me = this;

                // me.api && me.api.UpdateInterfaceState();

                if (_shapeObject) {
                    if (pageId == '#edit-shape-wrap') {
                        me._initWrapView();
                    } else if (pageId == '#edit-shape-style' || pageId == '#edit-shape-border-color-view') {
                        me._initStyleView();
                    }
                }
            },

            _initWrapView: function() {
                // Wrap type
                var me = this,
                    wrapping = _shapeObject.get_WrappingStyle(),
                    $shapeWrapInput = $('.shape-wrap input'),
                    shapeWrapType = wrapTypesTransform.sdkToUi(wrapping);

                $shapeWrapInput.val([shapeWrapType]);
                me._uiTransformByWrap(shapeWrapType);

                // Wrap align
                var shapeHAlign = _shapeObject.get_PositionH().get_Align();

                $('.shape-wrap .align a[data-type=left]').toggleClass('active', shapeHAlign == Asc.c_oAscAlignH.Left);
                $('.shape-wrap .align a[data-type=center]').toggleClass('active', shapeHAlign == Asc.c_oAscAlignH.Center);
                $('.shape-wrap .align a[data-type=right]').toggleClass('active', shapeHAlign == Asc.c_oAscAlignH.Right);


                // Wrap flags
                $('#edit-shape-movetext input').prop('checked', _shapeObject.get_PositionV().get_RelativeFrom() == Asc.c_oAscRelativeFromV.Paragraph);
                $('#edit-shape-overlap input').prop('checked', _shapeObject.get_AllowOverlap());

                // Wrap distance
                var paddings = _shapeObject.get_Paddings();
                if (paddings) {
                    var distance = Common.Utils.Metric.fnRecalcFromMM(paddings.get_Top());
                    $('.shape-wrap .distance input').val(distance);
                    $('.shape-wrap .distance .item-after').text(distance + ' ' + _metricText);
                }
            },

            _initStyleView: function () {
                var me = this,
                    shapeProperties = _shapeObject.get_ShapeProperties(),
                    paletteFillColor = me.getView('EditShape').paletteFillColor,
                    paletteBorderColor = me.getView('EditShape').paletteBorderColor;

                // Init style border size
                var borderSize = borderSizeTransform.sizeByValue(shapeProperties.get_stroke().get_width());
                $('#edit-shape-bordersize input').val([borderSizeTransform.sizeByIndex(shapeProperties.get_stroke().get_width())]);
                $('#edit-shape-bordersize .item-after').text(borderSize + ' ' + _metricText);

                // Init style opacity
                $('#edit-shape-effect input').val([shapeProperties.get_fill().transparent ? shapeProperties.get_fill().transparent / 2.55 : 100]);
                $('#edit-shape-effect .item-after').text($('#edit-shape-effect input').val() + ' ' + "%");

                paletteFillColor && paletteFillColor.on('select',       _.bind(me.onFillColor, me));
                paletteBorderColor && paletteBorderColor.on('select',   _.bind(me.onBorderColor, me));

                var sdkColor, color;

                // Init fill color
                var fill = shapeProperties.get_fill(),
                    fillType = fill.get_type();

                color = 'transparent';

                if (fillType == Asc.c_oAscFill.FILL_TYPE_SOLID) {
                    fill = fill.get_fill();
                    sdkColor = fill.get_color();

                    if (sdkColor) {
                        if (sdkColor.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            color = {color: Common.Utils.ThemeColor.getHexColor(sdkColor.get_r(), sdkColor.get_g(), sdkColor.get_b()), effectValue: sdkColor.get_value()};
                        } else {
                            color = Common.Utils.ThemeColor.getHexColor(sdkColor.get_r(), sdkColor.get_g(), sdkColor.get_b());
                        }
                    }
                }

                paletteFillColor && paletteFillColor.select(color);

                // Init border color
                var stroke = shapeProperties.get_stroke(),
                    strokeType = stroke.get_type();

                color = 'transparent';

                if (stroke && strokeType == Asc.c_oAscStrokeType.STROKE_COLOR) {
                    sdkColor = stroke.get_color();

                    if (sdkColor) {
                        if (sdkColor.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            color = {color: Common.Utils.ThemeColor.getHexColor(sdkColor.get_r(), sdkColor.get_g(), sdkColor.get_b()), effectValue: sdkColor.get_value()};
                        }
                        else {
                            color = Common.Utils.ThemeColor.getHexColor(sdkColor.get_r(), sdkColor.get_g(), sdkColor.get_b());
                        }
                    }
                }

                paletteBorderColor && paletteBorderColor.select(color);
                $('#edit-shape-bordercolor .color-preview').css('background-color', ('transparent' == color) ? color : ('#' + (_.isObject(color) ? color.color : color)))
            },

            // Public

            getShape: function () {
                return _shapeObject;
            },

            // Handlers

            onRemoveShape: function () {
                console.debug('REMOVE SHAPE!!!');
            },

            onReorder: function (e) {
                var $target = $(e.currentTarget),
                    type = $target.data('type');

                var properties = new Asc.asc_CImgProperty();

                if ('all-up' == type) {
                    properties.put_ChangeLevel(Asc.c_oAscChangeLevel.BringToFront);
                } else if ('all-down' == type) {
                    properties.put_ChangeLevel(Asc.c_oAscChangeLevel.SendToBack);
                } else if ('move-up' == type) {
                    properties.put_ChangeLevel(Asc.c_oAscChangeLevel.BringForward);
                } else if ('move-down' == type) {
                    properties.put_ChangeLevel(Asc.c_oAscChangeLevel.BringBackward);
                }

                this.api.ImgApply(properties);
            },

            onReplace: function (e) {
                var $target = $(e.currentTarget),
                    type = $target.data('type');

                this.api.ChangeShapeType(type);
            },

            onWrapType: function (e) {
                var me = this,
                    $target = $(e.currentTarget).find('input'),
                    value = $target.val(),
                    properties = new Asc.asc_CImgProperty();

                me._uiTransformByWrap(value);

                var sdkType = wrapTypesTransform.uiToSdk(value);

                properties.put_WrappingStyle(sdkType);

                me.api.ImgApply(properties);
            },

            onAlign: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    type = $target.data('type');

                $('.shape-wrap .align a').removeClass('active');
                $target.addClass('active');

                var hAlign = Asc.c_oAscAlignH.Left;

                if ('center' == type) {
                    hAlign = Asc.c_oAscAlignH.Center;
                } else if ('right' == type) {
                    hAlign = Asc.c_oAscAlignH.Right;
                }

                var properties = new Asc.asc_CImgProperty();
                properties.put_PositionH(new Asc.CImagePositionH());
                properties.get_PositionH().put_UseAlign(true);
                properties.get_PositionH().put_Align(hAlign);
                properties.get_PositionH().put_RelativeFrom(Asc.c_oAscRelativeFromH.Page);

                me.api.ImgApply(properties);
            },

            onMoveText: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    properties = new Asc.asc_CImgProperty();

                properties.put_PositionV(new Asc.CImagePositionV());
                properties.get_PositionV().put_UseAlign(true);
                properties.get_PositionV().put_RelativeFrom($target.is(':checked') ? Asc.c_oAscRelativeFromV.Paragraph : Asc.c_oAscRelativeFromV.Page);

                me.api.ImgApply(properties);
            },

            onOverlap: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    properties = new Asc.asc_CImgProperty();

                properties.put_AllowOverlap($target.is(':checked'));

                me.api.ImgApply(properties);
            },

            onWrapDistance: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val(),
                    properties = new Asc.asc_CImgProperty(),
                    paddings = new Asc.asc_CPaddings();

                $('.shape-wrap .distance .item-after').text(value + ' ' + _metricText);

                value = Common.Utils.Metric.fnRecalcToMM(parseInt(value));

                paddings.put_Top(value);
                paddings.put_Right(value);
                paddings.put_Bottom(value);
                paddings.put_Left(value);

                properties.put_Paddings(paddings);

                me.api.ImgApply(properties);
            },

            onWrapDistanceChanging: function (e) {
                var $target = $(e.currentTarget);
                $('.shape-wrap .distance .item-after').text($target.val() + ' ' + _metricText);
            },

            onBorderSize: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val(),
                    currentShape = _shapeObject.get_ShapeProperties(),
                    image = new Asc.asc_CImgProperty(),
                    shape = new Asc.asc_CShapeProperty(),
                    stroke = new Asc.asc_CStroke(),
                    currentColor = Common.Utils.ThemeColor.getRgbColor('000000');

                value = borderSizeTransform.sizeByIndex(parseInt(value));

                var currentStroke = currentShape.get_stroke();

                if (currentStroke) {
                    var currentStrokeType = currentStroke.get_type();

                    if (currentStrokeType == Asc.c_oAscStrokeType.STROKE_COLOR) {
                        currentColor = currentStroke.get_color();
                    }
                }

                if (value < 0.01) {
                    stroke.put_type(Asc.c_oAscStrokeType.STROKE_NONE);
                } else {
                    stroke.put_type(Asc.c_oAscStrokeType.STROKE_COLOR);
                    stroke.put_color(currentColor);
                    stroke.put_width(value * 25.4 / 72.0);
                }

                shape.put_stroke(stroke);
                image.put_ShapeProperties(shape);

                me.api.ImgApply(image);
            },

            onBorderSizeChanging: function (e) {
                var $target = $(e.currentTarget);
                $('#edit-shape-bordersize .item-after').text(borderSizeTransform.sizeByIndex($target.val()) + ' ' + _metricText);
            },

            onOpacity: function (e) {
                var me = this,
                    $target = $(e.currentTarget),
                    value = $target.val(),
                    properties = new Asc.asc_CImgProperty(),
                    fill = new Asc.asc_CShapeFill(),
                    shape = new Asc.asc_CShapeProperty();

                fill.put_transparent(parseInt(value * 2.55));
                shape.put_fill(fill);
                properties.put_ShapeProperties(shape);

                me.api.ImgApply(properties);
            },

            onOpacityChanging: function (e) {
                var $target = $(e.currentTarget);
                $('#edit-shape-effect .item-after').text($target.val() + ' %');
            },

            onFillColor: function(palette, color) {
                var me = this,
                    currentShape = _shapeObject.get_ShapeProperties();

                if (me.api) {
                    var image = new Asc.asc_CImgProperty(),
                        shape = new Asc.asc_CShapeProperty(),
                        fill = new Asc.asc_CShapeFill();

                    if (color == 'transparent') {
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_NOFILL);
                        fill.put_fill(null);
                    } else {
                        fill.put_type(Asc.c_oAscFill.FILL_TYPE_SOLID);
                        fill.put_fill(new Asc.asc_CFillSolid());
                        fill.get_fill().put_color(Common.Utils.ThemeColor.getRgbColor(color));
                    }

                    shape.put_fill(fill);
                    image.put_ShapeProperties(shape);

                    me.api.ImgApply(image);
                }
            },

            onBorderColor: function (palette, color) {
                var me = this,
                    currentShape = _shapeObject.get_ShapeProperties();

                $('#edit-shape-bordercolor .color-preview').css('background-color', ('transparent' == color) ? color : ('#' + (_.isObject(color) ? color.color : color)));

                if (me.api && currentShape) {
                    var image = new Asc.asc_CImgProperty(),
                        shape = new Asc.asc_CShapeProperty(),
                        stroke = new Asc.asc_CStroke();

                    if (currentShape.get_stroke().get_width() < 0.01) {
                        stroke.put_type(Asc.c_oAscStrokeType.STROKE_NONE);
                    } else {
                        stroke.put_type(Asc.c_oAscStrokeType.STROKE_COLOR);
                        stroke.put_color(Common.Utils.ThemeColor.getRgbColor(color));
                        stroke.put_width(currentShape.get_stroke().get_width());
                        stroke.asc_putPrstDash(currentShape.get_stroke().asc_getPrstDash());
                    }

                    shape.put_stroke(stroke);
                    image.put_ShapeProperties(shape);

                    me.api.ImgApply(image);
                }
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;

                var shapes = [];

                _.each(_stack, function (object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        if (object.get_ObjectValue() && object.get_ObjectValue().get_ShapeProperties()) {
                            shapes.push(object);
                        }
                    }
                });

                if (shapes.length > 0) {
                    var object = shapes[shapes.length - 1]; // get top shape
                    _shapeObject = object.get_ObjectValue();
                } else {
                    _shapeObject = undefined;
                }
            },

            // Helpers

            _uiTransformByWrap: function(type) {
                $('.shape-wrap .align')[('inline' == type) ? 'hide' : 'show']();
                $('.shape-wrap .distance')[('behind' == type || 'infront' == type) ? 'hide' : 'show']();
                $('#edit-shape-movetext').toggleClass('disabled', ('inline' == type));
            },

            _closeIfNeed: function () {
                if (!this._isShapeInStack()) {
                    DE.getController('EditContainer').hideModal();
                }
            },

            _isShapeInStack: function () {
                var shapeExist = false;

                _.some(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        if (object.get_ObjectValue() && object.get_ObjectValue().get_ShapeProperties()) {
                            shapeExist = true;
                            return true;
                        }
                    }
                });

                return shapeExist;
            }
        };
    })());
});