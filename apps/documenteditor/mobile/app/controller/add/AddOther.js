/**
 *  AddOther.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/17/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'documenteditor/mobile/app/view/add/AddOther'
], function (core) {
    'use strict';

    DE.Controllers.AddOther = Backbone.Controller.extend((function() {
        var c_pageNumPosition = {
            PAGE_NUM_POSITION_TOP: 0x01,
            PAGE_NUM_POSITION_BOTTOM: 0x02,
            PAGE_NUM_POSITION_RIGHT: 0,
            PAGE_NUM_POSITION_LEFT: 1,
            PAGE_NUM_POSITION_CENTER: 2
        };

        return {
            models: [],
            collections: [],
            views: [
                'AddOther'
            ],

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));

                this.addListeners({
                    'AddOther': {
                        'page:show' : this.onPageShow
                    }
                });
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                // me.api.asc_registerCallback('asc_onInitEditorFonts',    _.bind(onApiLoadFonts, me));

            },

            onLaunch: function () {
                this.createView('AddOther').render();
            },

            initEvents: function () {
                var me = this;
                $('#add-other-pagebreak').single('click',   _.bind(me.onPageBreak, me));
                $('#add-other-linebreak').single('click',   _.bind(me.onLineBreak, me));
            },

            onPageShow: function () {
                var me = this;

                $('#addother-sectionbreak-view a').single('click',  _.bind(me.onSectionBreak, me));
                $('#addother-pagenumber-view a').single('click',    _.bind(me.onPageNumber, me));
                // $('#text-additional li').single('click',        _.buffered(me.onAdditional, 100, me));
                // $('#page-text-linespacing li').single('click',  _.buffered(me.onLineSpacing, 100, me));
            },

            // Handlers

            onPageBreak: function (e) {
                this.api && this.api.put_AddPageBreak();
                DE.getController('AddContainer').hideModal();
            },

            onLineBreak: function (e) {
                this.api && this.api.put_AddLineBreak();
                DE.getController('AddContainer').hideModal();
            },

            onSectionBreak: function (e) {
                var $target = $(e.currentTarget);

                if ($target && this.api) {
                    var type = $target.data('type'),
                        value;

                    if ('next' == type) {
                        value = Asc.c_oAscSectionBreakType.NextPage;
                    } else if ('continuous' == type) {
                        value = Asc.c_oAscSectionBreakType.Continuous;
                    } else if ('even' == type) {
                        value = Asc.c_oAscSectionBreakType.EvenPage;
                    } else if ('odd' == type) {
                        value = Asc.c_oAscSectionBreakType.OddPage;
                    }

                    this.api.add_SectionBreak(value);
                }

                DE.getController('AddContainer').hideModal();
            },

            onPageNumber: function (e) {
                var $target = $(e.currentTarget);

                if ($target && this.api) {
                    var value = -1,
                        type = $target.data('type');

                    if (2 == type.length) {
                        value = {};

                        if (type[0] == 'l') {
                            value.subtype = c_pageNumPosition.PAGE_NUM_POSITION_LEFT;
                        } else if (type[0] == 'c') {
                            value.subtype = c_pageNumPosition.PAGE_NUM_POSITION_CENTER;
                        } else if (type[0] == 'r') {
                            value.subtype = c_pageNumPosition.PAGE_NUM_POSITION_RIGHT;
                        }

                        if (type[1] == 't') {
                            value.type = c_pageNumPosition.PAGE_NUM_POSITION_TOP;
                        } else if (type[1] == 'b') {
                            value.type = c_pageNumPosition.PAGE_NUM_POSITION_BOTTOM;
                        }

                        this.api.put_PageNum(value.type, value.subtype);
                    } else {
                        this.api.put_PageNum(value);
                    }
                }

                DE.getController('AddContainer').hideModal();
            }

            // API handlers



            // Helpers

        }
    })());
});
