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

    DE.Controllers.Toolbar = Backbone.Controller.extend((function() {
        // private
        var _backUrl;

        return {
            models: [],
            collections: [],
            views: [
                'Toolbar'
            ],

            initialize: function() {
                this.addListeners({
                    'Toolbar': {
                        'searchbar:show'        : this.onSearchbarShow,
                        'searchbar:render'      : this.onSearchbarRender
                    }
                });

                Common.Gateway.on('init', _.bind(this.loadConfig, this));
            },

            loadConfig: function (data) {
                if (data && data.config && data.config.canBackToFolder !== false &&
                    data.config.customization && data.config.customization.goback && data.config.customization.goback.url) {
                    _backUrl = data.config.customization.goback.url;

                    $('#document-back').show().single('click', _.bind(this.onBack, this));
                }
            },

            setApi: function(api) {
                this.api = api;

                this.api.asc_registerCallback('asc_onCanUndo',  _.bind(this.onApiCanRevert, this, 'undo'));
                this.api.asc_registerCallback('asc_onCanRedo',  _.bind(this.onApiCanRevert, this, 'redo'));
            },

            setMode: function (mode) {
                this.getView('Toolbar').setMode(mode);
            },

            onLaunch: function() {
                var me = this;
                me.createView('Toolbar').render();

                $('#toolbar-undo').single('click',  _.bind(me.onUndo, me));
                $('#toolbar-redo').single('click',  _.bind(me.onRedo, me));
            },

            setDocumentTitle: function (title) {
                $('#toolbar-title').html(title);
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

            // Handlers

            onBack: function (e) {
                var me = this;

                if (me.api.isDocumentModified()) {
                    uiApp.modal({
                        title   : me.dlgLeaveTitleText,
                        text    : me.dlgLeaveMsgText,
                        verticalButtons: true,
                        buttons : [
                            {
                                text: me.leaveButtonText,
                                onClick: function() {
                                    window.parent.location.href = _backUrl;
                                }
                            },
                            {
                                text: me.stayButtonText,
                                bold: true
                            }
                        ]
                    });
                } else {
                    window.parent.location.href = _backUrl;
                }
            },

            onUndo: function (e) {
                if (this.api)
                    this.api.Undo();
            },

            onRedo: function (e) {
                if (this.api)
                    this.api.Redo();
            },

            // API handlers

            onApiCanRevert: function(which, can) {
                if (which == 'undo') {
                    $('#toolbar-undo').toggleClass('disabled', !can);
                } else {
                    $('#toolbar-redo').toggleClass('disabled', !can);
                }
            },

            dlgLeaveTitleText   : 'You leave the application',
            dlgLeaveMsgText     : 'You have unsaved changes in this document. Click \'Stay on this Page\' to await the autosave of the document. Click \'Leave this Page\' to discard all the unsaved changes.',
            leaveButtonText     : 'Leave this Page',
            stayButtonText      : 'Stay on this Page',
            textNoTextFound     : 'Text not found',
        }
    })());
});