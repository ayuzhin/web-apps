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
    'documenteditor/mobile/app/view/edit/EditText'
], function (core) {
    'use strict';

    DE.Controllers.EditText = Backbone.Controller.extend((function() {
        var _fontsArray = [],
            _stack = [],
            _paragraphObject = undefined,
            _fontInfo = {};

        function onApiLoadFonts(fonts, select) {
            _.each(fonts, function(font){
                var fontId = font.asc_getFontId();
                _fontsArray.push({
                    id          : fontId,
                    name        : font.asc_getFontName(),
//                    displayValue: font.asc_getFontName(),
                    imgidx      : font.asc_getFontThumbnail(),
                    type        : font.asc_getFontType()
                });
            });

            Common.NotificationCenter.trigger('fonts:load', _fontsArray, select);
        }

        return {
            models: [],
            collections: [],
            views: [
                'EditText'
            ],

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'EditText': {
                        'page:show' : this.onPageShow,
                        'font:click': this.onFontClick
                    }
                });
            },

            setApi: function (api) {
                var me = this
                me.api = api;

                me.api.asc_registerCallback('asc_onInitEditorFonts',    _.bind(onApiLoadFonts, me));
                me.api.asc_registerCallback('asc_onFocusObject',        _.bind(me.onApiFocusObject, me));
                me.api.asc_registerCallback('asc_onFontFamily',         _.bind(me.onApiChangeFont, me));
                me.api.asc_registerCallback('asc_onFontSize',           _.bind(me.onApiFontSize, me));
                me.api.asc_registerCallback('asc_onBold',               _.bind(me.onApiBold, me));
                me.api.asc_registerCallback('asc_onItalic',             _.bind(me.onApiItalic, me));
                me.api.asc_registerCallback('asc_onUnderline',          _.bind(me.onApiUnderline, me));
                me.api.asc_registerCallback('asc_onStrikeout',          _.bind(me.onApiStrikeout, me));
                me.api.asc_registerCallback('asc_onVerticalAlign',      _.bind(me.onApiVerticalAlign, me));
                // this.api.asc_registerCallback('asc_onCanUndo',              _.bind(this.onApiCanRevert, this, 'undo'));
                // this.api.asc_registerCallback('asc_onCanRedo',              _.bind(this.onApiCanRevert, this, 'redo'));
                me.api.asc_registerCallback('asc_onListType',           _.bind(me.onApiBullets, me));
                me.api.asc_registerCallback('asc_onPrAlign',            _.bind(me.onApiParagraphAlign, me));
                me.api.asc_registerCallback('asc_onTextColor',          _.bind(me.onApiTextColor, me));
                me.api.asc_registerCallback('asc_onParaSpacingLine',    _.bind(me.onApiLineSpacing, me));
                // this.api.asc_registerCallback('asc_onCanAddHyperlink',      _.bind(this.onApiCanAddHyperlink, this));
                // this.api.asc_registerCallback('asc_onFocusObject',          _.bind(this.onApiFocusObject, this));
                // this.api.asc_registerCallback('asc_onDocSize',              _.bind(this.onApiPageSize, this));
                // this.api.asc_registerCallback('asc_onPaintFormatChanged',   _.bind(this.onApiStyleChange, this));
                // this.api.asc_registerCallback('asc_onParaStyleName',        _.bind(this.onApiParagraphStyleChange, this));
                // this.api.asc_registerCallback('asc_onEndAddShape',          _.bind(this.onApiEndAddShape, this)); //for shapes
                // this.api.asc_registerCallback('asc_onPageOrient',           _.bind(this.onApiPageOrient, this));
                // this.api.asc_registerCallback('asc_onLockDocumentProps',    _.bind(this.onApiLockDocumentProps, this));
                // this.api.asc_registerCallback('asc_onUnLockDocumentProps',  _.bind(this.onApiUnLockDocumentProps, this));
                // this.api.asc_registerCallback('asc_onLockDocumentSchema',   _.bind(this.onApiLockDocumentSchema, this));
                // this.api.asc_registerCallback('asc_onUnLockDocumentSchema', _.bind(this.onApiUnLockDocumentSchema, this));
                // this.api.asc_registerCallback('asc_onLockHeaderFooters',    _.bind(this.onApiLockHeaderFooters, this));
                // this.api.asc_registerCallback('asc_onUnLockHeaderFooters',  _.bind(this.onApiUnLockHeaderFooters, this));
                // this.api.asc_registerCallback('asc_onZoomChange',           _.bind(this.onApiZoomChange, this));
                // this.api.asc_registerCallback('asc_onMarkerFormatChanged',  _.bind(this.onApiStartHighlight, this));
                // this.api.asc_registerCallback('asc_onTextHighLight',        _.bind(this.onApiHighlightColor, this));
                // this.api.asc_registerCallback('asc_onInitEditorStyles',     _.bind(this.onApiInitEditorStyles, this));
                // this.api.asc_registerCallback('asc_onCoAuthoringDisconnect',_.bind(this.onApiCoAuthoringDisconnect, this));
                // Common.NotificationCenter.on('api:disconnect',              _.bind(this.onApiCoAuthoringDisconnect, this));
                // this.api.asc_registerCallback('asc_onCanCopyCut',           _.bind(this.onApiCanCopyCut, this));
                // this.api.asc_registerCallback('asc_onMathTypes',            _.bind(this.onMathTypes, this));
                // this.api.asc_registerCallback('asc_onColumnsProps',         _.bind(this.onColumnsProps, this));
                // this.api.asc_registerCallback('asc_onSectionProps',         _.bind(this.onSectionProps, this));
            },

            onLaunch: function () {
                this.createView('EditText').render();
            },

            initEvents: function () {
                var me = this;
                $('#font-bold').single('click',                 _.bind(me.onBold, me));
                $('#font-italic').single('click',               _.bind(me.onItalic, me));
                $('#font-underline').single('click',            _.bind(me.onUnderline, me));
                $('#font-strikethrough').single('click',        _.bind(me.onStrikethrough, me));

                $('#paragraph-align .button').single('click',   _.bind(me.onParagraphAlign, me));
                $('#font-moveleft, #font-moveright').single('click',   _.bind(me.onParagraphMove, me));

                me.initSettings();
            },

            onPageShow: function (view, pageId) {
                var me = this,
                    paletteTextColor = me.getView('EditText').paletteTextColor,
                    paletteBackgroundColor = me.getView('EditText').paletteBackgroundColor;

                $('#text-additional li').single('click',        _.buffered(me.onAdditional, 100, me));
                $('#page-text-linespacing li').single('click',  _.buffered(me.onLineSpacing, 100, me));
                $('#font-size .button').single('click',         _.bind(me.onFontSize, me));
                $('#letter-spacing .button').single('click',    _.bind(me.onLetterSpacing, me));

                $('.dataview.bullets li').single('click',       _.buffered(me.onBullet, 100, me));
                $('.dataview.numbers li').single('click',       _.buffered(me.onNumber, 100, me));

                $('#font-color-auto').single('click',           _.bind(me.onTextColorAuto, me));
                paletteTextColor && paletteTextColor.on('select', _.bind(me.onTextColor, me));
                paletteBackgroundColor && paletteBackgroundColor.on('select', _.bind(me.onBackgroundColor, me));

                me.initSettings(pageId);
            },

            initSettings: function (pageId) {
                var me = this;

                me.api && me.api.UpdateInterfaceState(); // TODO: refactor me

                if (_paragraphObject) {
                    var $inputStrikethrough = $('#text-additional input[name=text-strikethrough]');
                    var $inputTextCaps = $('#text-additional input[name=text-caps]');

                    _paragraphObject.get_Strikeout() && $inputStrikethrough.val(['strikethrough']).prop('prevValue', 'strikethrough');
                    _paragraphObject.get_DStrikeout() && $inputStrikethrough.val(['double-strikethrough']).prop('prevValue', 'double-strikethrough');

                    _paragraphObject.get_SmallCaps() && $inputTextCaps.val(['small']).prop('prevValue', 'small');
                    _paragraphObject.get_AllCaps() && $inputTextCaps.val(['all']).prop('prevValue', 'all');

                    _fontInfo.letterSpacing = Common.Utils.Metric.fnRecalcFromMM(_paragraphObject.get_TextSpacing());
                    $('#letter-spacing .item-after label').text(_fontInfo.letterSpacing + ' ' + Common.Utils.Metric.getCurrentMetricName());

                    // Background color
                    var shade = _paragraphObject.get_Shade(),
                        backColor = 'transparent';

                    if (!_.isNull(shade) && !_.isUndefined(shade) && shade.get_Value()===Asc.c_oAscShdClear) {
                        var color = shade.get_Color();
                        if (color) {
                            if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                                backColor = {
                                    color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()),
                                    effectValue: color.get_value()
                                };
                            } else {
                                backColor = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                            }
                        }
                    }

                    $('#font-background .color-preview').css('background-color', '#' + (_.isObject(backColor) ? backColor.color : backColor));

                    if (pageId == '#edit-text-background') {
                        var palette = me.getView('EditText').paletteBackgroundColor;

                        if (palette) {
                            palette.select(backColor);
                        }
                    }
                }
            },

            // Public

            getFonts: function() {
                return _fontsArray;
            },

            getStack: function() {
                return _stack;
            },

            getFontInfo: function () {
                return _fontInfo;
            },

            getParagraph: function () {
                return _paragraphObject;
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

            onParagraphAlign: function (e) {
                var $target = $(e.currentTarget);

                if ($target) {
                    var id = $target.attr('id'),
                        type = 1;

                    if ('font-just' == id) {
                        type = 3;
                    } else if ('font-right' == id) {
                        type = 0;
                    } else if ('font-center' == id) {
                        type = 2;
                    }

                    $('#paragraph-align .button').removeClass('active');
                    $target.addClass('active');

                    this.api.put_PrAlign(type);
                }
            },

            onParagraphMove: function (e) {
                var $target = $(e.currentTarget);

                if ($target && this.api) {
                    var id = $target.attr('id');

                    if ('font-moveleft' == id) {
                        this.api.DecreaseIndent();
                    } else {
                        this.api.IncreaseIndent();
                    }
                }
            },

            onAdditionalStrikethrough : function ($target) {
                var value   = $target.prop('value'),
                    checked = $target.prop('checked');

                if ('strikethrough' == value) {
                    this.api.put_TextPrStrikeout(checked);
                } else {
                    this.api.put_TextPrDStrikeout(checked);
                }
            },

            onAdditionalScript : function ($target) {
                var value   = $target.prop('value'),
                    checked = $target.prop('checked');

                if ('superscript' == value) {
                    this.api.put_TextPrBaseline(checked ? 1 : 0);
                } else {
                    this.api.put_TextPrBaseline(checked ? 2 : 0);
                }
            },

            onAdditionalCaps : function ($target) {
                var value   = $target.prop('value'),
                    checked = $target.prop('checked'),
                    paragraphProps = new Asc.asc_CParagraphProperty();

                if ('small' == value) {
                    paragraphProps.put_AllCaps(false);
                    paragraphProps.put_SmallCaps(checked);
                } else {
                    paragraphProps.put_AllCaps(checked);
                    paragraphProps.put_SmallCaps(false);
                }

                this.api.paraApply(paragraphProps);
            },

            onAdditional: function(e) {
                var me = this,
                    $target = $(e.currentTarget).find('input'),
                    prevValue = $target.prop('prevValue');

                if (prevValue == $target.prop('value')) {
                    $target.prop('checked', false);
                    prevValue = null;
                } else {
                    $target.prop('checked', true);
                    prevValue = $target.prop('value');
                }

                $('#page-text-additional input[name="'+ $target.prop('name') +'"]').prop('prevValue', prevValue);

                var radioName = $target.prop('name');
                if ('text-strikethrough' == radioName) {
                    me.onAdditionalStrikethrough($target);
                } else if ('text-script' == radioName) {
                    me.onAdditionalScript($target);
                } else if ('text-caps' == radioName){
                    me.onAdditionalCaps($target);
                }
            },

            onLineSpacing: function (e) {
                var $target = $(e.currentTarget).find('input');

                if ($target && this.api) {
                    var value = parseFloat($target.prop('value')),
                        LINERULE_AUTO = 1;

                    this.api.put_PrLineSpacing(LINERULE_AUTO, value);
                }
            },

            onFontClick: function (view, e) {
                var $item = $(e.currentTarget).find('input');

                if ($item) {
                    this.api.put_TextPrFontName($item.prop('value'));
                }
            },

            onFontSize: function (e) {
                var $button = $(e.currentTarget),
                    fontSize = _fontInfo.size;

                if ($button.hasClass('decrement')) {
                    _.isUndefined(fontSize) ? this.api.FontSizeOut() : fontSize = Math.max(1, --fontSize);
                } else {
                    _.isUndefined(fontSize) ? this.api.FontSizeIn() : fontSize = Math.min(100, ++fontSize);
                }

                if (! _.isUndefined(fontSize)) {
                    this.api.put_TextPrFontSize(fontSize);
                }
            },

            onLetterSpacing: function (e) {
                var $button = $(e.currentTarget),
                    spacing = _fontInfo.letterSpacing;

                if ($button.hasClass('decrement')) {
                    spacing = Math.max(-100, --spacing);
                } else {
                    spacing = Math.min(100, ++spacing);
                }
                _fontInfo.letterSpacing = spacing;

                $('#letter-spacing .item-after label').text(spacing + ' ' + Common.Utils.Metric.getCurrentMetricName());

                var properties = new Asc.asc_CParagraphProperty();
                properties.put_TextSpacing(Common.Utils.Metric.fnRecalcToMM(spacing));

                this.api.paraApply(properties);
            },

            onBullet: function (e) {
                var $bullet = $(e.currentTarget),
                    type = $bullet.data('type');

                $('.dataview.bullets li').removeClass('active');
                $bullet.addClass('active');

                this.api.put_ListType(0, parseInt(type));
            },

            onNumber: function (e) {
                var $number = $(e.currentTarget),
                    type = $number.data('type');

                $('.dataview.numbers li').removeClass('active');
                $number.addClass('active');

                this.api.put_ListType(1, parseInt(type));
            },

            onTextColorAuto: function (e) {
                var me = this,
                    paletteTextColor = me.getView('EditText').paletteTextColor;

                if (paletteTextColor) {
                    paletteTextColor.clearSelection();
                }

                if (this.api) {
                    this.api.put_TextColor(Common.Utils.ThemeColor.getRgbColor("000000"));
                }
            },

            onTextColor: function (palette, color) {
                // $('.btn-color-value-line', this.toolbar.btnFontColor.cmpEl).css('background-color', '#' + clr);

                if (this.api) {
                    this.api.put_TextColor(Common.Utils.ThemeColor.getRgbColor(color));
                }
            },

            onBackgroundColor: function (palette, color) {
                if (this.api) {
                    if (color == 'transparent') {
                        this.api.put_ParagraphShade(false);
                    } else {
                        this.api.put_ParagraphShade(true, Common.Utils.ThemeColor.getRgbColor(color));
                    }
                }
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;

                var paragraphs = [];

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Paragraph) {
                        paragraphs.push(object);
                    }
                });

                if (paragraphs.length > 0) {
                    var object = paragraphs[paragraphs.length - 1]; // get top
                    _paragraphObject = object.get_ObjectValue();
                } else {
                    _paragraphObject = undefined;
                }
            },

            onApiChangeFont: function(font) {
                var name = (_.isFunction(font.get_Name) ?  font.get_Name() : font.asc_getName()) || 'Fonts';
                _fontInfo.name = name;

                $('#font-fonts .item-title').html(name);
            },

            onApiFontSize: function(size) {
                _fontInfo.size = size;
                var displaySize = _fontInfo.size;

                _.isUndefined(displaySize) ? displaySize = 'Auto' : displaySize = displaySize + ' ' + 'pt';

                $('#font-fonts .item-after span:first-child').html(displaySize);
                $('#font-size .item-after label').html(displaySize);
            },

            onApiBold: function(on) {
                $('#font-bold').toggleClass('active', on);
            },

            onApiItalic: function(on) {
                $('#font-italic').toggleClass('active', on);
            },

            onApiUnderline: function(on) {
                $('#font-underline').toggleClass('active', on);
            },

            onApiStrikeout: function(on) {
                $('#font-strikethrough').toggleClass('active', on);
            },

            onApiBullets: function(data) {
                var type    = data.get_ListType(),
                    subtype = data.get_ListSubType();

                switch (type) {
                    case 0:
                        $('.dataview.bullets li[data-type=' + subtype + ']').addClass('active');
                        break;
                    case 1:
                        $('.dataview.numbers li[data-type=' + subtype + ']').addClass('active');
                        break;
                }
            },

            onApiParagraphAlign: function(align) {
                $('#font-right').toggleClass('active', align===0);
                $('#font-left').toggleClass('active', align===1);
                $('#font-center').toggleClass('active', align===2);
                $('#font-just').toggleClass('active', align===3);
            },

            onApiVerticalAlign: function(typeBaseline) {
                var value;

                typeBaseline==1 && (value = 'superscript');
                typeBaseline==2 && (value = 'subscript');

                if (!_.isUndefined(value)) {
                    $('#text-additional input[name=text-script]').val([value]).prop('prevValue', value);
                }
            },

            onApiTextColor: function (color) {
                var me = this;

                if (color.get_auto()) {
                    // on auto
                } else {
                    var palette = me.getView('EditText').paletteTextColor,
                        clr;

                    if (color) {
                        if (color.get_type() == Asc.c_oAscColor.COLOR_TYPE_SCHEME) {
                            clr = {
                                color: Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b()),
                                effectValue: color.get_value()
                            }
                        } else {
                            clr = Common.Utils.ThemeColor.getHexColor(color.get_r(), color.get_g(), color.get_b());
                        }

                        $('#font-color .color-preview').css('background-color', '#' + (_.isObject(clr) ? clr.color : clr));
                    }

                    if (palette) {
                        palette.select(clr);
                    }
                }
            },

            onApiLineSpacing: function(vc) {
                var line = (vc.get_Line() === null || vc.get_LineRule() === null || vc.get_LineRule() != 1) ? -1 : vc.get_Line();

                $('#page-text-linespacing input').val([line]);
            },

            // Helpers
            _toggleButton: function (e) {
                return $(e.currentTarget).toggleClass('active').hasClass('active');
            }
        }
    })());
});
