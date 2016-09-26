/**
 *  Toolbar.js
 *  Toolbar view
 *
 *  Created by Alexander Yuzhin on 9/23/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'text!documenteditor/mobile/app/template/Toolbar.template',
    'jquery',
    'underscore',
    'backbone'
], function (toolbarTemplate, $, _, Backbone) {
    'use strict';

    DE.Views.Toolbar = Backbone.View.extend({
        el: '.view-main',

        // Compile our stats template
        template: _.template(toolbarTemplate),

        // Delegated events for creating new items, and clearing completed ones.
        events: {
            "click .toolbar-search": "searchToggle"
        },

        // Set innerHTML and get the references to the DOM elements
        initialize: function() {
            //
        },

        // Render layout
        render: function() {
            var $el = $(this.el);

            $el.prepend(this.template({
                android: Framework7.prototype.device.android,
                backTitle: Framework7.prototype.device.android ? '' : 'Documents'
            }));

            // Search
            $el.find('.pages .page').prepend(_.template(
                '<form class="searchbar document navbar navbar-hidden">' +
                    '<div class="searchbar-input">' +
                        '<input type="search" placeholder="Search"><a href="#" class="searchbar-clear"></a>' +
                    '</div>' +
                    '<p class="buttons-row">' +
                        '<a href="#" class="button prev button-round disabled">&lt;</a>' +
                        '<a href="#" class="button next button-round disabled">&gt;</a>' +
                    '</p>' +
                '</form>', {}
            ));

            return this;
        },

        // Search
        searchToggle: function() {
            var isSearchShow = $('.searchbar.document').hasClass('navbar-hidden');
            uiApp[isSearchShow ? 'showNavbar' : 'hideNavbar'].call(this, $('.searchbar.document'));

            this.fireEvent('searchbar:show', [this, !isSearchShow]);
        }
    });
});