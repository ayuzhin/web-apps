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

    DE.Views.Toolbar = Backbone.View.extend((function() {
        // private

        return {
            el: '.view-main',

            // Compile our stats template
            template: _.template(toolbarTemplate),

            // Delegated events for creating new items, and clearing completed ones.
            events: {
                "click #toolbar-search"     : "searchToggle",
                "click #toolbar-edit"       : "showEdition",
                "click #toolbar-add"        : "showInserts",
                "click #toolbar-settings"   : "showSettings"
            },

            // Set innerHTML and get the references to the DOM elements
            initialize: function() {
                var me = this;

                Common.NotificationCenter.on('readermode:change', function (reader) {
                    if (reader) {
                        me.hideSearch();
                        $('#toolbar-search').addClass('disabled');
                    } else {
                        $('#toolbar-search').removeClass('disabled');
                    }
                });
            },

            // Render layout
            render: function() {
                var $el = $(this.el);

                $el.prepend(this.template({
                    android     : Common.SharedSettings.get('android'),
                    phone       : Common.SharedSettings.get('phone'),
                    backTitle   : Common.SharedSettings.get('android') ? '' : 'Back'
                }));

                return this;
            },

            setMode: function (mode) {
                var isEdit = (mode === 'edit');

                if (isEdit) {
                    $('#toolbar-edit, #toolbar-add, #toolbar-undo, #toolbar-redo').show();
                }
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
                                '<a href="#" class="link icon-only prev disabled"><i class="icon icon-prev"></i></a>' +
                                '<a href="#" class="link icon-only next disabled"><i class="icon icon-next"></i></a>' +
                            '</p>' +
                        '</form>', {}
                    ));
                    me.fireEvent('searchbar:render', me);

                    searchBar = $$('.searchbar.document');

                    if (Common.SharedSettings.get('android')) {
                        searchBar.find('.buttons-row').css('margin-left', '10px');
                        searchBar.find('.buttons-row a').css('min-width', '0px');
                    } else {
                        searchBar.find('.buttons-row .next').css('margin-left', '10px');
                    }

                    _.defer(function() {
                        uiApp.showNavbar(searchBar);

                        searchBar.transitionEnd(function () {
                            if (!searchBar.hasClass('navbar-hidden')) {
                                me.fireEvent('searchbar:show', me);
                                $('.searchbar input').focus();
                            }
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

                    _.defer(function() {
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

            // Inserts

            showInserts: function () {
                DE.getController('AddContainer').showModal();
            },

            // Settings
            showSettings: function () {
                DE.getController('Settings').showModal();
            }
        }
    })());
});
