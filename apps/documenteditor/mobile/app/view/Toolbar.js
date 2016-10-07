/**
 *  Toolbar.js
 *  Document Editor
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
            "click #toolbar-search"     : "searchToggle",
            "click #toolbar-edit"       : "showEdition",
            "click #toolbar-settings"   : "showSettings"
        },

        // Set innerHTML and get the references to the DOM elements
        initialize: function() {
            //
        },

        // Render layout
        render: function() {
            var $el = $(this.el);

            $el.prepend(this.template({
                android     : Common.SharedSettings.get('android'),
                backTitle   : Common.SharedSettings.get('android') ? '' : 'Back',
                phone       : Common.SharedSettings.get('phone')
            }));

            return this;
        },

        // Search
        searchToggle: function() {
            if ($$('.searchbar.document').length > 0) {
                this.hideSearch();
            } else {
                this.showSearch();
            }
        },

        showSearch: function () {
            var me = this,
                searchBar = $$('.searchbar.document');

            if (searchBar.length < 1) {
                $(me.el).find('.pages .page').first().prepend(_.template(
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
                me.fireEvent('searchbar:render', me);
                searchBar = $$('.searchbar.document');

                setTimeout(function() {
                    uiApp.showNavbar(searchBar);

                    searchBar.transitionEnd(function () {
                        if (!searchBar.hasClass('navbar-hidden'))
                            me.fireEvent('searchbar:show', me);
                    });
                }, 10);
            }
        },

        hideSearch: function () {
            var me = this,
                searchBar = $$('.searchbar.document');

            if (searchBar.length > 0) {
                // Animating
                if (searchBar.hasClass('.navbar-hidding')) {
                    return;
                }

                setTimeout(function() {
                    searchBar.transitionEnd(function () {
                        me.fireEvent('searchbar:hide', me);
                        searchBar.remove();
                    });

                    uiApp.hideNavbar(searchBar);
                }, 10);
            }
        },

        // Editor
        showEdition: function () {
            DE.getController('EditContainer').showModal();
        },

        // Settings
        showSettings: function () {
            DE.getController('Settings').showModal();
        }
    });
});