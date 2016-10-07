/**
 *  Settings.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/7/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/Settings'
], function (core) {
    'use strict';

    DE.Controllers.Settings = Backbone.Controller.extend((function() {
        // private
        var rootView,
            inProgress,
            infoObj;

        return {
            models: [],
            collections: [],
            views: [
                'Settings'
            ],

            initialize: function () {
                Common.NotificationCenter.on('settingscontainer:show', _.bind(this.initEvents, this));
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                me.api.asc_registerCallback('asc_onGetDocInfoStart',    _.bind(me._onApiGetDocInfoStart, me));
                me.api.asc_registerCallback('asc_onGetDocInfoStop',     _.bind(me._onApiGetDocInfoEnd, me));
                me.api.asc_registerCallback('asc_onDocInfo',            _.bind(me._onApiDocInfo, me));
                me.api.asc_registerCallback('asc_onGetDocInfoEnd',      _.bind(me._onApiGetDocInfoEnd, me));
                me.api.asc_registerCallback('asc_onDocumentName',       _.bind(me._onApiDocumentName, me));
            },

            onLaunch: function () {
                this.createView('Settings').render();
            },

            setMode: function (mode) {
                this.getView('Settings').setMode(mode);
            },

            initEvents: function () {
                var me = this;
                // $('#font-bold').single('click',             _.bind(me.onBold, me));
                // $('#font-italic').single('click',           _.bind(me.onItalic, me));
                // $('#font-underline').single('click',        _.bind(me.onUnderline, me));
                // $('#font-strikethrough').single('click',    _.bind(me.onStrikethrough, me));
            },

            rootView : function() {
                return rootView;
            },

            showModal: function() {
                if (Common.SharedSettings.get('phone')) {
                    uiApp.popup(
                        '<div class="popup container-settings">' +
                            '<div class="content-block">' +
                                '<div class="view settings-root-view navbar-through">' +
                                    this.getView('Settings').rootLayout() +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                } else {
                    uiApp.popover(
                        '<div class="popover container-settings">' +
                            '<div class="popover-angle"></div>' +
                            '<div class="popover-inner">' +
                                '<div class="content-block">' +
                                    '<div class="view popover-view settings-root-view navbar-through">' +
                                        this.getView('Settings').rootLayout() +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>',
                        $$('#toolbar-settings')
                    );
                }

                if (Framework7.prototype.device.android === true) {
                    $$('.view.settings-root-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                    $$('.view.settings-root-view .navbar').prependTo('.view.settings-root-view > .pages > .page');
                }

                rootView = uiApp.addView('.settings-root-view', {
                    dynamicNavbar: true
                });

                Common.NotificationCenter.trigger('settingscontainer:show');
            },

            // API handlers

            _onApiGetDocInfoStart: function () {
                var me = this;
                inProgress = true;
                infoObj = {
                    PageCount       : 0,
                    WordsCount      : 0,
                    ParagraphCount  : 0,
                    SymbolsCount    : 0,
                    SymbolsWSCount  : 0
                };

                _.defer(function(){
                    if (!inProgress)
                        return;

                    $('#statistic-pages').html(me.txtLoading);
                    $('#statistic-words').html(me.txtLoading);
                    $('#statistic-paragraphs').html(me.txtLoading);
                    $('#statistic-symbols').html(me.txtLoading);
                    $('#statistic-spaces').html(me.txtLoading);
                }, 2000);
            },

            _onApiGetDocInfoEnd: function() {
                inProgress = false;

                $('#statistic-pages').html(infoObj.PageCount);
                $('#statistic-words').html(infoObj.WordsCount);
                $('#statistic-paragraphs').html(infoObj.ParagraphCount);
                $('#statistic-symbols').html(infoObj.SymbolsCount);
                $('#statistic-spaces').html(infoObj.SymbolsWSCount);
            },

            _onApiDocInfo: function(obj) {
                if (obj) {
                    if (obj.get_PageCount() > -1)
                        infoObj.PageCount = obj.get_PageCount();
                    if (obj.get_WordsCount() > -1)
                        infoObj.WordsCount = obj.get_WordsCount();
                    if (obj.get_ParagraphCount() > -1)
                        infoObj.ParagraphCount = obj.get_ParagraphCount();
                    if (obj.get_SymbolsCount() > -1)
                        infoObj.SymbolsCount = obj.get_SymbolsCount();
                    if (obj.get_SymbolsWSCount() > -1)
                        infoObj.SymbolsWSCount = obj.get_SymbolsWSCount();
                }
            },

            _onApiDocumentName: function(name) {
                $('#settings-document-title').html(name ? name : '-');
            },

            txtLoading: 'Loading...'
        }
    })());
});
