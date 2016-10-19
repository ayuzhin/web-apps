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
        var _stack = [],
            _paragraphInfo = {},
            _styles = [],
            _styleTumbSize,
            metricText = Common.Utils.Metric.getCurrentMetricName();

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

                me.api.asc_registerCallback('asc_onInitEditorStyles',   _.bind(me.onApiInitEditorStyles, me));
                me.api.asc_registerCallback('asc_onFocusObject',        _.bind(me.onApiFocusObject, me));
                me.api.asc_registerCallback('asc_onParaStyleName',      _.bind(me.onApiParagraphStyleChange, me));
            },

            onLaunch: function () {
                this.createView('EditParagraph').render();
            },

            initEvents: function () {
                var me = this;

                me.initSettings();
            },

            onPageShow: function () {
                var me = this;
                $('#paragraph-distance-before .button').single('click',         _.bind(me.onDistanceBefore, me));
                $('#paragraph-distance-after .button').single('click',          _.bind(me.onDistanceAfter, me));
                $('#paragraph-space input:checkbox').single('click',            _.bind(me.onSpaceBetween, me));
                $('#paragraph-page-break input:checkbox').single('click',       _.bind(me.onBreakBefore, me));
                $('#paragraph-page-orphan input:checkbox').single('click',      _.bind(me.onOrphan, me));
                $('#paragraph-page-keeptogether input:checkbox').single('click',_.bind(me.onKeepTogether, me));
                $('#paragraph-page-keepnext input:checkbox').single('click',    _.bind(me.onKeepNext, me));

                me.initSettings();
            },

            initSettings: function () {
                this.api && this.api.UpdateInterfaceState();

                _.each(_stack, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Paragraph) {
                        var paragraph = object.get_ObjectValue();

                        _paragraphInfo.spaceBefore = paragraph.get_Spacing().get_Before() < 0 ? paragraph.get_Spacing().get_Before() : Common.Utils.Metric.fnRecalcFromMM(paragraph.get_Spacing().get_Before());
                        _paragraphInfo.spaceAfter  = paragraph.get_Spacing().get_After() < 0 ? paragraph.get_Spacing().get_After() : Common.Utils.Metric.fnRecalcFromMM(paragraph.get_Spacing().get_After());
                        $('#paragraph-distance-before .item-after label').text(_paragraphInfo.spaceBefore < 0 ? 'Auto' : _paragraphInfo.spaceBefore + ' ' + metricText);
                        $('#paragraph-distance-after .item-after label').text(_paragraphInfo.spaceAfter < 0 ? 'Auto' : _paragraphInfo.spaceAfter + ' ' + metricText);

                        $('#paragraph-space input:checkbox').prop('checked', paragraph.get_ContextualSpacing());
                        $('#paragraph-page-break input:checkbox').prop('checked', paragraph.get_PageBreakBefore());
                        $('#paragraph-page-orphan input:checkbox').prop('checked', paragraph.get_WidowControl());
                        $('#paragraph-page-keeptogether input:checkbox').prop('checked', paragraph.get_KeepLines());
                        $('#paragraph-page-keepnext input:checkbox').prop('checked', paragraph.get_KeepNext());
                    }
                });
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

            onDistanceBefore: function (e) {
                var $button = $(e.currentTarget),
                    distance = _paragraphInfo.spaceBefore;

                if ($button.hasClass('decrement')) {
                    distance = Math.max(-1, --distance);
                } else {
                    distance = Math.min(100, ++distance);
                }

                _paragraphInfo.spaceBefore = distance;

                $('#paragraph-distance-before .item-after label').text(_paragraphInfo.spaceBefore < 0 ? 'Auto' : (_paragraphInfo.spaceBefore) + ' ' + metricText);

                this.api.put_LineSpacingBeforeAfter(0, (_paragraphInfo.spaceBefore < 0) ? -1 : Common.Utils.Metric.fnRecalcToMM(_paragraphInfo.spaceBefore));
            },

            onDistanceAfter: function (e) {
                var $button = $(e.currentTarget),
                    distance = _paragraphInfo.spaceAfter;

                if ($button.hasClass('decrement')) {
                    distance = Math.max(-1, --distance);
                } else {
                    distance = Math.min(100, ++distance);
                }

                _paragraphInfo.spaceAfter = distance;

                $('#paragraph-distance-after .item-after label').text(_paragraphInfo.spaceAfter < 0 ? 'Auto' : (_paragraphInfo.spaceAfter) + ' ' + metricText);

                this.api.put_LineSpacingBeforeAfter(1, (_paragraphInfo.spaceAfter < 0) ? -1 : Common.Utils.Metric.fnRecalcToMM(_paragraphInfo.spaceAfter));
            },

            onSpaceBetween: function (e) {
                var $checkbox = $(e.currentTarget);
                this.api.put_AddSpaceBetweenPrg($checkbox.is(':checked'));
            },

            onBreakBefore: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_PageBreakBefore($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onOrphan: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_WidowControl($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onKeepTogether: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_KeepLines($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },

            onKeepNext: function (e) {
                var $checkbox = $(e.currentTarget);
                var properties = new Asc.asc_CParagraphProperty();

                properties.put_KeepNext($checkbox.is(':checked'));
                this.api.paraApply(properties);
            },


            // API handlers

            onApiFocusObject: function (objects) {
                _stack = objects;
            },

            onApiInitEditorStyles: function (styles) {
                window.styles_loaded = false;

                if (styles.length < 1) {
                    return;
                }

                _styles = [];

                _styleTumbSize = {
                    width   : styles.STYLE_THUMBNAIL_WIDTH / uiApp.device.pixelRatio,
                    height  : styles.STYLE_THUMBNAIL_HEIGHT / uiApp.device.pixelRatio
                };

                _.each(styles.get_MergedStyles(), function(style){
                    _styles.push({
                        image   : style.asc_getImage(),
                        name    : style.get_Name()
                    });
                });

                window.styles_loaded = true;
            },

            onApiParagraphStyleChange: function(name) {
                $('#paragraph-list input[name=paragraph-style]').val([name]);
            }
        }
    })());
});