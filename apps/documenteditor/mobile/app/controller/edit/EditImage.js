/**
 *  EditImage.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/3/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/edit/EditImage'
], function (core) {
    'use strict';

    DE.Controllers.EditImage = Backbone.Controller.extend((function() {
        // Private
        var _stack = [],
            _imageObject = undefined,
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
                'EditImage'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditImage': {
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
                this.createView('EditImage').render();
            },

            initEvents: function () {
                var me = this;

                $('#image-default').single('click', _.bind(me.onDefaulSize, me));
                $('#image-remove').single('click',  _.bind(me.onRemoveImage, me));

                me.initSettings();
            },

            onPageShow: function (view, pageId) {
                var me = this;

                $('.image-wrap .image-wrap-types li').single('click',       _.buffered(me.onWrapType, 100, me));
                $('.image-wrap .align a').single('click',                   _.bind(me.onAlign, me));
                $('#edit-image-movetext input').single('click',             _.bind(me.onMoveText, me));
                $('#edit-image-overlap input').single('click',              _.bind(me.onOverlap, me));
                $('.image-wrap .distance input').single('change touchend',  _.buffered(me.onWrapDistance, 100, me));
                $('.image-wrap .distance input').single('input',            _.bind(me.onWrapDistanceChanging, me));

                $('#edit-image-file').single('click',                       _.bind(me.onReplaceByFile, me));
                $('.edit-image-url-link .button, .edit-image-url-link .list-button').single('click', _.bind(me.onReplaceByUrl, me));

                me.initSettings(pageId);
            },

            initSettings: function (pageId) {
                var me = this;

                if (_imageObject) {
                    if (pageId == '#edit-image-wrap-view') {
                        me._initWrapView();
                    }
                }
            },

            _initWrapView: function() {
                // Wrap type
                var me = this,
                    wrapping = _imageObject.get_WrappingStyle(),
                    $imageWrapInput = $('.image-wrap input'),
                    imageWrapType = wrapTypesTransform.sdkToUi(wrapping);

                $imageWrapInput.val([imageWrapType]);
                me._uiTransformByWrap(imageWrapType);

                // Wrap align
                var imageHAlign = _imageObject.get_PositionH().get_Align();

                $('.image-wrap .align a[data-type=left]').toggleClass('active', imageHAlign == Asc.c_oAscAlignH.Left);
                $('.image-wrap .align a[data-type=center]').toggleClass('active', imageHAlign == Asc.c_oAscAlignH.Center);
                $('.image-wrap .align a[data-type=right]').toggleClass('active', imageHAlign == Asc.c_oAscAlignH.Right);


                // Wrap flags
                $('#edit-image-movetext input').prop('checked', _imageObject.get_PositionV().get_RelativeFrom() == Asc.c_oAscRelativeFromV.Paragraph);
                $('#edit-image-overlap input').prop('checked', _imageObject.get_AllowOverlap());

                // Wrap distance
                var paddings = _imageObject.get_Paddings();
                if (paddings) {
                    var distance = Common.Utils.Metric.fnRecalcFromMM(paddings.get_Top());
                    $('.image-wrap .distance input').val(distance);
                    $('.image-wrap .distance .item-after').text(distance + ' ' + _metricText);
                }
            },

            // Public

            getImage: function () {
                return _imageObject;
            },

            // Handlers

            onDefaulSize: function () {
                console.debug('Default size image!!!');
            },

            onRemoveImage: function () {
                console.debug('REMOVE image!!!');
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

                $('.image-wrap .align a').removeClass('active');
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

                $('.image-wrap .distance .item-after').text(value + ' ' + _metricText);

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
                $('.image-wrap .distance .item-after').text($target.val() + ' ' + _metricText);
            },

            onReplaceByFile: function () {
                this.api.ChangeImageFromFile();
            },

            onReplaceByUrl: function () {
                var me = this,
                    $input = $('.edit-image-url-link input[type=url]');

                if ($input) {
                    var value = ($input.val()).replace(/ /g, '');

                    _.delay(function () {
                        if (!_.isEmpty(value)) {
                            if ((/((^https?)|(^ftp)):\/\/.+/i.test(value))) {
                                var image = new Asc.asc_CImgProperty();
                                image.put_ImageUrl(value);
                                me.api.ImgApply(image);
                                DE.getController('EditContainer').hideModal();
                            } else {
                                uiApp.alert(me.txtNotUrl);
                            }
                        } else {
                            uiApp.alert(me.textEmptyImgUrl);
                        }
                    }, 300);
                }
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;

                var images = [];

                _.each(_stack, function (object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        var imageObject = object.get_ObjectValue();
                        if (imageObject && _.isNull(imageObject.get_ShapeProperties()) && _.isNull(imageObject.get_ChartProperties())) {
                            images.push(object);
                        }
                    }
                });

                if (images.length > 0) {
                    var object = images[images.length - 1]; // get top
                    _imageObject = object.get_ObjectValue();
                } else {
                    _imageObject = undefined;
                }
            },

            // Helpers

            _uiTransformByWrap: function(type) {
                $('.image-wrap .align')[('inline' == type) ? 'hide' : 'show']();
                $('.image-wrap .distance')[('behind' == type || 'infront' == type) ? 'hide' : 'show']();
                $('#edit-image-movetext').toggleClass('disabled', ('inline' == type));
            },

            _closeIfNeed: function () {
                if (!this._isImageInStack()) {
                    DE.getController('EditContainer').hideModal();
                }
            },

            _isImageInStack: function () {
                var imageExist = false;

                _.some(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        var imageObject = object.get_ObjectValue();
                        if (imageObject && _.isNull(imageObject.get_imageProperties()) && _.isNull(imageObject.get_ChartProperties())) {
                            imageExist = true;
                            return true;
                        }
                    }
                });

                return imageExist;
            },

            textEmptyImgUrl : 'You need to specify image URL.',
            txtNotUrl       : 'This field should be a URL in the format \"http://www.example.com\"'
        };
    })());
});