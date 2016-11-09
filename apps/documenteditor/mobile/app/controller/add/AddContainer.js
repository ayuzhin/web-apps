/**
 *  AddContainer.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/14/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core'
], function (core) {
    'use strict';

    DE.Controllers.AddContainer = Backbone.Controller.extend((function() {
        // private

        return {
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

                if ($$('.container-add.modal-in').length > 0) {
                    return;
                }

                uiApp.closeModal();

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
                            '<p>Implement add view!!!!</p>' +
                        '</div>' +
                    '</div>';

                return {
                    caption: 'Dummy',
                    layout: layout
                }
            },

            _layoutEditorsByStack: function () {
                var addViews = [];

                addViews.push({
                    caption: 'Table',
                    id: 'add-table',
                    layout: DE.getController('AddTable')
                        .getView('AddTable')
                        .rootLayout()
                });

                addViews.push({
                    caption: 'Shape',
                    id: 'add-shape',
                    layout: DE.getController('AddShape')
                        .getView('AddShape')
                        .rootLayout()
                });

                addViews.push({
                    caption: 'Image',
                    id: 'add-image',
                    layout: DE.getController('AddImage')
                        .getView('AddImage')
                        .rootLayout()
                });

                addViews.push({
                    caption: 'Other',
                    id: 'add-other',
                    layout: DE.getController('AddOther')
                        .getView('AddOther')
                        .rootLayout()
                });

                return addViews;
            },

            _showByStack: function(isPhone) {
                var me = this,
                    mainView = DE.getController('Editor').getView('Editor').f7View,
                    isAndroid = Framework7.prototype.device.android === true,
                    layoutAdds = me._layoutEditorsByStack();

                if ($$('.container-add.modal-in').length > 0) {
                    return;
                }

                // Navigation bar
                var $layoutNavbar = $(
                    '<div class="navbar">' +
                        '<div data-page="index" class="navbar-inner">' +
                            '<div class="center sliding categories"></div>' +
                            (isPhone ? '<div class="right sliding"><a href="#" class="link icon-only close-popup"><i class="icon icon-expand-down"></i></a></div>' : '') +
                        '</div>' +
                    '</div>'
                );


                if (isAndroid) {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="toolbar tabbar"><div data-page="index" class="toolbar-inner"></div></div>');

                    _.each(layoutAdds, function (layout, index) {
                        $layoutNavbar
                            .find('.toolbar-inner')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
                    $layoutNavbar
                        .find('.toolbar-inner')
                        .append('<span class="tab-link-highlight" style="width: ' + (100/layoutAdds.length) + '%;"></span>');
                } else {
                    $layoutNavbar
                        .find('.center')
                        .append('<div class="buttons-row"></div>');

                    _.each(layoutAdds, function (layout, index) {
                        $layoutNavbar
                            .find('.buttons-row')
                            .append(
                                '<a href="#' + layout.id + '" class="tab-link button ' + (index < 1 ? 'active' : '') + '">' + layout.caption + '</a>'
                            );
                    });
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

                _.each(layoutAdds, function (addView, index) {
                    $layoutPages.find('.tabs').append(
                        '<div id="' + addView.id + '" class="tab view ' + (index < 1 ? 'active' : '') + '">' +
                            '<div class="pages">' +
                                '<div class="page no-navbar">' +
                                    '<div class="page-content">' +
                                        addView.layout +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                });

                if (isPhone) {
                    me.picker = $$(uiApp.popup(
                        '<div class="popup container-add">' +
                            '<div class="view add-root-view navbar-through">' +
                                $layoutNavbar.prop('outerHTML') +
                                $layoutPages.prop('outerHTML') +
                            '</div>' +
                        '</div>'
                    ))
                } else {
                    me.picker = uiApp.popover(
                        '<div class="popover container-add">' +
                            '<div class="popover-angle"></div>' +
                            '<div class="popover-inner">' +
                                '<div class="content-block">' +
                                    '<div class="view popover-view add-root-view navbar-through">' +
                                        $layoutNavbar.prop('outerHTML') +
                                        $layoutPages.prop('outerHTML') +
                                    '</div>' +
                                '</div>' +
                            '</div>',
                        $$('#toolbar-add')
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

                if (isAndroid) {
                    $$('.view.add-root-view.navbar-through').removeClass('navbar-through').addClass('navbar-fixed');
                    $$('.view.add-root-view .navbar').prependTo('.view.add-root-view > .pages > .page');
                }

                me.rootView = uiApp.addView('.add-root-view', {
                    dynamicNavbar: true
                });

                Common.NotificationCenter.trigger('addcontainer:show');
            }
        }
    })());
});