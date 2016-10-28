/**
 *  Main.js
 *  Document Editor
 *
 *  Created by Alexander Yuzhin on 9/22/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

define([
    'core',
    'irregularstack',
    'common/main/lib/util/LocalStorage'
], function () {
    'use strict';

    DE.Controllers.Main = Backbone.Controller.extend(_.extend((function() {
        var ApplyEditRights = -255;
        var LoadingDocument = -256;

        Common.localStorage.setId('text');
        Common.localStorage.setKeysFilter('de-,asc.text');
        Common.localStorage.sync();

        var fillUserInfo = function(info, lang, defname) {
            var user = info || {};
            !user.id && (user.id = ('uid-' + Date.now()));
            _.isEmpty(user.firstname) && _.isEmpty(user.lastname) && (user.firstname = defname);
            if (_.isEmpty(user.firstname))
                user.fullname = user.lastname;
            else if (_.isEmpty(user.lastname))
                user.fullname = user.firstname;
            else
                user.fullname = /^ru/.test(lang) ? user.lastname + ' ' + user.firstname :  user.firstname + ' ' + user.lastname;

            return user;
        };

        return {
            models: [],
            collections: [],
            views: [],

            initialize: function() {
                //
            },

            onLaunch: function() {
                var me = this;

                me.stackLongActions = new Common.IrregularStack({
                    strongCompare   : function(obj1, obj2){return obj1.id === obj2.id && obj1.type === obj2.type;},
                    weakCompare     : function(obj1, obj2){return obj1.type === obj2.type;}
                });

                this._state = {
                    isDisconnected      : false,
                    usersCount          : 1,
                    fastCoauth          : true,
                    startModifyDocument : true,
                    lostEditingRights   : false,
                    licenseWarning      : false
                };

                // Initialize viewport

//                if (!Common.Utils.isBrowserSupported()){
//                    Common.Utils.showBrowserRestriction();
//                    Common.Gateway.reportError(undefined, this.unsupportedBrowserErrorText);
//                    return;
//                }

                var value = Common.localStorage.getItem("de-settings-fontrender");
                if (value === null)
                    window.devicePixelRatio > 1 ? value = '1' : '0';

                // Initialize api

                window["flat_desine"] = true;

                me.api = new Asc.asc_docs_api({
                    'id-view'  : 'editor_sdk',
                    'mobile'   : true
                });

                if (me.api){
                    switch (value) {
                        case '0': me.api.SetFontRenderingMode(3); break;
                        case '1': me.api.SetFontRenderingMode(1); break;
                        case '2': me.api.SetFontRenderingMode(2); break;
                    }

                    Common.Utils.Metric.setCurrentMetric(1); //pt

                    me.api.asc_registerCallback('asc_onError',                      _.bind(me.onError, me));
                    me.api.asc_registerCallback('asc_onDocumentContentReady',       _.bind(me.onDocumentContentReady, me));
                    me.api.asc_registerCallback('asc_onOpenDocumentProgress',       _.bind(me.onOpenDocument, me));
                    me.api.asc_registerCallback('asc_onDocumentUpdateVersion',      _.bind(me.onUpdateVersion, me));
                    me.api.asc_registerCallback('asc_onAdvancedOptions',            _.bind(me.onAdvancedOptions, me));
                    me.api.asc_registerCallback('asc_onDocumentName',               _.bind(me.onDocumentName, me));
                    me.api.asc_registerCallback('asc_onPrintUrl',                   _.bind(me.onPrintUrl, me));

                    Common.NotificationCenter.on('api:disconnect',                  _.bind(me.onCoAuthoringDisconnect, me));
                    Common.NotificationCenter.on('goback',                          _.bind(me.goBack, me));

                    // Initialize descendants
                    _.each(me.getApplication().controllers, function(controller) {
                        if (controller && _.isFunction(controller.setApi)) {
                            controller.setApi(me.api);
                        }
                    });

                    // Initialize api gateway
                    me.editorConfig = {};
                    me.appOptions   = {};
                    me.plugins      = undefined;

                    Common.Gateway.on('init',           _.bind(me.loadConfig, me));
                    Common.Gateway.on('showmessage',    _.bind(me.onExternalMessage, me));
                    Common.Gateway.on('opendocument',   _.bind(me.loadDocument, me));
                    Common.Gateway.ready();
                }
            },

            loadConfig: function(data) {
                this.editorConfig = $.extend(this.editorConfig, data.config);

                this.editorConfig.user          =
                this.appOptions.user            = fillUserInfo(this.editorConfig.user, this.editorConfig.lang, this.textAnonymous);
                this.appOptions.nativeApp       = this.editorConfig.nativeApp === true;
                this.appOptions.isDesktopApp    = this.editorConfig.targetApp == 'desktop';
                this.appOptions.canCreateNew    = !_.isEmpty(this.editorConfig.createUrl) && !this.appOptions.isDesktopApp;
                this.appOptions.canOpenRecent   = this.editorConfig.nativeApp !== true && this.editorConfig.recent !== undefined && !this.appOptions.isDesktopApp;
                this.appOptions.templates       = this.editorConfig.templates;
                this.appOptions.recent          = this.editorConfig.recent;
                this.appOptions.createUrl       = this.editorConfig.createUrl;
                this.appOptions.lang            = this.editorConfig.lang;
                this.appOptions.location        = (typeof (this.editorConfig.location) == 'string') ? this.editorConfig.location.toLowerCase() : '';
                this.appOptions.sharingSettingsUrl = this.editorConfig.sharingSettingsUrl;
                this.appOptions.fileChoiceUrl   = this.editorConfig.fileChoiceUrl;
                this.appOptions.mergeFolderUrl  = this.editorConfig.mergeFolderUrl;
                this.appOptions.canAnalytics    = false;
                this.appOptions.customization   = this.editorConfig.customization;
                this.appOptions.canBackToFolder = (this.editorConfig.canBackToFolder!==false) && (typeof (this.editorConfig.customization) == 'object')
                    && (typeof (this.editorConfig.customization.goback) == 'object') && !_.isEmpty(this.editorConfig.customization.goback.url);
                this.appOptions.canBack         = this.editorConfig.nativeApp !== true && this.appOptions.canBackToFolder === true;
                this.appOptions.canPlugins      = false;
                this.plugins                    = this.editorConfig.plugins;

                if (this.editorConfig.lang)
                    this.api.asc_setLocale(this.editorConfig.lang);

//                if (this.appOptions.location == 'us' || this.appOptions.location == 'ca')
//                    Common.Utils.Metric.setDefaultMetric(Common.Utils.Metric.c_MetricUnits.inch);
            },

            loadDocument: function(data) {
                this.permissions = {};
                this.document = data.doc;

                var docInfo = {};

                if (data.doc) {
                    this.permissions = $.extend(this.permissions, data.doc.permissions);

                    var _user = new Asc.asc_CUserInfo();
                    _user.put_Id(this.appOptions.user.id);
                    _user.put_FirstName(this.appOptions.user.firstname);
                    _user.put_LastName(this.appOptions.user.lastname);
                    _user.put_FullName(this.appOptions.user.fullname);

                    docInfo = new Asc.asc_CDocInfo();
                    docInfo.put_Id(data.doc.key);
                    docInfo.put_Url(data.doc.url);
                    docInfo.put_Title(data.doc.title);
                    docInfo.put_Format(data.doc.fileType);
                    docInfo.put_VKey(data.doc.vkey);
                    docInfo.put_Options(data.doc.options);
                    docInfo.put_UserInfo(_user);
                    docInfo.put_CallbackUrl(this.editorConfig.callbackUrl);
                }

                this.api.asc_registerCallback('asc_onGetEditorPermissions', _.bind(this.onEditorPermissions, this));
                this.api.asc_setDocInfo(docInfo);
                this.api.asc_getEditorPermissions(this.editorConfig.licenseUrl, this.editorConfig.customerId);

                Common.SharedSettings.set('document', data.doc);


                if (data.doc) {
                    this.getApplication()
                       .getController('Toolbar')
                       .setDocumentTitle(data.doc.title);
                }
            },

            setMode: function(mode){
                var me = this;

                Common.SharedSettings.set('mode', mode);

                if (me.api ) {
                    me.api.asc_enableKeyEvents(mode == 'edit');
                    me.api.asc_setViewMode(mode != 'edit');
                }
            },

            onProcessSaveResult: function(data) {
                this.api.asc_OnSaveEnd(data.result);
                if (data && data.result === false) {
                    uiApp.alert(
                        _.isEmpty(data.message) ? this.errorProcessSaveResult : data.message,
                        this.criticalErrorTitle
                    );
                }
            },

            onProcessRightsChange: function(data) {
                if (data && data.enabled === false) {
                    var me = this,
                        old_rights = this._state.lostEditingRights;
                    this._state.lostEditingRights = !this._state.lostEditingRights;
                    this.api.asc_coAuthoringDisconnect();

                    if (!old_rights) {
                        uiApp.alert(
                            _.isEmpty(data.message) ? this.warnProcessRightsChange : data.message,
                            this.notcriticalErrorTitle,
                            function () {
                                me._state.lostEditingRights = false;
                                me.onEditComplete();
                            }
                        );
                    }
                }
            },

            onDownloadAs: function() {
//                this._state.isFromGatewayDownloadAs = true;
//                var type = /^(?:(pdf|djvu|xps))$/.exec(this.document.fileType);
//                (type && typeof type[1] === 'string') ? this.api.asc_DownloadOrigin(true) : this.api.asc_DownloadAs(Asc.c_oAscFileType.DOCX, true);
            },


            onRefreshHistory: function(opts) {
//                this.loadMask && this.loadMask.hide();
//                if (opts.data.error || !opts.data.history) {
//                    var historyStore = this.getApplication().getCollection('Common.Collections.HistoryVersions');
//                    if (historyStore && historyStore.size()>0) {
//                        historyStore.each(function(item){
//                            item.set('canRestore', false);
//                        });
//                    }
//                    Common.UI.alert({
//                        closable: false,
//                        title: this.notcriticalErrorTitle,
//                        msg: (opts.data.error) ? opts.data.error : this.txtErrorLoadHistory,
//                        iconCls: 'warn',
//                        buttons: ['ok'],
//                        callback: _.bind(function(btn){
//                            this.onEditComplete();
//                        }, this)
//                    });
//                } else {
//                    this.api.asc_coAuthoringDisconnect();
//                    this.getApplication().getController('LeftMenu').getView('LeftMenu').showHistory();
//                    this.disableEditing(true);
//                    var versions = opts.data.history,
//                        historyStore = this.getApplication().getCollection('Common.Collections.HistoryVersions'),
//                        currentVersion = null;
//                    if (historyStore) {
//                        var arrVersions = [], ver, version, group = -1, prev_ver = -1, arrColors = [], docIdPrev = '',
//                            usersStore = this.getApplication().getCollection('Common.Collections.HistoryUsers'), user = null, usersCnt = 0;
//
//                        for (ver=versions.length-1; ver>=0; ver--) {
//                            version = versions[ver];
//                            if (version.versionGroup===undefined || version.versionGroup===null)
//                                version.versionGroup = version.version;
//                            if (version) {
//                                if (!version.user) version.user = {};
//                                docIdPrev = (ver>0 && versions[ver-1]) ? versions[ver-1].key : version.key + '0';
//                                user = usersStore.findUser(version.user.id);
//                                if (!user) {
//                                    user = new Common.Models.User({
//                                        id          : version.user.id,
//                                        username    : version.user.name,
//                                        colorval    : Asc.c_oAscArrUserColors[usersCnt],
//                                        color       : this.generateUserColor(Asc.c_oAscArrUserColors[usersCnt++])
//                                    });
//                                    usersStore.add(user);
//                                }
//
//                                arrVersions.push(new Common.Models.HistoryVersion({
//                                    version: version.versionGroup,
//                                    revision: version.version,
//                                    userid : version.user.id,
//                                    username : version.user.name,
//                                    usercolor: user.get('color'),
//                                    created: version.created,
//                                    docId: version.key,
//                                    markedAsVersion: (group!==version.versionGroup),
//                                    selected: (opts.data.currentVersion == version.version),
//                                    canRestore: this.appOptions.canHistoryRestore
//                                }));
//                                if (opts.data.currentVersion == version.version) {
//                                    currentVersion = arrVersions[arrVersions.length-1];
//                                }
//                                group = version.versionGroup;
//                                if (prev_ver!==version.version) {
//                                    prev_ver = version.version;
//                                    arrColors.reverse();
//                                    for (i=0; i<arrColors.length; i++) {
//                                        arrVersions[arrVersions.length-i-2].set('arrColors',arrColors);
//                                    }
//                                    arrColors = [];
//                                }
//                                arrColors.push(user.get('colorval'));
//
//                                var changes = version.changes, change, i;
//                                if (changes && changes.length>0) {
//                                    arrVersions[arrVersions.length-1].set('changeid', changes.length-1);
//                                    arrVersions[arrVersions.length-1].set('docIdPrev', docIdPrev);
//                                    for (i=changes.length-2; i>=0; i--) {
//                                        change = changes[i];
//
//                                        user = usersStore.findUser(change.user.id);
//                                        if (!user) {
//                                            user = new Common.Models.User({
//                                                id          : change.user.id,
//                                                username    : change.user.name,
//                                                colorval    : Asc.c_oAscArrUserColors[usersCnt],
//                                                color       : this.generateUserColor(Asc.c_oAscArrUserColors[usersCnt++])
//                                            });
//                                            usersStore.add(user);
//                                        }
//
//                                        arrVersions.push(new Common.Models.HistoryVersion({
//                                            version: version.versionGroup,
//                                            revision: version.version,
//                                            changeid: i,
//                                            userid : change.user.id,
//                                            username : change.user.name,
//                                            usercolor: user.get('color'),
//                                            created: change.created,
//                                            docId: version.key,
//                                            docIdPrev: docIdPrev,
//                                            selected: false,
//                                            canRestore: this.appOptions.canHistoryRestore,
//                                            isRevision: false
//                                        }));
//                                        arrColors.push(user.get('colorval'));
//                                    }
//                                } else if (ver==0 && versions.length==1) {
//                                    arrVersions[arrVersions.length-1].set('docId', version.key + '1');
//                                }
//                            }
//                        }
//                        if (arrColors.length>0) {
//                            arrColors.reverse();
//                            for (i=0; i<arrColors.length; i++) {
//                                arrVersions[arrVersions.length-i-1].set('arrColors',arrColors);
//                            }
//                            arrColors = [];
//                        }
//                        historyStore.reset(arrVersions);
//                        if (currentVersion===null && historyStore.size()>0) {
//                            currentVersion = historyStore.at(0);
//                            currentVersion.set('selected', true);
//                        }
//                        if (currentVersion)
//                            this.getApplication().getController('Common.Controllers.History').onSelectRevision(null, null, currentVersion);
//                    }
//                }
            },


            disableEditing: function(disable) {
               var app = this.getApplication();
//                if (this.appOptions.canEdit && this.editorConfig.mode !== 'view') {
//                    app.getController('RightMenu').getView('RightMenu').clearSelection();
//                    app.getController('Toolbar').DisableToolbar(disable, disable);
//                    app.getController('RightMenu').SetDisabled(disable, false);
//                    app.getController('Statusbar').getView('Statusbar').SetDisabled(disable);
//
//                    var tooltip = app.getController('Toolbar').getView('Toolbar').synchTooltip;
//                    if (tooltip) tooltip.hide();
//                }
//                app.getController('LeftMenu').SetDisabled(disable, true);
            },

            goBack: function(blank) {
                var href = this.appOptions.customization.goback.url;
                if (blank) {
                    window.open(href, "_blank");
                } else {
                    parent.location.href = href;
                }
            },

            onEditComplete: function(cmp) {
////                this.getMainMenu().closeFullScaleMenu();
//                var application = this.getApplication(),
//                    toolbarController = application.getController('Toolbar'),
//                    toolbarView = toolbarController.getView('Toolbar');
//
//                if (this.appOptions.isEdit && toolbarView && (toolbarView.btnInsertShape.pressed || toolbarView.btnInsertText.pressed) &&
//                    ( !_.isObject(arguments[1]) || arguments[1].id !== 'id-toolbar-btn-insertshape')) { // TODO: Event from api is needed to clear btnInsertShape state
//                    if (this.api)
//                        this.api.StartAddShape('', false);
//
//                    toolbarView.btnInsertShape.toggle(false, false);
//                    toolbarView.btnInsertText.toggle(false, false);
//                }
//
//                application.getController('DocumentHolder').getView('DocumentHolder').focus();
//
//                if (this.api) {
//                    var cansave = this.api.asc_isDocumentCanSave();
//                    var isSyncButton = $('.btn-icon', toolbarView.btnSave.cmpEl).hasClass('btn-synch');
//                    if (toolbarView.btnSave.isDisabled() !== (!cansave && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1))
//                        toolbarView.btnSave.setDisabled(!cansave && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1);
//                }
            },

            onLongActionBegin: function(type, id) {
                var action = {id: id, type: type};
                this.stackLongActions.push(action);
                this.setLongActionView(action);
            },

            onLongActionEnd: function(type, id) {
                var me = this,
                    action = {id: id, type: type};

                this.stackLongActions.pop(action);

//                this.getApplication()
//                    .getController('Viewport')
//                    .getView('Common.Views.Header')
//                    .setDocumentCaption(this.api.asc_getDocumentName());

                this.updateWindowTitle(true);

                action = this.stackLongActions.get({type: Asc.c_oAscAsyncActionType.Information});
                if (action) {
                    this.setLongActionView(action)
                } else {
                    if (this._state.fastCoauth && this._state.usersCount>1 && id==Asc.c_oAscAsyncAction['Save']) {
                        var me = this;
                        if (me._state.timerSave===undefined)
                            me._state.timerSave = setInterval(function(){
                                if ((new Date()) - me._state.isSaving>500) {
                                    clearInterval(me._state.timerSave);
                                    console.debug('End long action');
                                    me._state.timerSave = undefined;
                                }
                            }, 500);
                    } else {
                        console.debug('End long action');
                    }
                }

                action = this.stackLongActions.get({type: Asc.c_oAscAsyncActionType.BlockInteraction});

                if (action) {
                    this.setLongActionView(action)
                } else {
                    _.delay(function () {
                        $(me.loadMask).hasClass('modal-in') && uiApp.closeModal(me.loadMask);
                    }, 200);
                }

                if (id==Asc.c_oAscAsyncAction['Save'] && (!this._state.fastCoauth || this._state.usersCount<2)) {
                    this.synchronizeChanges();
                }
            },

            setLongActionView: function(action) {
                var title = '', text = '';

                switch (action.id) {
                    case Asc.c_oAscAsyncAction['Open']:
                        title   = this.openTitleText;
                        text    = this.openTextText;
                        break;

                    case Asc.c_oAscAsyncAction['Save']:
                        this._state.isSaving = new Date();
                        title   = this.saveTitleText;
                        text    = this.saveTextText;
                        break;

                    case Asc.c_oAscAsyncAction['LoadDocumentFonts']:
                        title   = this.loadFontsTitleText;
                        text    = this.loadFontsTextText;
                        break;

                    case Asc.c_oAscAsyncAction['LoadDocumentImages']:
                        title   = this.loadImagesTitleText;
                        text    = this.loadImagesTextText;
                        break;

                    case Asc.c_oAscAsyncAction['LoadFont']:
                        title   = this.loadFontTitleText;
                        text    = this.loadFontTextText;
                        break;

                    case Asc.c_oAscAsyncAction['LoadImage']:
                        title   = this.loadImageTitleText;
                        text    = this.loadImageTextText;
                        break;

                    case Asc.c_oAscAsyncAction['DownloadAs']:
                        title   = this.downloadTitleText;
                        text    = this.downloadTextText;
                        break;

                    case Asc.c_oAscAsyncAction['Print']:
                        title   = this.printTitleText;
                        text    = this.printTextText;
                        break;

                    case Asc.c_oAscAsyncAction['UploadImage']:
                        title   = this.uploadImageTitleText;
                        text    = this.uploadImageTextText;
                        break;

                    case Asc.c_oAscAsyncAction['ApplyChanges']:
                        title   = this.applyChangesTitleText;
                        text    = this.applyChangesTextText;
                        break;

                    case Asc.c_oAscAsyncAction['PrepareToSave']:
                        title   = this.savePreparingText;
                        text    = this.savePreparingTitle;
                        break;

                    case Asc.c_oAscAsyncAction['MailMergeLoadFile']:
                        title   = this.mailMergeLoadFileText;
                        text    = this.mailMergeLoadFileTitle;
                        break;

                    case Asc.c_oAscAsyncAction['DownloadMerge']:
                        title   = this.downloadMergeTitle;
                        text    = this.downloadMergeText;
                        break;

                    case Asc.c_oAscAsyncAction['SendMailMerge']:
                        title   = this.sendMergeTitle;
                        text    = this.sendMergeText;
                        break;

                    case ApplyEditRights:
                        title   = this.txtEditingMode;
                        text    = this.txtEditingMode;
                        break;

                    case LoadingDocument:
                        title   = this.loadingDocumentTitleText;
                        text    = this.loadingDocumentTextText;
                        break;
                }

                if (action.type == Asc.c_oAscAsyncActionType['BlockInteraction']) {
                    if (!this.loadMask)
                        this.loadMask = uiApp.showPreloader(title);
                }
                else {
//                    this.getApplication().getController('Statusbar').setStatusCaption(text);
                }
            },

            onApplyEditRights: function(data) {
//                var application = this.getApplication();
//                application.getController('Statusbar').setStatusCaption('');
//
//                if (data) {
//                    if (data.allowed) {
//                        data.requestrights = true;
//                        this.appOptions.isEdit= true;
//
//                        this.onLongActionBegin(Asc.c_oAscAsyncActionType['BlockInteraction'],ApplyEditRights);
//
//                        var me = this;
//                        setTimeout(function(){
//                            me.applyModeCommonElements();
//                            me.applyModeEditorElements();
//                            me.api.asc_setViewMode(false);
//
//                            var timer_rp = setInterval(function(){
//                                clearInterval(timer_rp);
//
//                                var toolbarController           = application.getController('Toolbar'),
//                                    rightmenuController         = application.getController('RightMenu'),
//                                    leftmenuController          = application.getController('LeftMenu'),
//                                    documentHolderController    = application.getController('DocumentHolder'),
//                                    fontsControllers            = application.getController('Common.Controllers.Fonts');
//
//                                leftmenuController.setMode(me.appOptions).createDelayedElements();
//
//                                rightmenuController.createDelayedElements();
//
//                                Common.NotificationCenter.trigger('layout:changed', 'main');
//
//                                var timer_sl = setInterval(function(){
//                                    if (window.styles_loaded) {
//                                        clearInterval(timer_sl);
//
//                                        documentHolderController.getView('DocumentHolder').createDelayedElements();
//                                        documentHolderController.getView('DocumentHolder').changePosition();
//                                        me.loadLanguages();
//
//                                        var shapes = me.api.asc_getPropertyEditorShapes();
//                                        if (shapes)
//                                            me.fillAutoShapes(shapes[0], shapes[1]);
//
//                                        me.fillTextArt(me.api.asc_getTextArtPreviews());
//                                        me.updateThemeColors();
//                                        toolbarController.activateControls();
//
//                                        me.api.UpdateInterfaceState();
//                                    }
//                                }, 50);
//                            },50);
//                        }, 100);
//                    } else {
//                        Common.UI.info({
//                            title: this.requestEditFailedTitleText,
//                            msg: data.message || this.requestEditFailedMessageText
//                        });
//                    }
//                }
            },

            onDocumentContentReady: function() {
                if (this._isDocReady)
                    return;

                var me = this,
                    value;

                me._isDocReady = true;

                me.api.SetDrawingFreeze(false);
                me.hidePreloader();
                me.onLongActionEnd(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);

                /** coauthoring begin **/
                value = Common.localStorage.getItem("de-settings-livecomment");
                this.isLiveCommenting = !(value!==null && parseInt(value) == 0);
                this.isLiveCommenting ? this.api.asc_showComments() : this.api.asc_hideComments();
                /** coauthoring end **/

                value = Common.localStorage.getItem("de-settings-zoom");
                var zf = (value!==null) ? parseInt(value) : (this.appOptions.customization && this.appOptions.customization.zoom ? parseInt(this.appOptions.customization.zoom) : 100);
                (zf == -1) ? this.api.zoomFitToPage() : ((zf == -2) ? this.api.zoomFitToWidth() : this.api.zoom(zf>0 ? zf : 100));

                value = Common.localStorage.getItem("de-show-hiddenchars");
                me.api.put_ShowParaMarks((value!==null) ? eval(value) : false);

                value = Common.localStorage.getItem("de-show-tableline");
                me.api.put_ShowTableEmptyLine((value!==null) ? eval(value) : true);

                value = Common.localStorage.getItem("de-settings-spellcheck");
                me.api.asc_setSpellCheck(value===null || parseInt(value) == 1);

                Common.localStorage.setItem("de-settings-showsnaplines", me.api.get_ShowSnapLines() ? 1 : 0);

                me.api.asc_registerCallback('asc_onStartAction',            _.bind(me.onLongActionBegin, me));
                me.api.asc_registerCallback('asc_onEndAction',              _.bind(me.onLongActionEnd, me));
                me.api.asc_registerCallback('asc_onCoAuthoringDisconnect',  _.bind(me.onCoAuthoringDisconnect, me));
                me.api.asc_registerCallback('asc_onPrint',                  _.bind(me.onPrint, me));

                var application = me.getApplication();
//                application.getController('Viewport')
//                    .getView('Common.Views.Header')
//                    .setDocumentCaption(me.api.asc_getDocumentName());

                me.updateWindowTitle(true);

                value = Common.localStorage.getItem("de-settings-inputmode");
                me.api.SetTextBoxInputMode(value!==null && parseInt(value) == 1);

                /** coauthoring begin **/
                if (me.appOptions.isEdit && me.appOptions.canLicense && !me.appOptions.isOffline && me.appOptions.canCoAuthoring) {
                    value = Common.localStorage.getItem("de-settings-coauthmode");
                    me._state.fastCoauth = (value===null || parseInt(value) == 1);
                    me.api.asc_SetFastCollaborative(me._state.fastCoauth);

                    value = Common.localStorage.getItem((me._state.fastCoauth) ? "de-settings-showchanges-fast" : "de-settings-showchanges-strict");
                    if (value !== null)
                        me.api.SetCollaborativeMarksShowType(value == 'all' ? Asc.c_oAscCollaborativeMarksShowType.All :
                            value == 'none' ? Asc.c_oAscCollaborativeMarksShowType.None : Asc.c_oAscCollaborativeMarksShowType.LastChanges);
                    else
                        me.api.SetCollaborativeMarksShowType(me._state.fastCoauth ? Asc.c_oAscCollaborativeMarksShowType.None : Asc.c_oAscCollaborativeMarksShowType.LastChanges);
                } else {
                    me._state.fastCoauth = false;
                    me.api.asc_SetFastCollaborative(me._state.fastCoauth);
                    me.api.SetCollaborativeMarksShowType(Asc.c_oAscCollaborativeMarksShowType.None);
                }
                /** coauthoring end **/

//                var toolbarController           = application.getController('Toolbar'),
//                    statusbarController         = application.getController('Statusbar'),
//                    documentHolderController    = application.getController('DocumentHolder'),
//                    fontsController             = application.getController('Common.Controllers.Fonts'),
//                    rightmenuController         = application.getController('RightMenu'),
//                    leftmenuController          = application.getController('LeftMenu'),
//                    chatController              = application.getController('Common.Controllers.Chat'),
//                    pluginsController           = application.getController('Common.Controllers.Plugins');
//
//                leftmenuController.getView('LeftMenu').getMenu('file').loadDocument({doc:me.document});
//                leftmenuController.setMode(me.appOptions).createDelayedElements().setApi(me.api);
//
//                chatController.setApi(this.api).setMode(this.appOptions);
//                application.getController('Common.Controllers.ExternalDiagramEditor').setApi(this.api).loadConfig({config:this.editorConfig, customization: this.editorConfig.customization});
//                application.getController('Common.Controllers.ExternalMergeEditor').setApi(this.api).loadConfig({config:this.editorConfig, customization: this.editorConfig.customization});
//
//                pluginsController.setApi(me.api);
//                me.updatePlugins(me.plugins);
//                me.api.asc_registerCallback('asc_onPluginsInit', _.bind(me.updatePluginsList, me));
//
//                documentHolderController.setApi(me.api);
//                documentHolderController.createDelayedElements();
//                statusbarController.createDelayedElements();
//
//                leftmenuController.getView('LeftMenu').disableMenu('all',false);
//
//                if (me.appOptions.canBranding)
//                    me.getApplication().getController('LeftMenu').leftMenu.getMenu('about').setLicInfo(me.editorConfig.customization);
//
//                documentHolderController.getView('DocumentHolder').setApi(me.api).on('editcomplete', _.bind(me.onEditComplete, me));

//                if (me.appOptions.isEdit) {
//                    value = Common.localStorage.getItem("de-settings-autosave");
//                    value = (!me._state.fastCoauth && value!==null) ? parseInt(value) : (me.appOptions.canCoAuthoring ? 1 : 0);
//
//                    me.api.asc_setAutoSaveGap(value);
//
//                    if (me.needToUpdateVersion)
//                        Common.NotificationCenter.trigger('api:disconnect');
//                    var timer_sl = setInterval(function(){
//                        if (window.styles_loaded) {
//                            clearInterval(timer_sl);
//
//                            toolbarController.createDelayedElements();
//
//                            documentHolderController.getView('DocumentHolder').createDelayedElements();
//                            me.loadLanguages();
//
//                            rightmenuController.createDelayedElements();
//
//                            var shapes = me.api.asc_getPropertyEditorShapes();
//                            if (shapes)
//                                me.fillAutoShapes(shapes[0], shapes[1]);
//
//                            me.updateThemeColors();
//                            toolbarController.activateControls();
//                            if (me.needToUpdateVersion)
//                                toolbarController.onApiCoAuthoringDisconnect();
//                            me.api.UpdateInterfaceState();
//                            me.fillTextArt(me.api.asc_getTextArtPreviews());
//                        }
//                    }, 50);
//                }
//
//                if (this.appOptions.canAnalytics && false)
//                    Common.component.Analytics.initialize('UA-12442749-13', 'Document Editor');

                Common.Gateway.on('applyeditrights',        _.bind(me.onApplyEditRights, me));
                Common.Gateway.on('processsaveresult',      _.bind(me.onProcessSaveResult, me));
                Common.Gateway.on('processrightschange',    _.bind(me.onProcessRightsChange, me));
                Common.Gateway.on('refreshhistory',         _.bind(me.onRefreshHistory, me));
                Common.Gateway.on('downloadas',             _.bind(me.onDownloadAs, me));

                Common.Gateway.sendInfo({
                    mode: me.appOptions.isEdit?'edit':'view'
                });

                if (this.api) {
                    this.api.Resize();
                    this.api.zoomFitToWidth();
                }

//                if (this._state.licenseWarning) {
//                    value = Common.localStorage.getItem("de-license-warning");
//                    value = (value!==null) ? parseInt(value) : 0;
//                    var now = (new Date).getTime();
//                    if (now - value > 86400000) {
//                        Common.localStorage.setItem("de-license-warning", now);
//                        Common.UI.info({
//                            width: 500,
//                            title: this.textNoLicenseTitle,
//                            msg  : this.warnNoLicense,
//                            buttons: [
//                                {value: 'buynow', caption: this.textBuyNow},
//                                {value: 'contact', caption: this.textContactUs}
//                            ],
//                            primary: 'buynow',
//                            callback: function(btn) {
//                                if (btn == 'buynow')
//                                    window.open('http://www.onlyoffice.com/enterprise-edition.aspx', "_blank");
//                                else if (btn == 'contact')
//                                    window.open('mailto:sales@onlyoffice.com', "_blank");
//                            }
//                        });
//                    }
//                }
            },

            onOpenDocument: function(progress) {
                if (this.loadMask) {
                    var $title = $$(this.loadMask).find('.modal-title'),
                        proc = (progress.asc_getCurrentFont() + progress.asc_getCurrentImage())/(progress.asc_getFontsCount() + progress.asc_getImagesCount());

                    $title.text(this.textLoadingDocument + ': ' + Math.min(Math.round(proc * 100), 100) + '%');
                }
            },

            onEditorPermissions: function(params) {
                var me = this,
                    licType = params.asc_getLicenseType();

                if (Asc.c_oLicenseResult.Expired === licType ||
                    Asc.c_oLicenseResult.Error === licType ||
                    Asc.c_oLicenseResult.ExpiredTrial === licType) {
                    uiApp.modal({
                        title   : me.titleLicenseExp,
                        text    : me.warnLicenseExp
                    });
                    return;
                }

                me.permissions.review         = (me.permissions.review === undefined) ? (me.permissions.edit !== false) : me.permissions.review;
                me.appOptions.canAnalytics    = params.asc_getIsAnalyticsEnable();
                me.appOptions.canLicense      = (licType === Asc.c_oLicenseResult.Success);
                me.appOptions.isLightVersion  = params.asc_getIsLight();
                /** coauthoring begin **/
                me.appOptions.canCoAuthoring  = !me.appOptions.isLightVersion;
                /** coauthoring end **/
                me.appOptions.isOffline       = me.api.asc_isOffline();
                me.appOptions.isReviewOnly    = (me.permissions.review === true) && (me.permissions.edit === false);
                me.appOptions.canRequestEditRights = me.editorConfig.canRequestEditRights;
                me.appOptions.canEdit         = (me.permissions.edit !== false || me.permissions.review === true) && // can edit or review
                    (me.editorConfig.canRequestEditRights || me.editorConfig.mode !== 'view') && // if mode=="view" -> canRequestEditRights must be defined
                    (!me.appOptions.isReviewOnly || me.appOptions.canLicense); // if isReviewOnly==true -> canLicense must be true
                me.appOptions.isEdit          = me.appOptions.canLicense && me.appOptions.canEdit && me.editorConfig.mode !== 'view';
                me.appOptions.canReview       = me.appOptions.canLicense && me.appOptions.isEdit && (me.permissions.review===true);
                me.appOptions.canUseHistory   = me.appOptions.canLicense && !me.appOptions.isLightVersion && me.editorConfig.canUseHistory && me.appOptions.canCoAuthoring && !me.appOptions.isDesktopApp;
                me.appOptions.canHistoryClose  = me.editorConfig.canHistoryClose;
                me.appOptions.canHistoryRestore= me.editorConfig.canHistoryRestore && !!me.permissions.changeHistory;
                me.appOptions.canUseMailMerge= me.appOptions.canLicense && me.appOptions.canEdit && !me.appOptions.isDesktopApp;
                me.appOptions.canSendEmailAddresses  = me.appOptions.canLicense && me.editorConfig.canSendEmailAddresses && me.appOptions.canEdit && me.appOptions.canCoAuthoring;
                me.appOptions.canComments     = me.appOptions.canLicense && !((typeof (me.editorConfig.customization) == 'object') && me.editorConfig.customization.comments===false);
                me.appOptions.canChat         = me.appOptions.canLicense && !me.appOptions.isOffline && !((typeof (me.editorConfig.customization) == 'object') && me.editorConfig.customization.chat===false);
                me.appOptions.canEditStyles   = me.appOptions.canLicense && me.appOptions.canEdit;
                me.appOptions.canPrint        = (me.permissions.print !== false);

                var type = /^(?:(pdf|djvu|xps))$/.exec(me.document.fileType);
                me.appOptions.canDownloadOrigin = !me.appOptions.nativeApp && me.permissions.download !== false && (type && typeof type[1] === 'string');
                me.appOptions.canDownload       = !me.appOptions.nativeApp && me.permissions.download !== false && (!type || typeof type[1] !== 'string');

                me._state.licenseWarning = (licType===Asc.c_oLicenseResult.Connections) && me.appOptions.canEdit && me.editorConfig.mode !== 'view';

                me.appOptions.canBranding  = params.asc_getCanBranding() && (typeof me.editorConfig.customization == 'object');

                me.applyModeCommonElements();
                me.applyModeEditorElements();

                me.api.asc_setViewMode(!me.appOptions.isEdit);
                me.api.asc_LoadDocument();
                me.api.Resize();

                if (!me.appOptions.isEdit) {
                    me.hidePreloader();
                    me.onLongActionBegin(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);
                }
            },

            applyModeCommonElements: function() {
                var me = this;

                window.editor_elements_prepared = true;

                _.each(me.getApplication().controllers, function(controller) {
                    if (controller && _.isFunction(controller.setMode)) {
                        controller.setMode(me.editorConfig.mode);
                    }
                });


//                var app             = this.getApplication(),
//                    viewport        = app.getController('Viewport').getView('Viewport'),
//                    headerView      = app.getController('Viewport').getView('Common.Views.Header'),
//                    statusbarView   = app.getController('Statusbar').getView('Statusbar'),
//                    documentHolder  = app.getController('DocumentHolder').getView('DocumentHolder');
//
//                if (headerView) {
//                    headerView.setHeaderCaption(this.appOptions.isEdit ? 'Document Editor' : 'Document Viewer');
//                    headerView.setVisible(!this.appOptions.nativeApp && !value && !this.appOptions.isDesktopApp);
//                }
//
//                if (this.appOptions.nativeApp) {
//                    $('body').removeClass('safari');
//                }
//
//                viewport && viewport.setMode(this.appOptions);
//                statusbarView && statusbarView.setMode(this.appOptions);
//
//                documentHolder.setMode(this.appOptions);
//
                if (me.api) {
                    me.api.asc_registerCallback('asc_onSendThemeColors', _.bind(this.onSendThemeColors, this));

                    var translateChart = new Asc.asc_CChartTranslate();
                    translateChart.asc_setTitle(me.txtDiagramTitle);
                    translateChart.asc_setXAxis(me.txtXAxis);
                    translateChart.asc_setYAxis(me.txtYAxis);
                    translateChart.asc_setSeries(me.txtSeries);
                    me.api.asc_setChartTranslate(translateChart);

                    var translateArt = new Asc.asc_TextArtTranslate();
                    translateArt.asc_setDefaultText(me.txtArt);
                    me.api.asc_setTextArtTranslate(translateArt);
                }
            },

            applyModeEditorElements: function() {
                if (this.appOptions.isEdit) {
                    var me = this;
//                        application         = this.getApplication(),
//                        toolbarController   = application.getController('Toolbar'),
//                        rightmenuController = application.getController('RightMenu'),
//                        fontsControllers    = application.getController('Common.Controllers.Fonts'),
//                        reviewController    = (this.appOptions.canReview) ? application.getController('Common.Controllers.ReviewChanges') : null;
//
//                    fontsControllers    && fontsControllers.setApi(me.api);
//                    toolbarController   && toolbarController.setApi(me.api);
//
//                    /** coauthoring begin **/
//                    me.contComments.setMode(me.appOptions);
//                    me.contComments.setConfig({config: me.editorConfig}, me.api);
//                    /** coauthoring end **/
//                    rightmenuController && rightmenuController.setApi(me.api);
//
//                    if (reviewController)
//                        reviewController.setMode(me.appOptions).setConfig({config: me.editorConfig}, me.api);
//
//                    var viewport = this.getApplication().getController('Viewport').getView('Viewport');
//
//                    viewport.applyEditorMode();
//
//                    var toolbarView = (toolbarController) ? toolbarController.getView('Toolbar') : null;
//
//                    _.each([
//                        toolbarView,
//                        rightmenuController.getView('RightMenu')
//                    ], function(view) {
//                        if (view) {
//                            view.setApi(me.api);
//                            view.on('editcomplete', _.bind(me.onEditComplete, me));
//                            view.setMode(me.appOptions);
//                        }
//                    });
//
//                    if (toolbarView) {
//                        toolbarView.on('insertimage', _.bind(me.onInsertImage, me));
//                        toolbarView.on('inserttable', _.bind(me.onInsertTable, me));
//                        toolbarView.on('insertshape', _.bind(me.onInsertShape, me));
//                        toolbarView.on('inserttextart', _.bind(me.onInsertTextArt, me));
//                        toolbarView.on('insertchart', _.bind(me.onInsertChart, me));
//                    }
//
//                    var value = Common.localStorage.getItem('de-settings-unit');
//                    value = (value!==null) ? parseInt(value) : Common.Utils.Metric.getDefaultMetric();
//                    Common.Utils.Metric.setCurrentMetric(value);
//                    me.api.asc_SetDocumentUnits((value==Common.Utils.Metric.c_MetricUnits.inch) ? Asc.c_oAscDocumentUnits.Inch : ((value==Common.Utils.Metric.c_MetricUnits.pt) ? Asc.c_oAscDocumentUnits.Point : Asc.c_oAscDocumentUnits.Millimeter));

                    me.api.asc_registerCallback('asc_onDocumentModifiedChanged', _.bind(me.onDocumentModifiedChanged, me));
                    me.api.asc_registerCallback('asc_onDocumentCanSaveChanged',  _.bind(me.onDocumentCanSaveChanged, me));
                    me.api.asc_registerCallback('asc_onSaveUrl',                 _.bind(me.onSaveUrl, me));
                    me.api.asc_registerCallback('asc_onDownloadUrl',             _.bind(me.onDownloadUrl, me));
                    /** coauthoring begin **/
                    me.api.asc_registerCallback('asc_onCollaborativeChanges',    _.bind(me.onCollaborativeChanges, me));
                    me.api.asc_registerCallback('asc_OnTryUndoInFastCollaborative',_.bind(me.onTryUndoInFastCollaborative, me));
                    me.api.asc_registerCallback('asc_onAuthParticipantsChanged', _.bind(me.onAuthParticipantsChanged, me));
                    me.api.asc_registerCallback('asc_onParticipantsChanged',     _.bind(me.onAuthParticipantsChanged, me));
                    /** coauthoring end **/

                    if (me.stackLongActions.exist({id: ApplyEditRights, type: Asc.c_oAscAsyncActionType['BlockInteraction']})) {
                        me.onLongActionEnd(Asc.c_oAscAsyncActionType['BlockInteraction'], ApplyEditRights);
                    } else if (!this._isDocReady) {
                        me.hidePreloader();
                        me.onLongActionBegin(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);
                    }

                    // Message on window close
                    window.onbeforeunload = _.bind(me.onBeforeUnload, me);
                    window.onunload = _.bind(me.onUnload, me);
                }
            },

            onExternalMessage: function(msg) {
                if (msg && msg.msg) {
                    msg.msg = (msg.msg).toString();
                    uiApp.addNotification({
                        title: 'ONLYOFFICE',
                        message: [msg.msg.charAt(0).toUpperCase() + msg.msg.substring(1)]
                    });

                    Common.component.Analytics.trackEvent('External Error', msg.title);
                }
            },

            onError: function(id, level, errData) {
                this.hidePreloader();
                this.onLongActionEnd(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);

                var config = {
                    closable: false
                };

                switch (id)
                {
                    case Asc.c_oAscError.ID.Unknown:
                        config.msg = this.unknownErrorText;
                        break;

                    case Asc.c_oAscError.ID.ConvertationTimeout:
                        config.msg = this.convertationTimeoutText;
                        break;

                    case Asc.c_oAscError.ID.ConvertationOpenError:
                        config.msg = this.openErrorText;
                        break;

                    case Asc.c_oAscError.ID.ConvertationSaveError:
                        config.msg = this.saveErrorText;
                        break;

                    case Asc.c_oAscError.ID.DownloadError:
                        config.msg = this.downloadErrorText;
                        break;

                    case Asc.c_oAscError.ID.UplImageSize:
                        config.msg = this.uploadImageSizeMessage;
                        break;

                    case Asc.c_oAscError.ID.UplImageExt:
                        config.msg = this.uploadImageExtMessage;
                        break;

                    case Asc.c_oAscError.ID.UplImageFileCount:
                        config.msg = this.uploadImageFileCountMessage;
                        break;

                    case Asc.c_oAscError.ID.SplitCellMaxRows:
                        config.msg = this.splitMaxRowsErrorText.replace('%1', errData.get_Value());
                        break;

                    case Asc.c_oAscError.ID.SplitCellMaxCols:
                        config.msg = this.splitMaxColsErrorText.replace('%1', errData.get_Value());
                        break;

                    case Asc.c_oAscError.ID.SplitCellRowsDivider:
                        config.msg = this.splitDividerErrorText.replace('%1', errData.get_Value());
                        break;

                    case Asc.c_oAscError.ID.VKeyEncrypt:
                        config.msg = this.errorKeyEncrypt;
                        break;

                    case Asc.c_oAscError.ID.KeyExpire:
                        config.msg = this.errorKeyExpire;
                        break;

                    case Asc.c_oAscError.ID.UserCountExceed:
                        config.msg = this.errorUsersExceed;
                        break;

                    case Asc.c_oAscError.ID.CoAuthoringDisconnect:
                        config.msg = (this.appOptions.isEdit) ? this.errorCoAuthoringDisconnect : this.errorViewerDisconnect;
                        break;

                    case Asc.c_oAscError.ID.ConvertationPassword:
                        config.msg = this.errorFilePassProtect;
                        break;

                    case Asc.c_oAscError.ID.StockChartError:
                        config.msg = this.errorStockChart;
                        break;

                    case Asc.c_oAscError.ID.DataRangeError:
                        config.msg = this.errorDataRange;
                        break;

                    case Asc.c_oAscError.ID.Database:
                        config.msg = this.errorDatabaseConnection;
                        break;

                    case Asc.c_oAscError.ID.UserDrop:
                        if (this._state.lostEditingRights) {
                            this._state.lostEditingRights = false;
                            return;
                        }
                        this._state.lostEditingRights = true;
                        config.msg = this.errorUserDrop;
                        break;

                    case Asc.c_oAscError.ID.MailMergeLoadFile:
                        config.msg = this.errorMailMergeLoadFile;
                        break;

                    case Asc.c_oAscError.ID.MailMergeSaveFile:
                        config.msg = this.errorMailMergeSaveFile;
                        break;

                    case Asc.c_oAscError.ID.Warning:
                        config.msg = this.errorConnectToServer;
                        break;

                    default:
                        config.msg = this.errorDefaultMessage.replace('%1', id);
                        break;
                }


                if (level == Asc.c_oAscError.Level.Critical) {

                    // report only critical errors
                    Common.Gateway.reportError(id, config.msg);

                    config.title = this.criticalErrorTitle;
//                    config.iconCls = 'error';

                    if (this.appOptions.canBackToFolder) {
                        config.msg += '</br></br>' + this.criticalErrorExtText;
                        config.callback = function() {
                            Common.NotificationCenter.trigger('goback');
                        }
                    }
                }
                else {
                    config.title    = this.notcriticalErrorTitle;
//                    config.iconCls  = 'warn';
//                    config.buttons  = ['ok'];
                    config.callback = _.bind(function(btn){
                        if (id == Asc.c_oAscError.ID.Warning && btn == 'ok' && (this.appOptions.canDownload || this.appOptions.canDownloadOrigin)) {
                            Common.UI.Menu.Manager.hideAll();
                            if (this.appOptions.isDesktopApp && this.appOptions.isOffline)
                                this.api.asc_DownloadAs();
                            else
                                (this.appOptions.canDownload) ? this.getApplication().getController('LeftMenu').leftMenu.showMenu('file:saveas') : this.api.asc_DownloadOrigin();
                        }
                        this._state.lostEditingRights = false;
                        this.onEditComplete();
                    }, this);
                }

//                Common.UI.alert(config);
                uiApp.modal({
                    title   : config.title,
                    text    : config.msg,
                    buttons: [
                        {
                            text: 'OK',
                            onClick: config.callback
                        }
                    ]
                });

                Common.component.Analytics.trackEvent('Internal Error', id.toString());
            },

            onCoAuthoringDisconnect: function() {
//                this.getApplication().getController('Viewport').getView('Viewport').setMode({isDisconnected:true});
                this._state.isDisconnected = true;
            },

            updateWindowTitle: function(force) {
                var isModified = this.api.isDocumentModified();
                if (this._state.isDocModified !== isModified || force) {
                    var title = this.defaultTitleText;

//                    var headerView = this.getApplication()
//                        .getController('Viewport')
//                        .getView('Common.Views.Header');
//
//                    if (!_.isEmpty(headerView.getDocumentCaption()))
//                        title = headerView.getDocumentCaption() + ' - ' + title;
//
//                    if (isModified) {
//                        if (!_.isUndefined(title) && (!this._state.fastCoauth || this._state.usersCount<2 )) {
//                            title = '* ' + title;
//                            headerView.setDocumentCaption(headerView.getDocumentCaption() + '*', true);
//                        }
//                    } else {
//                        headerView.setDocumentCaption(headerView.getDocumentCaption());
//                    }

                    if (window.document.title != title)
                        window.document.title = title;

                    if (!this._state.fastCoauth || this._state.usersCount<2 )
                        Common.Gateway.setDocumentModified(isModified);
                    else if ( this._state.startModifyDocument!==undefined && this._state.startModifyDocument === isModified){
                        Common.Gateway.setDocumentModified(isModified);
                        this._state.startModifyDocument = (this._state.startModifyDocument) ? !this._state.startModifyDocument : undefined;
                    }

                    this._state.isDocModified = isModified;
                }
            },

            onDocumentModifiedChanged: function() {
                if (this._state.fastCoauth && this._state.usersCount > 1 && this._state.startModifyDocument===undefined )
                    return;

                var isModified = this.api.asc_isDocumentCanSave();
                if (this._state.isDocModified !== isModified) {
                    Common.Gateway.setDocumentModified(this.api.isDocumentModified());
                }

                this.updateWindowTitle();

//                var toolbarView = this.getApplication().getController('Toolbar').getView('Toolbar');
//
//                if (toolbarView) {
//                    var isSyncButton = $('.btn-icon', toolbarView.btnSave.cmpEl).hasClass('btn-synch');
//                    if (toolbarView.btnSave.isDisabled() !== (!isModified && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1))
//                        toolbarView.btnSave.setDisabled(!isModified && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1);
//                }
            },
            onDocumentCanSaveChanged: function (isCanSave) {
//                var application = this.getApplication(),
//                    toolbarController = application.getController('Toolbar'),
//                    toolbarView = toolbarController.getView('Toolbar');
//
//                if (toolbarView && this.api) {
//                    var isSyncButton = $('.btn-icon', toolbarView.btnSave.cmpEl).hasClass('btn-synch');
//                    if (toolbarView.btnSave.isDisabled() !== (!isCanSave && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1))
//                        toolbarView.btnSave.setDisabled(!isCanSave && !isSyncButton || this._state.isDisconnected || this._state.fastCoauth && this._state.usersCount>1);
//                }
            },

            onBeforeUnload: function() {
                Common.localStorage.save();

                if (this.api.isDocumentModified()) {
                    var me = this;
                    this.api.asc_stopSaving();
                    this.continueSavingTimer = window.setTimeout(function() {
                        me.api.asc_continueSaving();
                    }, 500);

                    return this.leavePageText;
                }
            },

            onUnload: function() {
                if (this.continueSavingTimer)
                    clearTimeout(this.continueSavingTimer);
            },

            hidePreloader: function() {
                $('#loading-mask').hide().remove();
            },

            onSaveUrl: function(url) {
                Common.Gateway.save(url);
            },

            onDownloadUrl: function(url) {
                if (this._state.isFromGatewayDownloadAs) {
                    Common.Gateway.downloadAs(url);
                }

                this._state.isFromGatewayDownloadAs = false;
            },

            onUpdateVersion: function(callback) {
                var me = this;
                me.needToUpdateVersion = true;
                me.onLongActionEnd(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);

                uiApp.alert(
                    me.errorUpdateVersion,
                    me.titleUpdateVersion,
                    function () {
                        _.defer(function() {
                            Common.Gateway.updateVersion();

                            if (callback) {
                                callback.call(me);
                            }

                            me.onLongActionBegin(Asc.c_oAscAsyncActionType['BlockInteraction'], LoadingDocument);
                        })
                });
            },

            onCollaborativeChanges: function() {
//                if (this._state.hasCollaborativeChanges) return;
//                this._state.hasCollaborativeChanges = true;
//                if (this.appOptions.isEdit)
//                    this.getApplication().getController('Statusbar').setStatusCaption(this.txtNeedSynchronize);
            },
            /** coauthoring end **/

            synchronizeChanges: function() {
//                this.getApplication().getController('Statusbar').synchronizeChanges();
//                this.getApplication().getController('DocumentHolder').getView('DocumentHolder').hideTips();
//                /** coauthoring begin **/
//                this.getApplication().getController('Toolbar').getView('Toolbar').synchronizeChanges();
//                /** coauthoring end **/
                this._state.hasCollaborativeChanges = false;
            },

            initNames: function() {
                this.shapeGroupNames = [
                    this.txtBasicShapes,
                    this.txtFiguredArrows,
                    this.txtMath,
                    this.txtCharts,
                    this.txtStarsRibbons,
                    this.txtCallouts,
                    this.txtButtons,
                    this.txtRectangles,
                    this.txtLines
                ];
            },

            fillAutoShapes: function(groupNames, shapes){
//                if (_.isEmpty(shapes) || _.isEmpty(groupNames) || shapes.length != groupNames.length)
//                    return;
//
//                var me = this,
//                    shapegrouparray = [],
//                    shapeStore = this.getCollection('ShapeGroups');
//
//                shapeStore.reset();
//
//                var groupscount = groupNames.length;
//                _.each(groupNames, function(groupName, index){
//                    var store = new Backbone.Collection([], {
//                        model: DE.Models.ShapeModel
//                    });
//
//                    var cols = (shapes[index].length) > 18 ? 7 : 6,
//                        height = Math.ceil(shapes[index].length/cols) * 35 + 3,
//                        width = 30 * cols;
//
//                    _.each(shapes[index], function(shape, idx){
//                        store.add({
//                            imageUrl : shape.Image,
//                            data     : {shapeType: shape.Type},
//                            tip      : me.textShape + ' ' + (idx+1),
//                            allowSelected : true,
//                            selected: false
//                        });
//                    });
//
//                    shapegrouparray.push({
//                        groupName   : me.shapeGroupNames[index],
//                        groupStore  : store,
//                        groupWidth  : width,
//                        groupHeight : height
//                    });
//                });
//
//                shapeStore.add(shapegrouparray);
//
//                setTimeout(function(){
//                    me.getApplication().getController('Toolbar').fillAutoShapes();
//                }, 50);

            },

            fillTextArt: function(shapes){
//                if (_.isEmpty(shapes)) return;
//
//                var me = this, arr = [],
//                    artStore = this.getCollection('Common.Collections.TextArt');
//
//                _.each(shapes, function(shape, index){
//                    arr.push({
//                        imageUrl : shape,
//                        data     : index,
//                        allowSelected : true,
//                        selected: false
//                    });
//                });
//                artStore.reset(arr);
//
//                setTimeout(function(){
//                    me.getApplication().getController('Toolbar').fillTextArt();
//                }, 50);
//
//                setTimeout(function(){
//                    me.getApplication().getController('RightMenu').fillTextArt();
//                }, 50);

            },

            updateThemeColors: function() {
//                var me = this;
//                setTimeout(function(){
//                    me.getApplication().getController('RightMenu').UpdateThemeColors();
//                }, 50);
//                setTimeout(function(){
//                    me.getApplication().getController('DocumentHolder').getView('DocumentHolder').updateThemeColors();
//                }, 50);
//
//                setTimeout(function(){
//                    me.getApplication().getController('Toolbar').updateThemeColors();
//                }, 50);
            },

            onSendThemeColors: function(colors, standart_colors) {
               Common.Utils.ThemeColor.setColors(colors, standart_colors);
//                if (window.styles_loaded) {
//                    this.updateThemeColors();
//                    this.fillTextArt(this.api.asc_getTextArtPreviews());
//                }
            },

            loadLanguages: function() {
//                var langs = this.api.asc_getSpellCheckLanguages();
//                this.getApplication().getController('DocumentHolder').getView('DocumentHolder').setLanguages(langs);
//                this.getApplication().getController('Statusbar').setLanguages(langs);
            },

            onAdvancedOptions: function(advOptions) {
//                var type = advOptions.asc_getOptionId(),
//                    me = this, dlg;
//                if (type == Asc.c_oAscAdvancedOptionsID.TXT) {
//                    dlg = new Common.Views.OpenDialog({
//                        type: type,
//                        codepages: advOptions.asc_getOptions().asc_getCodePages(),
//                        settings: advOptions.asc_getOptions().asc_getRecommendedSettings(),
//                        handler: function (encoding) {
//                            me.isShowOpenDialog = false;
//                            if (me && me.api) {
//                                me.api.asc_setAdvancedOptions(type, new Asc.asc_CTXTAdvancedOptions(encoding));
//                                me.loadMask && me.loadMask.show();
//                            }
//                        }
//                    });
//                } else if (type == Asc.c_oAscAdvancedOptionsID.DRM) {
//                    dlg = new Common.Views.OpenDialog({
//                        type: type,
//                        handler: function (value) {
//                            me.isShowOpenDialog = false;
//                            if (me && me.api) {
//                                me.api.asc_setAdvancedOptions(type, new Asc.asc_CDRMAdvancedOptions(value));
//                                me.loadMask && me.loadMask.show();
//                            }
//                        }
//                    });
//                }
//                if (dlg) {
//                    this.isShowOpenDialog = true;
//                    this.loadMask && this.loadMask.hide();
//                    this.onLongActionEnd(Asc.c_oAscAsyncActionType.BlockInteraction, LoadingDocument);
//                    dlg.show();
//                }
            },

            onTryUndoInFastCollaborative: function() {
//                var val = window.localStorage.getItem("de-hide-try-undoredo");
//                if (!(val && parseInt(val) == 1))
//                    Common.UI.info({
//                        width: 500,
//                        msg: this.textTryUndoRedo,
//                        iconCls: 'info',
//                        buttons: ['custom', 'cancel'],
//                        primary: 'custom',
//                        customButtonText: this.textStrict,
//                        dontshow: true,
//                        callback: _.bind(function(btn, dontshow){
//                            if (dontshow) window.localStorage.setItem("de-hide-try-undoredo", 1);
//                            if (btn == 'custom') {
//                                Common.localStorage.setItem("de-settings-coauthmode", 0);
//                                this.api.asc_SetFastCollaborative(false);
//                                this._state.fastCoauth = false;
//                                Common.localStorage.setItem("de-settings-showchanges-strict", 'last');
//                                this.api.SetCollaborativeMarksShowType(Asc.c_oAscCollaborativeMarksShowType.LastChanges);
//                            }
//                            this.fireEvent('editcomplete', this);
//                        }, this)
//                    });
            },

            onAuthParticipantsChanged: function(users) {
                var length = 0;
                _.each(users, function(item){
                    if (!item.asc_getView())
                        length++;
                });
                this._state.usersCount = length;
            },

            applySettings: function() {
                if (this.appOptions.isEdit && this.appOptions.canLicense && !this.appOptions.isOffline && this.appOptions.canCoAuthoring) {
                    var value = Common.localStorage.getItem("de-settings-coauthmode"),
                        oldval = this._state.fastCoauth;
                    this._state.fastCoauth = (value===null || parseInt(value) == 1);
                    if (this._state.fastCoauth && !oldval)
                        this.synchronizeChanges();
                }
            },

            onDocumentName: function(name) {
//                this.getApplication().getController('Viewport').getView('Common.Views.Header').setDocumentCaption(name);
                this.updateWindowTitle(true);
            },

            onPrint: function() {
                if (!this.appOptions.canPrint) return;

                if (this.api)
                    this.api.asc_Print(Common.Utils.isChrome || Common.Utils.isSafari || Common.Utils.isOpera); // if isChrome or isSafari or isOpera == true use asc_onPrintUrl event
                Common.component.Analytics.trackEvent('Print');
            },

            onPrintUrl: function(url) {
                if (this.iframePrint) {
                    this.iframePrint.parentNode.removeChild(this.iframePrint);
                    this.iframePrint = null;
                }
                if (!this.iframePrint) {
                    var me = this;
                    this.iframePrint = document.createElement("iframe");
                    this.iframePrint.id = "id-print-frame";
                    this.iframePrint.style.display = 'none';
                    this.iframePrint.style.visibility = "hidden";
                    this.iframePrint.style.position = "fixed";
                    this.iframePrint.style.right = "0";
                    this.iframePrint.style.bottom = "0";
                    document.body.appendChild(this.iframePrint);
                    this.iframePrint.onload = function() {
                        me.iframePrint.contentWindow.focus();
                        me.iframePrint.contentWindow.print();
                        me.iframePrint.contentWindow.blur();
                        window.focus();
                    };
                }
                if (url) this.iframePrint.src = url;
            },

            leavePageText: 'You have unsaved changes in this document. Click \'Stay on this Page\' then \'Save\' to save them. Click \'Leave this Page\' to discard all the unsaved changes.',
            defaultTitleText: 'ONLYOFFICE Document Editor',
            criticalErrorTitle: 'Error',
            notcriticalErrorTitle: 'Warning',
            errorDefaultMessage: 'Error code: %1',
            criticalErrorExtText: 'Press "Ok" to back to document list.',
            openTitleText: 'Opening Document',
            openTextText: 'Opening document...',
            saveTitleText: 'Saving Document',
            saveTextText: 'Saving document...',
            loadFontsTitleText: 'Loading Data',
            loadFontsTextText: 'Loading data...',
            loadImagesTitleText: 'Loading Images',
            loadImagesTextText: 'Loading images...',
            loadFontTitleText: 'Loading Data',
            loadFontTextText: 'Loading data...',
            loadImageTitleText: 'Loading Image',
            loadImageTextText: 'Loading image...',
            downloadTitleText: 'Downloading Document',
            downloadTextText: 'Downloading document...',
            printTitleText: 'Printing Document',
            printTextText: 'Printing document...',
            uploadImageTitleText: 'Uploading Image',
            uploadImageTextText: 'Uploading image...',
            savePreparingText: 'Preparing to save',
            savePreparingTitle: 'Preparing to save. Please wait...',
            uploadImageSizeMessage: 'Maximium image size limit exceeded.',
            uploadImageExtMessage: 'Unknown image format.',
            uploadImageFileCountMessage: 'No images uploaded.',
            reloadButtonText: 'Reload Page',
            unknownErrorText: 'Unknown error.',
            convertationTimeoutText: 'Convertation timeout exceeded.',
            downloadErrorText: 'Download failed.',
            unsupportedBrowserErrorText : 'Your browser is not supported.',
            splitMaxRowsErrorText: 'The number of rows must be less than %1',
            splitMaxColsErrorText: 'The number of columns must be less than %1',
            splitDividerErrorText: 'The number of rows must be a divisor of %1',
            requestEditFailedTitleText: 'Access denied',
            requestEditFailedMessageText: 'Someone is editing this document right now. Please try again later.',
            txtNeedSynchronize: 'You have an updates',
            textLoadingDocument: 'Loading document',
            warnBrowserZoom: 'Your browser\'s current zoom setting is not fully supported. Please reset to the default zoom by pressing Ctrl+0.',
            warnBrowserIE9: 'The application has low capabilities on IE9. Use IE10 or higher',
            applyChangesTitleText: 'Loading Data',
            applyChangesTextText: 'Loading data...',
            errorKeyEncrypt: 'Unknown key descriptor',
            errorKeyExpire: 'Key descriptor expired',
            errorUsersExceed: 'Count of users was exceed',
            errorCoAuthoringDisconnect: 'Server connection lost. You can\'t edit anymore.',
            errorFilePassProtect: 'The document is password protected.',
            txtBasicShapes: 'Basic Shapes',
            txtFiguredArrows: 'Figured Arrows',
            txtMath: 'Math',
            txtCharts: 'Charts',
            txtStarsRibbons: 'Stars & Ribbons',
            txtCallouts: 'Callouts',
            txtButtons: 'Buttons',
            txtRectangles: 'Rectangles',
            txtLines: 'Lines',
            txtEditingMode: 'Set editing mode...',
            textAnonymous: 'Anonymous',
            loadingDocumentTitleText: 'Loading document',
            loadingDocumentTextText: 'Loading document...',
            warnProcessRightsChange: 'You have been denied the right to edit the file.',
            errorProcessSaveResult: 'Saving is failed.',
            textCloseTip: '\nClick to close the tip.',
            textShape: 'Shape',
            errorStockChart: 'Incorrect row order. To build a stock chart place the data on the sheet in the following order:<br> opening price, max price, min price, closing price.',
            errorDataRange: 'Incorrect data range.',
            errorDatabaseConnection: 'External error.<br>Database connection error. Please, contact support.',
            titleUpdateVersion: 'Version changed',
            errorUpdateVersion: 'The file version has been changed. The page will be reloaded.',
            errorUserDrop: 'The file cannot be accessed right now.',
            txtDiagramTitle: 'Chart Title',
            txtXAxis: 'X Axis',
            txtYAxis: 'Y Axis',
            txtSeries: 'Seria',
            errorMailMergeLoadFile: 'Loading failed',
            mailMergeLoadFileText: 'Loading Data Source...',
            mailMergeLoadFileTitle: 'Loading Data Source',
            errorMailMergeSaveFile: 'Merge failed.',
            downloadMergeText: 'Downloading...',
            downloadMergeTitle: 'Downloading',
            sendMergeTitle: 'Sending Merge',
            sendMergeText: 'Sending Merge...',
            txtArt: 'Your text here',
            errorConnectToServer: ' The document could not be saved. Please check connection settings or contact your administrator.<br>When you click the \'OK\' button, you will be prompted to download the document.<br><br>' +
                'Find more information about connecting Document Server <a href=\"https://api.onlyoffice.com/editors/callback\" target=\"_blank\">here</a>',
            textTryUndoRedo: 'The Undo/Redo functions are disabled for the Fast co-editing mode.<br>Click the \'Strict mode\' button to switch to the Strict co-editing mode to edit the file without other users interference and send your changes only after you save them. You can switch between the co-editing modes using the editor Advanced settings.',
            textStrict: 'Strict mode',
            txtErrorLoadHistory: 'Loading history failed',
            textBuyNow: 'Visit website',
            textNoLicenseTitle: 'ONLYOFFICE open source version',
            warnNoLicense: 'You are using an open source version of ONLYOFFICE. The version has limitations for concurrent connections to the document server (20 connections at a time).<br>If you need more please consider purchasing a commercial license.',
            textContactUs: 'Contact sales',
            errorViewerDisconnect: 'Connection is lost. You can still view the document,<br>but will not be able to download until the connection is restored.',
            warnLicenseExp: 'Your license has expired.<br>Please update your license and refresh the page.',
            titleLicenseExp: 'License expired',
            openErrorText: 'An error has occurred while opening the file',
            saveErrorText: 'An error has occurred while saving the file'
        }
    })(), DE.Controllers.Main || {}))
});