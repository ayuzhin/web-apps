/**
 *  EditChart.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/7/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'text!documenteditor/mobile/app/template/EditChart.template',
    'jquery',
    'underscore',
    'backbone'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditChart = Backbone.View.extend((function() {
        // private
        var _styles = [];

        var _types = [
            { type: Asc.c_oAscChartTypeSettings.barNormal,               thumb: 'chart-03.png'},
            { type: Asc.c_oAscChartTypeSettings.barStacked,              thumb: 'chart-02.png'},
            { type: Asc.c_oAscChartTypeSettings.barStackedPer,           thumb: 'chart-01.png'},
            { type: Asc.c_oAscChartTypeSettings.lineNormal,              thumb: 'chart-06.png'},
            { type: Asc.c_oAscChartTypeSettings.lineStacked,             thumb: 'chart-05.png'},
            { type: Asc.c_oAscChartTypeSettings.lineStackedPer,          thumb: 'chart-04.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarNormal,              thumb: 'chart-09.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarStacked,             thumb: 'chart-08.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarStackedPer,          thumb: 'chart-07.png'},
            { type: Asc.c_oAscChartTypeSettings.areaNormal,              thumb: 'chart-12.png'},
            { type: Asc.c_oAscChartTypeSettings.areaStacked,             thumb: 'chart-11.png'},
            { type: Asc.c_oAscChartTypeSettings.areaStackedPer,          thumb: 'chart-10.png'},
            { type: Asc.c_oAscChartTypeSettings.pie,                     thumb: 'chart-13.png'},
            { type: Asc.c_oAscChartTypeSettings.doughnut,                thumb: 'chart-14.png'},
            { type: Asc.c_oAscChartTypeSettings.pie3d,                   thumb: 'chart-22.png'},
            { type: Asc.c_oAscChartTypeSettings.scatter,                 thumb: 'chart-15.png'},
            { type: Asc.c_oAscChartTypeSettings.stock,                   thumb: 'chart-16.png'},
            { type: Asc.c_oAscChartTypeSettings.line3d,                  thumb: 'chart-21.png'},
            { type: Asc.c_oAscChartTypeSettings.barNormal3d,             thumb: 'chart-17.png'},
            { type: Asc.c_oAscChartTypeSettings.barStacked3d,            thumb: 'chart-18.png'},
            { type: Asc.c_oAscChartTypeSettings.barStackedPer3d,         thumb: 'chart-19.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarNormal3d,            thumb: 'chart-25.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarStacked3d,           thumb: 'chart-24.png'},
            { type: Asc.c_oAscChartTypeSettings.hBarStackedPer3d,        thumb: 'chart-23.png'},
            { type: Asc.c_oAscChartTypeSettings.barNormal3dPerspective,  thumb: 'chart-20.png'}
        ];
        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('editcategory:show',  _.bind(this.categoryShow, this));
                Common.NotificationCenter.on('chartstyles:load',   _.bind(this.onStylesLoad, this));
            },

            initEvents: function () {
                var me = this;

                $('#chart-style').single('click',                   _.bind(me.showStyle, me));
                $('#chart-wrap').single('click',                    _.bind(me.showWrap, me));
                $('#chart-reorder').single('click',                 _.bind(me.showReorder, me));
                $('#edit-chart-bordercolor').single('click',        _.bind(me.showBorderColor, me));

                $('.edit-chart-style .categories a').single('click', _.bind(me.showStyleCategory, me));

                me.initControls();
                me.renderStyles();
            },

            categoryShow: function(e) {
                //
            },

            onStylesLoad: function () {
                _styles = Common.SharedSettings.get('chartstyles');
                this.renderStyles();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone'),
                    types   : _types
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#edit-chart-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            showPage: function (templateId, suspendEvent) {
                var rootView = DE.getController('EditContainer').rootView;

                if (rootView && this.layout) {
                    var $content = this.layout.find(templateId);

                    // Android fix for navigation
                    if (Framework7.prototype.device.android) {
                        $content.find('.page').append($content.find('.navbar'));
                    }

                    rootView.router.load({
                        content: $content.html()
                    });

                    if (suspendEvent !== true) {
                        this.fireEvent('page:show', [this, templateId]);
                    }

                    this.initEvents();
                }
            },

            showStyleCategory: function (e) {
                // remove android specific style
                $('.page[data-page=edit-chart-style] .list-block.inputs-list').removeClass('inputs-list');
            },

            renderStyles: function() {
                var $styleContainer = $('#edit-chart-styles .item-inner');

                if ($styleContainer.length > 0) {
                    var columns = parseInt($styleContainer.width() / 60), // magic
                        row = -1,
                        styles = [];

                    _.each(_styles, function (style, index) {
                        if (0 == index % columns) {
                            styles.push([]);
                            row++
                        }
                        styles[row].push(style);
                    });

                    var template = _.template([
                        '<div class="dataview chart-styles" style="width: 100%;">',
                            '<% _.each(styles, function(row) { %>',
                            '<div class="row">',
                                '<% _.each(row, function(style) { %>',
                                '<div data-type="<%= style.asc_getStyle() %>">',
                                    '<img src="<%= style.asc_getImageUrl() %>" width="50px" height="50px">',
                                '</div>',
                                '<% }); %>',
                            '</div>',
                            '<% }); %>',
                        '</div>'
                    ].join(''), {
                        styles: styles
                    });

                    $styleContainer.html(template);
                }
            },

            showStyle: function () {
                var selector = '#edit-chart-style';
                this.showPage(selector, true);

                this.paletteFillColor = new Common.UI.ThemeColorPalette({
                    el: $('#tab-chart-fill'),
                    transparent: true
                });

                this.fireEvent('page:show', [this, selector]);
            },

            showWrap: function () {
                this.showPage('#edit-chart-wrap');
            },

            showReorder: function () {
                this.showPage('#edit-chart-reorder');
            },

            showBorderColor: function () {
                var selector = '#edit-chart-border-color-view';
                this.showPage(selector, true);

                this.paletteBorderColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-chart-border-color] .page-content')
                });

                this.fireEvent('page:show', [this, selector]);
            }
        }
    })());
});