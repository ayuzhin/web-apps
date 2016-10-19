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
                        thumb: '',
                        color: randomColor(),
                        type: 'textRect'
                    },
                    {
                        title: 'Line',
                        thumb: '',
                        color: randomColor(),
                        type: 'line'
                    },
                    {
                        title: 'Line with arrow',
                        thumb: '',
                        color: randomColor(),
                        type: 'lineWithArrow'
                    },
                    {
                        title: 'Line with two arrows',
                        thumb: '',
                        color: randomColor(),
                        type: 'lineWithTwoArrows'
                    },
                    {
                        title: 'Rect',
                        thumb: '',
                        color: randomColor(),
                        type: 'rect'
                    },
                    {
                        title: 'Hexagon',
                        thumb: '',
                        color: randomColor(),
                        type: 'hexagon'
                    },
                    {
                        title: 'Round rect',
                        thumb: '',
                        color: randomColor(),
                        type: 'roundRect'
                    },
                    {
                        title: 'Ellipse',
                        thumb: '',
                        color: randomColor(),
                        type: 'ellipse'
                    },
                    {
                        title: 'Triangle',
                        thumb: '',
                        color: randomColor(),
                        type: 'triangle'
                    },
                    {
                        title: 'Triangle',
                        thumb: '',
                        color: randomColor(),
                        type: 'rtTriangle'
                    },
                    {
                        title: 'Trapezoid',
                        thumb: '',
                        color: randomColor(),
                        type: 'trapezoid'
                    },
                    {
                        title: 'Diamond',
                        thumb: '',
                        color: randomColor(),
                        type: 'diamond'
                    },
                    {
                        title: 'Right arrow',
                        thumb: '',
                        color: randomColor(),
                        type: 'rightArrow'
                    },
                    {
                        title: 'Left-right arrow',
                        thumb: '',
                        color: randomColor(),
                        type: 'leftRightArrow'
                    },
                    {
                        title: 'Left arrow callout',
                        thumb: '',
                        color: randomColor(),
                        type: 'leftArrowCallout'
                    },
                    {
                        title: 'Right arrow callout',
                        thumb: '',
                        color: randomColor(),
                        type: 'rightArrowCallout'
                    },
                    {
                        title: 'Flow chart off page connector',
                        thumb: '',
                        color: randomColor(),
                        type: 'flowChartOffpageConnector'
                    },
                    {
                        title: 'Heart',
                        thumb: '',
                        color: randomColor(),
                        type: 'heart'
                    },
                    {
                        title: 'Math minus',
                        thumb: '',
                        color: randomColor(),
                        type: 'mathMinus'
                    },
                    {
                        title: 'Math plus',
                        thumb: '',
                        color: randomColor(),
                        type: 'mathPlus'
                    },
                    {
                        title: 'Parallelogram',
                        thumb: '',
                        color: randomColor(),
                        type: 'parallelogram'
                    },
                    {
                        title: 'Wedge rect callout',
                        thumb: '',
                        color: randomColor(),
                        type: 'wedgeRectCallout'
                    },
                    {
                        title: 'Wedge ellipse callout',
                        thumb: '',
                        color: randomColor(),
                        type: 'wedgeEllipseCallout'
                    },
                    {
                        title: 'Cloud callout',
                        thumb: '',
                        color: randomColor(),
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