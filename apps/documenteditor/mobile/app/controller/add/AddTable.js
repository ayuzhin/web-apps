/**
 *  AddTable.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 10/17/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */


define([
    'core',
    'documenteditor/mobile/app/view/add/AddTable'
], function (core) {
    'use strict';

    DE.Controllers.AddTable = Backbone.Controller.extend((function() {
        var _styles = [];

        return {
            models: [],
            collections: [],
            views: [
                'AddTable'
            ],

            initialize: function () {
                Common.NotificationCenter.on('addcontainer:show', _.bind(this.initEvents, this));
            },

            setApi: function (api) {
                var me = this;
                me.api = api;

                _styles = [{
                    imageUrl    : null,
                    templateId  : 'sample'
                }];
                Common.SharedSettings.set('tablestyles', _styles);
                Common.NotificationCenter.trigger('tablestyles:load', _styles);

                me.api.asc_registerCallback('asc_onInitTableTemplates', _.bind(me.onApiInitTemplates, me));
            },

            onLaunch: function () {
                this.createView('AddTable').render();
            },

            initEvents: function () {
                var me = this;

                $('#add-table li').single('click',  _.buffered(me.onStyleClick, 100, me));
            },

            onStyleClick: function (e) {
                var me = this,
                    $target = $(e.currentTarget);

                DE.getController('AddContainer').hideModal();

                _.delay(function () {
                    if ($target) {
                        var picker;
                        var modal = uiApp.modal({
                            title: 'Table Size',
                            text: '',
                            afterText:
                            '<div class="content-block">' +
                                '<div class="row">' +
                                    '<div class="col-50">Columns</div>' +
                                    '<div class="col-50">Rows</div>' +
                                '</div>' +
                            '<div id="picker-table-size"></div>' +
                            '</div>',
                            buttons: [
                                {
                                    text: 'Cancel'
                                },
                                {
                                    text: 'OK',
                                    bold: true,
                                    onClick: function () {
                                        var size = picker.value;

                                        if (me.api) {
                                            me.api.put_Table(parseInt(size[0]), parseInt(size[1]));
                                            //TODO: Style ?
                                        }
                                    }
                                }
                            ]
                        });

                        picker = uiApp.picker({
                            container: '#picker-table-size',
                            toolbar: false,
                            rotateEffect: true,
                            value: [3, 3],
                            cols: [{
                                textAlign: 'left',
                                values: [1,2,3,4,5,6,7,8,9,10]
                            }, {
                                values: [1,2,3,4,5,6,7,8,9,10]
                            }]
                        });

                        // Vertical align
                        $$(modal).css({
                            marginTop: - Math.round($$(modal).outerHeight() / 2) + 'px'
                        });
                    }
                }, 300);
            },

            // Public

            getStyles: function () {
                return _styles;
            },

            // API handlers

            onApiInitTemplates: function(templates){
                _styles = [];
                _.each(templates, function(template){
                    _styles.push({
                        imageUrl    : template.get_Image(),
                        templateId  : template.get_Id()
                    });
                });

                Common.SharedSettings.set('tablestyles', _styles);
                Common.NotificationCenter.trigger('tablestyles:load', _styles);
            }
        }
    })());
});
