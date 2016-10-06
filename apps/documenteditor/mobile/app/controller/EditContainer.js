/**
 *  EditContainer.js
 *
 *  Created by Alexander Yuzhin on 9/27/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */
define([
    'core'
], function (core) {
    'use strict';

    DE.Controllers.EditContainer = Backbone.Controller.extend({
        models: [],
        collections: [],
        views: [],

        initialize: function() {
            //
        },

        setApi: function(api) {
            this.api = api;
        },

        onLaunch: function() {
            //
        },

        showModal: function() {
            var me = this,
                mainView = DE.getController('Editor').getView('Editor').f7View,
                isAndroid = Framework7.prototype.device.android === true;

            if ($$('.container-edit.modal-in').length > 0) {
                // myApp.closeModal('.picker-modal.edit.modal-in');
                // me.fireEvent('editcontainer:error', [this, 'alreadyOpen']);
                return;
            }

            var isPhone = false;

            me._showByStack(isPhone);

            DE.getController('Toolbar').getView('Toolbar').hideSearch();
        },
        
        hideModal: function () {
            if (this.picker) {
                uiApp.closeModal(this.picker);
            }
        },

        _dummyEditController: function () {
            var layout =
                '<div class="content-block inset">' +
                    '<div class="content-block-inner"> ' +
                        '<p>Implement settings!!!!</p>' +
                    '</div>' +
                '</div>';

            return {
                caption: 'Dummy',
                layout: layout
            }
        },

        _emptyEditController: function () {
            var layout =
                '<div class="content-block inset">' +
                    '<div class="content-block-inner"> ' +
                        '<p>Select object to edit</p>' +
                    '</div>' +
                '</div>';

            return {
                caption: 'Settings',
                layout: layout
            }
        },

        _layoutEditorsByStack: function () {
            var stack = [
                'text',
                'paragraph'
            ];

            var editors = [];

            if (stack.length < 0) {
                editors.push(this._emptyEditController());
            } else {
                if (_.contains(stack, 'text')) {
                    editors.push({
                        caption: 'Text',
                        id: 'edit-text',
                        layout: DE.getController('EditText').getView('EditText').rootLayout()
                    })
                }
                if (_.contains(stack, 'paragraph')) {
                    editors.push({
                        caption: 'Paragraph',
                        id: 'edit-paragraph',
                        layout: this._dummyEditController().layout
                    })
                }
            }

            return editors;
        },

        _showByStack: function(isPhone) {
            var me = this,
                mainView = DE.getController('Editor').getView('Editor').f7View,
                isAndroid = Framework7.prototype.device.android === true,
                layoutEditors = me._layoutEditorsByStack();

            if ($$('.container-edit.modal-in').length > 0) {
                return;
            }

            // Navigation bar
            var $layoutNavbar = $(
                '<div class="navbar">' +
                    '<div data-page="index" class="navbar-inner">' +
                        '<div class="center sliding categories"></div>' +
                        (isPhone ? '<div class="right sliding"><a href="#" class="link close-picker">Done</a></div>' : '') +
                    '</div>' +
                '</div>'
            );

            if (layoutEditors.length < 2) {
                $layoutNavbar
                    .find('.center')
                    .removeClass('categories')
                    .html(layoutEditors[0].caption);
            } else {
                if (isAndroid) {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="toolbar tabbar"><div data-page="index" class="toolbar-inner"></div></div>');

                    _.each(layoutEditors, function (layout, index) {
                        $layoutNavbar
                            .find('.toolbar-inner')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
                    $layoutNavbar
                        .find('.toolbar-inner')
                        .append('<span class="tab-link-highlight" style="width: ' + (100/layoutEditors.length) + '%;"></span>');
                } else {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="buttons-row"></div>');

                    _.each(layoutEditors, function (layout, index) {
                        $layoutNavbar
                            .find('.buttons-row')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link button ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
                }
            }


            // Content

            var $layoutPages = $(
                '<div class="pages">' +
                    '<div class="page" data-page="index">' +
                        '<div class="page-content">' +
                            '<div class="tabs-animated-wrap">' +
                                '<div class="tabs"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>'
            );

            _.each(layoutEditors, function (editor, index) {
                $layoutPages.find('.tabs').append(
                    '<div id="' + editor.id + '" class="tab view ' + (index < 1 ? 'active' : '') + '">' +
                        '<div class="pages">' +
                            '<div class="page no-navbar">' +
                                '<div class="page-content">' +
                                    editor.layout +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            });

            if (isPhone) {
                me.picker = $$(uiApp.pickerModal(
                    '<div class="picker-modal container-edit">' +
                        '<div class="view edit-root-view navbar-through">' +
                            $layoutNavbar.prop('outerHTML') +
                            $layoutPages.prop('outerHTML') +
                        '</div>' +
                    '</div>'
                )).on('close', function (e) {
                    mainView.showNavbar();
                });
                mainView.hideNavbar();
            } else {
                me.picker = uiApp.popover(
                    '<div class="popover container-edit">' +
                        '<div class="popover-angle"></div>' +
                        '<div class="popover-inner">' +
                            '<div class="content-block">' +
                            '<div class="view popover-view edit-root-view navbar-through">' +
                                $layoutNavbar.prop('outerHTML') +
                                $layoutPages.prop('outerHTML') +
                            '</div>' +
                        '</div>' +
                    '</div>',
                    $$('.toolbar-edit')
                );
            }

            if (isAndroid) {
                $$('.view.edit-root-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                $$('.view.edit-root-view .navbar').prependTo('.view.edit-root-view > .pages > .page');
            }

            me.rootView = uiApp.addView('.edit-root-view', {
                 dynamicNavbar: true
            });

            Common.NotificationCenter.trigger('editcontainer:show');
        }


    });
});