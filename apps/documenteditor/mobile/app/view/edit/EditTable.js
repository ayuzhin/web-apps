/**
 *  EditTable.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/20/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/EditTable.template',
    'jquery',
    'underscore',
    'backbone',
    'common/mobile/lib/component/ThemeColorPalette'
], function (editTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.EditTable = Backbone.View.extend((function() {
        // private
        var _styles = [];

        return {
            // el: '.view-main',

            template: _.template(editTemplate),

            events: {
            },

            initialize: function () {
                Common.NotificationCenter.on('editcontainer:show', _.bind(this.initEvents, this));
                Common.NotificationCenter.on('editcategory:show',  _.bind(this.categoryShow, this));
                Common.NotificationCenter.on('tablestyles:load',   _.bind(this.onStylesLoad, this));
            },

            initEvents: function () {
                var me = this;

                $('#table-wrap').single('click',                        _.bind(me.showTableWrap, me));
                $('#table-style').single('click',                       _.bind(me.showTableStyle, me));
                $('#table-options').single('click',                     _.bind(me.showTableOptions, me));
                $('#edit-table-style-options').single('click',          _.bind(me.showTableStyleOptions, me));
                $('#edit-table-bordercolor').single('click',            _.bind(me.showBorderColor, me));


                $('.edit-table-style .categories a').single('click',    _.bind(me.showStyleCategory, me));

                me.initControls();
                me.renderStyles();
            },

            // Render layout
            render: function () {
                this.layout = $('<div/>').append(this.template({
                    android : Common.SharedSettings.get('android'),
                    phone   : Common.SharedSettings.get('phone')
                }));

                return this;
            },

            rootLayout: function () {
                if (this.layout) {
                    return this.layout
                        .find('#edit-table-root')
                        .html();
                }

                return '';
            },

            initControls: function () {
                //
            },

            onStylesLoad: function () {
                _styles = Common.SharedSettings.get('tablestyles');
            },

            renderStyles: function() {
                var $editTableStyle = $('#edit-table-styles .item-inner .dataview.table-styles'),
                    $styleContainer = $('#edit-table-styles .item-inner');

                if ($editTableStyle.length < 1 && $styleContainer.length > 0) {
                    var columns = parseInt($styleContainer.width() / 70), // magic
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
                        '<div class="dataview table-styles" style="width: 100%;">',
                            '<% _.each(styles, function(row) { %>',
                            '<div class="row">',
                                '<% _.each(row, function(style) { %>',
                                '<div data-type="<%= style.templateId %>">',
                                    '<img src="<%= style.imageUrl %>">',
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

            categoryShow: function(e) {
                // if ('edit-shape' == $(e.currentTarget).prop('id')) {
                //     this.initEvents();
                // }
            },

            showStyleCategory: function (e) {
                var $target = $(e.currentTarget),
                    category = $target.data('type');

                $('.edit-table-style .categories a').removeClass('active');
                $target.addClass('active');

                $('.edit-table-style .list-block').hide();
                $('.edit-table-style .list-block.' + category).show();

                // remove android specific style
                $('.edit-table-style .list-block.inputs-list').removeClass('inputs-list');
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

            showTableWrap: function () {
                this.showPage('#edit-table-wrap');
            },

            showTableStyle: function () {
                this.showPage('#edit-table-style', true);

                this.paletteFillColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-table-style] .page-content'),
                    transparent: true,
                    cls: 'fill',
                    style: 'display: none; margin-top: -1px;'
                });

                this.fireEvent('page:show', [this, '#edit-table-style']);
            },

            showBorderColor: function () {
                this.showPage('#edit-table-border-color-view', true);

                this.paletteBorderColor = new Common.UI.ThemeColorPalette({
                    el: $('.page[data-page=edit-table-border-color] .page-content')
                });

                this.fireEvent('page:show', [this, '#edit-table-border-color-view']);
            },

            showTableOptions: function () {
                this.showPage('#edit-table-options');
            },

            showTableStyleOptions: function () {
                this.showPage('#edit-table-style-options-view');
            }

        }
    })());
});