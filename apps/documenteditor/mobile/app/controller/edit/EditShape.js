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

                $('#shape-remove').single('click',  _.bind(me.onRemoveShape, me));

                me.initSettings();
            },

            onPageShow: function () {
                var me = this;

                $('.shape-reorder a').single('click',               _.bind(me.onReorder, me));
                $('.shape-replace li').single('click',              _.buffered(me.onReplace, 100, me));
                $('.shape-wrap li').single('click',                 _.buffered(me.onWrapType, 100, me));
                $('.shape-wrap .align a').single('click',           _.bind(me.onAlign, me));
                $('#edit-shape-movetext input').single('click',     _.bind(me.onMoveText, me));
                $('#edit-shape-overlap input').single('click',      _.bind(me.onOverlap, me));
                $('.shape-wrap .distance input').single('change',   _.bind(me.onWrapDistance, me));
                $('.shape-wrap .distance input').single('input',    _.bind(me.onWrapDistanceChanging, me));

                me.initSettings();
            },

            initSettings: function () {
                var me = this;

                me.api && me.api.UpdateInterfaceState();

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        _shapeObject = object.get_ObjectValue();

                        var shapeProperties = _shapeObject.get_ShapeProperties();

                        // Wrap type
                        var wrapping = _shapeObject.get_WrappingStyle(),
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
                    }
                });
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

                console.debug('NEED REPLACE!!!');
                this.api.AddShapeOnCurrentPage(type);
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

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;
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

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Shape) {
                        shapeExist = true;
                    }
                });

                return shapeExist;
            }
        };
    })());
});