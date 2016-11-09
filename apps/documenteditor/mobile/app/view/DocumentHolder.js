/**
 *  DocumentHolder.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/8/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {
    'use strict';

    DE.Views.DocumentHolder = Backbone.View.extend((function() {
        // private
        var _anchorId = 'context-menu-target';

        return {
            el: '#editor_sdk',

            template: _.template('<div id="' + _anchorId + '" style="position: absolute;"></div>'),
            // Delegated events for creating new items, and clearing completed ones.
            events: {
            },

            // Set innerHTML and get the references to the DOM elements
            initialize: function() {
                //
            },

            // Render layout
            render: function() {
                var el = $(this.el);

                el.append(this.template({
                    //
                }));

                // this.f7View = uiApp.addView('.view-main', {
                //     // params
                // });

                return this;
            },

            showMenu: function (items, posX, posY) {
                if (items.length < 1) {
                    return;
                }

                var menuItemTemplate = _.template([
                    '<% _.each(menuItems, function(item) { %>',
                    '<li data-event="<%= item.event %>"><a href="#" class="item-link list-button"><%= item.caption %></li>',
                    '<% }); %>'
                ].join(''));

                $('#' + _anchorId)
                    .css('left', posX)
                    .css('top', posY);

                uiApp.closeModal('.document-menu.modal-in');

                var popoverHTML =
                    '<div class="popover document-menu">'+
                        '<div class="popover-inner">'+
                            '<div class="list-block">'+
                                '<ul>'+
                                    menuItemTemplate({menuItems: items}) +
                                '</ul>'+
                            '</div>'+
                        '</div>'+
                    '</div>';
                uiApp.popover(popoverHTML, $('#' + _anchorId));

                $('.modal-overlay').removeClass('modal-overlay-visible');

                $('.document-menu li').single('click', _.buffered(function(e) {
                    var $target = $(e.currentTarget),
                        eventName = $target.data('event');

                    this.fireEvent('contextmenu:click', [this, eventName]);
                }, 100, this));

                // console.log('Show menu at position:', posX, posY);
            },

            hideMenu: function () {
                $('#' + _anchorId)
                    .css('left', -1000)
                    .css('top', -1000);

                uiApp.closeModal('.document-menu.modal-in');
            }
        }
    })());
});