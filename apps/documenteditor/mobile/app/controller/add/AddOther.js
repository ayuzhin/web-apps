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

                $('#addother-sectionbreak-view li').single('click',  _.buffered(me.onInsertSectionBreak, 100, me));
                $('#addother-pagenumber-view li').single('click',    _.buffered(me.onInsertPageNumber, 100, me));
                $('#add-link-insert').single('click',                _.buffered(me.onInsertLink, 100, me));

                $('#add-link-url input, #add-link-display input').single('input', _.bind(me.onFieldChange, me));

                _.delay(function () {
                    $('#addother-link-view input[type="url"]').focus();
                }, 1000);

                // Init Link
                if ($('#addother-link-view')) {
                    _.defer(function () {
                        $('#add-link-display input').val(me.api.can_AddHyperlink());
                    });
                }
            },

            // Handlers

            onFieldChange: function () {
                $('#add-link-insert')[_.isEmpty($('#add-link-url input').val()) ? 'addClass' : 'removeClass']('disabled');
            },

            onInsertLink: function (e) {
                var me      = this,
                    url     = $('#add-link-url input').val(),
                    display = $('#add-link-display input').val(),
                    tip     = $('#add-link-tip input').val(),
                    urltype = me.api.asc_getUrlType($.trim(url)),
                    isEmail = (urltype == 2);

                if (urltype < 1) {
                    uiApp.alert(me.txtNotUrl);
                    return;
                }

                url = url.replace(/^\s+|\s+$/g,'');

                if (! /(((^https?)|(^ftp)):\/\/)|(^mailto:)/i.test(url) )
                    url = (isEmail ? 'mailto:' : 'http://' ) + url;

                url = url.replace(new RegExp("%20",'g')," ");

                var props = new Asc.asc_CHyperlink();
                // props.asc_setType(1);
                props.asc_setHyperlinkUrl(url);
                props.asc_setText(_.isEmpty(display) ? url : display);
                props.asc_setTooltip(tip);

                me.api.add_Hyperlink(props);
            },

            onPageBreak: function (e) {
                this.api && this.api.put_AddPageBreak();
                DE.getController('AddContainer').hideModal();
            },

            onLineBreak: function (e) {
                this.api && this.api.put_AddLineBreak();
                DE.getController('AddContainer').hideModal();
            },

            onInsertSectionBreak: function (e) {
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

            onInsertPageNumber: function (e) {
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
            },

            txtNotUrl:          'This field should be a URL in the format \"http://www.example.com\"'

        }
    })());
});
