/**
 *  EditContainer.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/27/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */
define([
    'core'
], function (core) {
    'use strict';

    DE.Controllers.EditContainer = Backbone.Controller.extend((function() {
        // Private
        var _settings = [];

        return {
            models: [],
            collections: [],
            views: [],

            initialize: function() {
                //
            },

            setApi: function(api) {
                this.api = api;
                this.api.asc_registerCallback('asc_onFocusObject',        _.bind(this.onApiFocusObject, this));
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

                me._showByStack(Common.SharedSettings.get('phone'));

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
                var editors = [];

                if (_settings.length < 0) {
                    editors.push(this._emptyEditController());
                } else {
                    if (_.contains(_settings, 'text')) {
                        editors.push({
                            caption: 'Text',
                            id: 'edit-text',
                            layout: DE.getController('EditText')
                                .getView('EditText')
                                .rootLayout()
                        })
                    }
                    if (_.contains(_settings, 'paragraph')) {
                        editors.push({
                            caption: 'Paragraph',
                            id: 'edit-paragraph',
                            layout: DE.getController('EditParagraph')
                                .getView('EditParagraph')
                                .rootLayout()
                        })
                    }
                    if (_.contains(_settings, 'table')) {
                        editors.push({
                            caption: 'Table',
                            id: 'edit-table',
                            layout: DE.getController('EditTable')
                                .getView('EditTable')
                                .rootLayout()
                        })
                    }
                    if (_.contains(_settings, 'shape')) {
                        editors.push({
                            caption: 'Shape',
                            id: 'edit-shape',
                            layout: DE.getController('EditShape')
                                .getView('EditShape')
                                .rootLayout()
                        })
                    }
                    if (_.contains(_settings, 'image')) {
                        editors.push({
                            caption: 'Image',
                            id: 'edit-image',
                            layout: DE.getController('EditImage')
                                .getView('EditImage')
                                .rootLayout()
                        })
                    }
                    if (_.contains(_settings, 'chart')) {
                        editors.push({
                            caption: 'Chart',
                            id: 'edit-chart',
                            layout: DE.getController('EditChart')
                                .getView('EditChart')
                                .rootLayout()
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
                            (isPhone ? '<div class="right sliding"><a href="#" class="link icon-only close-picker"><i class="icon icon-expand-down"></i></a></div>' : '') +
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
                        $$('#toolbar-edit')
                    );

                    // Prevent hide overlay. Conflict popover and modals.
                    var $overlay = $('.modal-overlay');

                    $$(me.picker).on('opened', function () {
                        $overlay.on('removeClass', function () {
                            if (!$overlay.hasClass('modal-overlay-visible')) {
                                $overlay.addClass('modal-overlay-visible')
                            }
                        });
                    }).on('close', function () {
                        $overlay.off('removeClass');
                        $overlay.removeClass('modal-overlay-visible')
                    });
                }

                $('.container-edit .tab').single('show', function (e) {
                    Common.NotificationCenter.trigger('editcategory:show', e);
                });

                if (isAndroid) {
                    $$('.view.edit-root-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                    $$('.view.edit-root-view .navbar').prependTo('.view.edit-root-view > .pages > .page');
                }

                me.rootView = uiApp.addView('.edit-root-view', {
                    dynamicNavbar: true,
                    domCache: true
                });

                Common.NotificationCenter.trigger('editcontainer:show');
            },

            // API handlers

            onApiFocusObject: function (objects) {
                _settings = [];

                // Paragraph  : 0,
                // Table      : 1,
                // Image      : 2,
                // Header     : 3,
                // Shape      : 4,
                // Slide      : 5,
                // Chart      : 6,
                // MailMerge  : 7,
                // TextArt    : 8

                _.each(objects, function(object) {
                    if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Paragraph) {
                        _settings.push('text', 'paragraph');
                    } else if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Table) {
                        _settings.push('table');
                    } else if (object.get_ObjectType() == Asc.c_oAscTypeSelectElement.Image) {
                        if (object.get_ObjectValue().get_ChartProperties()) {
                            _settings.push('chart');
                        } else if (object.get_ObjectValue().get_ShapeProperties()) {
                            _settings.push('shape');
                        } else {
                            _settings.push('image');
                        }
                    }
                });

                // Exclude shapes if chart exist
                if (_settings.indexOf('chart') > -1) {
                    _settings = _.without(_settings, 'shape');
                }

                _settings = _.uniq(_settings);
            }
        }
    })());
});