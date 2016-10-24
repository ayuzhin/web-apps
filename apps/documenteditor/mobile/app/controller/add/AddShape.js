/**
 *  AddShape.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/18/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/add/AddShape'
], function (core) {
    'use strict';

    DE.Controllers.AddShape = Backbone.Controller.extend((function() {
        var _styles = [];

        return {
            models: [],
            collections: [],
            views: [
                'AddShape'
            ],

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));

                // Fill shapes

                function randomColor() {
                    return '#' + Math.floor(Math.random()*16777215).toString(16);
                }

                _styles = [
                    {
                        title: 'Text',
                        thumb: 'shape-01.svg',
                        type: 'textRect'
                    },
                    {
                        title: 'Line',
                        thumb: 'shape-02.svg',
                        type: 'line'
                    },
                    {
                        title: 'Line with arrow',
                        thumb: 'shape-03.svg',
                        type: 'lineWithArrow'
                    },
                    {
                        title: 'Line with two arrows',
                        thumb: 'shape-04.svg',
                        type: 'lineWithTwoArrows'
                    },
                    {
                        title: 'Rect',
                        thumb: 'shape-05.svg',
                        type: 'rect'
                    },
                    {
                        title: 'Hexagon',
                        thumb: 'shape-06.svg',
                        type: 'hexagon'
                    },
                    {
                        title: 'Round rect',
                        thumb: 'shape-07.svg',
                        type: 'roundRect'
                    },
                    {
                        title: 'Ellipse',
                        thumb: 'shape-08.svg',
                        type: 'ellipse'
                    },
                    {
                        title: 'Triangle',
                        thumb: 'shape-09.svg',
                        type: 'triangle'
                    },
                    {
                        title: 'Triangle',
                        thumb: 'shape-10.svg',
                        type: 'rtTriangle'
                    },
                    {
                        title: 'Trapezoid',
                        thumb: 'shape-11.svg',
                        type: 'trapezoid'
                    },
                    {
                        title: 'Diamond',
                        thumb: 'shape-12.svg',
                        type: 'diamond'
                    },
                    {
                        title: 'Right arrow',
                        thumb: 'shape-13.svg',
                        type: 'rightArrow'
                    },
                    {
                        title: 'Left-right arrow',
                        thumb: 'shape-14.svg',
                        type: 'leftRightArrow'
                    },
                    {
                        title: 'Left arrow callout',
                        thumb: 'shape-15.svg',
                        type: 'leftArrowCallout'
                    },
                    {
                        title: 'Right arrow callout',
                        thumb: 'shape-16.svg',
                        type: 'rightArrowCallout'
                    },
                    {
                        title: 'Flow chart off page connector',
                        thumb: 'shape-17.svg',
                        type: 'flowChartOffpageConnector'
                    },
                    {
                        title: 'Heart',
                        thumb: 'shape-18.svg',
                        type: 'heart'
                    },
                    {
                        title: 'Math minus',
                        thumb: 'shape-19.svg',
                        type: 'mathMinus'
                    },
                    {
                        title: 'Math plus',
                        thumb: 'shape-20.svg',
                        type: 'mathPlus'
                    },
                    {
                        title: 'Parallelogram',
                        thumb: 'shape-21.svg',
                        type: 'parallelogram'
                    },
                    {
                        title: 'Wedge rect callout',
                        thumb: 'shape-22.svg',
                        type: 'wedgeRectCallout'
                    },
                    {
                        title: 'Wedge ellipse callout',
                        thumb: 'shape-23.svg',
                        type: 'wedgeEllipseCallout'
                    },
                    {
                        title: 'Cloud callout',
                        thumb: 'shape-24.svg',
                        type: 'cloudCallout'
                    }
                ];

                Common.SharedSettings.set('shapes', _styles);
                Common.NotificationCenter.trigger('shapes:load', _styles);
            },

            setApi: function (api) {
                this.api = api;
            },

            onLaunch: function () {
                this.createView('AddShape').render();
            },

            initEvents: function () {
                var me = this;

                $('#add-shape li').single('click',  _.buffered(me.onShapeClick, 100, me));
            },

            onShapeClick: function (e) {
                var me = this,
                    $target = $(e.currentTarget);

                if ($target && me.api) {
                    me.api.AddShapeOnCurrentPage($target.data('type'));
                }

                DE.getController('AddContainer').hideModal();
            },

            // Public

            getStyles: function () {
                return _styles;
            }
        }
    })());
});