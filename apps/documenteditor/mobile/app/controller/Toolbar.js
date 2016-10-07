/**
 *  Toolbar.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/23/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/Toolbar'
], function (core) {
    'use strict';

    DE.Controllers.Toolbar = Backbone.Controller.extend({
        models: [],
        collections: [],
        views: [
            'Toolbar'
        ],

        initialize: function() {
            this.addListeners({
                'Toolbar': {
                    'searchbar:show'    : this.onSearchbarShow,
                    'searchbar:render'  : this.onSearchbarRender
                }
            });
        },

        setApi: function(api) {
            this.api = api;
        },

        onLaunch: function() {
            this.createView('Toolbar').render();
        },


        // Search

        onSearchbarRender: function(bar) {
            var me = this;
            me.searchBar = uiApp.searchbar('.searchbar.document', {
                customSearch: true,
                onSearch    : _.bind(me.onSearchChange, me),
                onEnable    : _.bind(me.onSearchEnable, me),
                onDisable   : _.bind(me.onSearchDisable, me),
                onClear     : _.bind(me.onSearchClear, me)
            });

            me.searchPrev = $('.searchbar.document .prev');
            me.searchNext = $('.searchbar.document .next');

            me.searchPrev.on('click', _.bind(me.onSearchPrev, me));
            me.searchNext.on('click', _.bind(me.onSearchNext, me));
        },

        onSearchbarShow: function(bar) {
            //
        },

        onSearchChange: function(search) {
            var me = this,
                isEmpty = (search.query.trim().length < 1);

            _.each([me.searchPrev, me.searchNext], function(btn) {
                btn[isEmpty ? 'addClass' : 'removeClass']('disabled');
            });
        },

        onSearchEnable: function(search) {
            //
        },

        onSearchDisable: function(search) {
            //
        },

        onSearchClear: function(search) {
//            window.focus();
//            document.activeElement.blur();
        },

        onSearchPrev: function(btn) {
            this.onQuerySearch(this.searchBar.query, 'back');
        },

        onSearchNext: function(btn) {
            this.onQuerySearch(this.searchBar.query, 'next');
        },

        onQuerySearch: function(query, direction, opts) {
            if (query && query.length) {
                if (!this.api.asc_findText(query, direction != 'back', opts && opts.matchcase, opts && opts.matchword)) {
                    var me = this;
                    uiApp.alert(
                        '',
                        me.textNoTextFound,
                        function () {
                            me.searchBar.input.focus();
                        }
                    );
                }
            }
        },

        textNoTextFound         : 'Text not found'
    });
});
