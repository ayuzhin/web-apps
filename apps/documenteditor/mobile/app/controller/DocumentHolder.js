/**
 *  DocumentHolder.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 11/8/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/DocumentHolder'
], function (core) {
    'use strict';

    DE.Controllers.DocumentHolder = Backbone.Controller.extend((function() {
        // private
        var _isEdit = false;

        return {
            models: [],
            collections: [],
            views: [
                'DocumentHolder'
            ],

            initialize: function() {
                this.addListeners({
                    'DocumentHolder': {
                        'contextmenu:click' : this.onContextMenuClick
                    }
                });
            },

            setApi: function(api) {
                this.api = api;

                this.api.asc_registerCallback('asc_onShowPopMenu',      _.bind(this.onApiShowPopMenu, this));
                this.api.asc_registerCallback('asc_onHidePopMenu',      _.bind(this.onApiHidePopMenu, this));
                this.api.asc_registerCallback('asc_onFocusObject',      _.bind(this.onApiFocusObject, this));
            },

            setMode: function (mode) {
                _isEdit = ('edit' === mode);
            },

            // When our application is ready, lets get started
            onLaunch: function() {
                var me = this;

                me.view = me.createView('DocumentHolder').render();

                $$(window).on('resize', _.bind(me.onEditorResize, me));
            },

            // Handlers

            onContextMenuClick: function (view, eventName) {
                var me = this;

                if ('cut' == eventName) {
                    me.api.Cut();
                } else if ('copy' == eventName) {
                    me.api.Copy();
                } else if ('paste' == eventName) {
                    me.api.Paste();
                } else if ('delete' == eventName) {
                    console.debug('IMPLEMENT: Delete fragment');
                } else if ('edit' == eventName) {
                    me.view.hideMenu();

                    DE.getController('EditContainer').showModal();
                } else if ('addlink' == eventName) {
                    me.view.hideMenu();

                    DE.getController('AddContainer').showModal();
                    DE.getController('AddOther').getView('AddOther').showLink();
                }

                me.view.hideMenu();
            },

            // API Handlers

            onEditorResize: function(cmp) {
                // Hide context menu
            },

            onApiShowPopMenu: function(posX, posY) {
                var me = this,
                    items = me._initMenu(me.api.getSelectedElements());

                me.view.showMenu(items, posX, posY);
            },

            onApiHidePopMenu: function() {
                this.view.hideMenu();
            },

            onApiFocusObject: function (objects) {
                //
            },

            // Internal

            _initMenu: function (stack) {
                var me = this,
                    menuItems = [],
                    canCopy = me.api.can_CopyCut();

                if (canCopy) {
                    menuItems.push({
                        caption: 'Copy',
                        event: 'copy'
                    });
                }

                if (stack.length > 0) {
                    var topObject = stack[stack.length - 1],
                        topObjectType = topObject.get_ObjectType(),
                        topObjectValue = topObject.get_ObjectValue(),
                        objectLocked = _.isFunction(topObjectValue.get_Locked) ? topObjectValue.get_Locked() : false;

                    var swapItems = function(items, indexBefore, indexAfter) {
                        items[indexAfter] = items.splice(indexBefore, 1, items[indexAfter])[0];
                    };

                    if (!objectLocked && _isEdit) {
                        menuItems.push({
                            caption: 'Cut',
                            event: 'cut'
                        });
                        menuItems.push({
                            caption: 'Paste',
                            event: 'paste'
                        });

                        // Swap 'Copy' and 'Cut'
                        swapItems(menuItems, 0, 1);

                        menuItems.push({
                            caption: 'Delete',
                            event: 'delete'
                        });

                        menuItems.push({
                            caption: 'Edit',
                            event: 'edit'
                        });
                    }

                    var text = me.api.can_AddHyperlink();

                    if (!_.isEmpty(text)) {
                        menuItems.push({
                            caption: 'Add Hyperlink',
                            event: 'addlink'
                        });
                    }

                    if (Asc.c_oAscTypeSelectElement.Paragraph == topObjectType) {
                        //
                    }
                }

                if (Common.SharedSettings.get('phone') && menuItems.length > 3) {
                    menuItems = menuItems.slice(0, 3);
                }

                return menuItems;
            }
        }
    })());
});