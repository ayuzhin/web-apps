/**
 *  ThemeColorPalette.js
 *
 *  Created by Alexander Yuzhin on 10/27/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


if (Common === undefined)
    var Common = {};

Common.UI = Common.UI || {};

define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {
    'use strict';

    Common.UI.ThemeColorPalette = Backbone.View.extend(_.extend({
        options: {
            dynamiccolors: 10,
            standardcolors: 10,
            themecolors: 10,
            effects: 5,
            allowReselect: true,
            transparent: false,
            value: '000000',
            cls: '',
            style: ''
        },

        template: _.template([
            '<% var me = this; %>',
            '<div class="list-block color-palette <%= me.options.cls %>" style="<%= me.options.style %>">',
                '<ul>',
                    '<li class="theme-colors">',
                        '<div style="padding: 15px 0 0 15px;"><%= me.textThemeColors %></div>',
                        '<div class="item-content">',
                            '<div class="item-inner">',
                            '<% _.each(themeColors, function(row) { %>',
                                '<div class="row">',
                                    '<% _.each(row, function(effect) { %>',
                                        '<a data-effectid="<%=effect.effectId%>" data-effectvalue="<%=effect.effectValue%>" data-color="<%=effect.color%>" style="background:#<%=effect.color%>"></a>',
                                    '<% }); %>',
                                '</div>',
                            '<% }); %>',
                            '</div>',
                        '</div>',
                    '</li>',
                    '<li class="standart-colors">',
                        '<div style="padding: 15px 0 0 15px;"><%= me.textStandartColors %></div>',
                        '<div class="item-content">',
                            '<div class="item-inner">',
                                '<% _.each(standartColors, function(color, index) { %>',
                                    '<% if (0 == index && me.options.transparent) { %>',
                                    '<a data-color="transparent" class="transparent"></a>',
                                    '<% } else { %>',
                                    '<a data-color="<%=color%>" style="background:#<%=color%>"></a>',
                                    '<% } %>',
                                '<% }); %>',
                            '</div>',
                        '</div>',
                    '</li>',
                '</ul>',
            '</div>'
        ].join('')),

        // colorRe: /(?:^|\s)color-(.{6})(?:\s|$)/,
        // selectedCls: 'selected',
        //
        initialize : function(options) {
            var me = this,
                el = $(me.el);

            me.options = _({}).extend(me.options, options);
            me.render();

            el.find('.color-palette a').on('click', _.bind(me.onColorClick, me));
        },

        render: function () {
            var me = this,
                themeColors = [],
                row = -1,
                standartColors = Common.Utils.ThemeColor.getStandartColors();

            _.each(Common.Utils.ThemeColor.getEffectColors(), function(effect, index) {
                if (0 == index % me.options.themecolors) {
                    themeColors.push([]);
                    row++
                }
                themeColors[row].push(effect);
            });

            $(me.el).append(me.template({
                themeColors: themeColors,
                standartColors: standartColors
            }));

            return me;
        },

        isColor: function(val) {
            return typeof(val) == 'string' && (/[0-9A-Fa-f]{6}/).test(val);
        },
        isTransparent: function(val) {
            return typeof(val) == 'string' && (val=='transparent');
        },

        isEffect: function(val) {
            return (typeof(val) == 'object' && val.effectId !== undefined);
        },

        onColorClick:function (e) {
            var me = this,
                el = $(me.el),
                $target = $(e.currentTarget);

            el.find('.color-palette a').removeClass('active');
            $target.addClass('active');

            var color = $target.data('color'),
                effectId = $target.data('effectid');

            me.currentColor = color;

            if (effectId) {
                me.currentColor = {color: color, effectId: effectId};
            }

            me.trigger('select', me, me.currentColor);
        },

        select: function(color) {
            var me = this,
                el = $(me.el);

            if (color == me.currentColor) {
                return;
            }

            me.currentColor = color;

            me.clearSelection();

            if (_.isObject(color)) {
                if (! _.isUndefined(color.effectId)) {
                    el.find('a[data-effectid=' + color.effectId + ']').addClass('active');
                } else if (! _.isUndefined(color.effectValue)) {
                    el.find('a[data-effectvalue=' + color.effectValue + '][data-color=' + color.color + ']').addClass('active');
                }
            } else {
                if (/#?[a-fA-F0-9]{6}/.test(color)) {
                    color = /#?([a-fA-F0-9]{6})/.exec(color)[1].toUpperCase();
                }

                if (/^[a-fA-F0-9]{6}|transparent$/.test(color) || _.indexOf(Common.Utils.ThemeColor.getStandartColors(), color) > -1) {
                    el.find('.standart-colors a[data-color=' + color + ']').addClass('active');
                } else {
                    el.find('.custom-colors a[data-color=' + color + ']').addClass('active');
                }
            }
        },


        clearSelection: function() {
            $(this.el).find('.color-palette a').removeClass('active');
        },

        textThemeColors: 'Theme Colors',
        textStandartColors: 'Standart Colors'
    }, Common.UI.ThemeColorPalette || {}));
});