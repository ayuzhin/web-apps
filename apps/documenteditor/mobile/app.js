/**
 *  app.js
 *
 *  Created by Alexander Yuzhin on 9/21/16
 *  Copyright (c) 2016 Ascensio System SIA. All rights reserved.
 *
 */

'use strict';
require.config({
    baseUrl: '../../',
    paths: {
        jquery          : '../vendor/jquery/jquery',
        underscore      : '../vendor/underscore/underscore',
        backbone        : '../vendor/backbone/backbone',
        framework7      : '../vendor/framework7/js/framework7',
        text            : '../vendor/requirejs-text/text',
        xregexp         : '../vendor/xregexp/xregexp-all-min',
        sockjs          : '../vendor/sockjs/sockjs.min',
        jszip           : '../vendor/jszip/jszip.min',
        jsziputils      : '../vendor/jszip-utils/jszip-utils.min',
        jsrsasign       : '../vendor/jsrsasign/jsrsasign-latest-all-min',
        api             : 'api/documents/api',
        core            : 'common/main/lib/core/application',
        extendes        : 'common/main/lib/core/extendes',
        notification    : 'common/main/lib/core/NotificationCenter',
        localstorage    : 'common/main/lib/util/LocalStorage',
        analytics       : 'common/Analytics',
        gateway         : 'common/Gateway',
        locale          : 'common/locale',
        irregularstack  : 'common/IrregularStack',
        sharedsettings  : 'common/mobile/utils/SharedSettings'
    },

    shim: {
        framework7: {
            exports: 'Framework7'
        },
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        notification: {
            deps: [
                'backbone'
            ]
        },
        core: {
            deps: [
                'backbone',
                'notification',
                'irregularstack',
                'sharedsettings'
            ]
        },
        extendes: {
            deps: [
                'underscore',
                'jquery',
                'framework7'
            ]
        },
        gateway: {
            deps: [
                'jquery'
            ]
        },
        analytics: {
            deps: [
                'jquery'
            ]
        }
    }
});

require([
    'backbone',
    'framework7',
    'core',
    'extendes',
    'api',
    'analytics',
    'gateway',
    'locale',
    'jszip',
    'jsziputils',
    'jsrsasign',
    'sockjs',
    'underscore'
], function (Backbone, Framework7, Core) {
    Backbone.history.start();

    /**
     * Application instance with DE namespace defined
     */
    var app = new Backbone.Application({
        nameSpace: 'DE',
        autoCreate: false,
        controllers : [
            'Editor',
            'Toolbar',
            'Main',
            'Settings',
            'EditContainer',
            'EditText',
            'EditParagraph',
            'EditTable',
            'EditImage',
            'EditShape',
            'AddContainer',
            'AddTable',
            'AddShape',
            'AddImage',
            'AddOther'
        ]
    });

    Common.Locale.apply();

    var device = Framework7.prototype.device;
    var loadPlatformCss = function (filename, opt){
        var fileref = document.createElement('link');
        fileref.setAttribute('rel', 'stylesheet');
        fileref.setAttribute('type', 'text/css');
        fileref.setAttribute('href', filename);

        if (typeof fileref != 'undefined') {
            document.getElementsByTagName("head")[0].appendChild(fileref);
        }
    };

    //Store Framework7 initialized instance for easy access
    window.uiApp = new Framework7({
        // Default title for modals
        modalTitle: 'ONLYOFFICE',

        // If it is webapp, we can enable hash navigation:
//        pushState: false,

        // If Android
        material: device.android,

        // Hide and show indicator during ajax requests
        onAjaxStart: function (xhr) {
            uiApp.showIndicator();
        },
        onAjaxComplete: function (xhr) {
            uiApp.hideIndicator();
        }
    });

    //Export DOM7 to local variable to make it easy accessable
    window.$$ = Dom7;

    //Load platform styles
    loadPlatformCss('resources/css/app-' + (device.android ? 'material' : 'ios') + '.css');

    require([
        'common/main/lib/util/LocalStorage',
        'common/main/lib/util/utils',
        'documenteditor/mobile/app/controller/Editor',
        'documenteditor/mobile/app/controller/Toolbar',
        'documenteditor/mobile/app/controller/Main',
        'documenteditor/mobile/app/controller/Settings',
        'documenteditor/mobile/app/controller/edit/EditContainer',
        'documenteditor/mobile/app/controller/edit/EditText',
        'documenteditor/mobile/app/controller/edit/EditParagraph',
        'documenteditor/mobile/app/controller/edit/EditTable',
        'documenteditor/mobile/app/controller/edit/EditImage',
        'documenteditor/mobile/app/controller/edit/EditShape',
        'documenteditor/mobile/app/controller/add/AddContainer',
        'documenteditor/mobile/app/controller/add/AddTable',
        'documenteditor/mobile/app/controller/add/AddShape',
        'documenteditor/mobile/app/controller/add/AddImage',
        'documenteditor/mobile/app/controller/add/AddOther'

    ], function() {
        app.start();
    });
}, function(err) {
    if (err.requireType == 'timeout' && !reqerr) {
        var getUrlParams = function() {
            var e,
                a = /\+/g,  // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
                q = window.location.search.substring(1),
                urlParams = {};

            while (e = r.exec(q))
                urlParams[d(e[1])] = d(e[2]);

            return urlParams;
        };

        var encodeUrlParam = function(str) {
            return str.replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        var lang = (getUrlParams()["lang"] || 'en').split("-")[0];

        if ( lang == 'de')      reqerr = 'Die Verbindung ist zu langsam, einige Komponenten konnten nicht geladen werden. Aktualisieren Sie bitte die Seite.';
        else if ( lang == 'es') reqerr = 'La conexión es muy lenta, algunos de los componentes no han podido cargar. Por favor recargue la página.';
        else if ( lang == 'fr') reqerr = 'La connexion est trop lente, certains des composants n\'ons pas pu être chargé. Veuillez recharger la page.';
        else if ( lang == 'ru') reqerr = 'Слишком медленное соединение, не удается загрузить некоторые компоненты. Пожалуйста, обновите страницу.';
        else reqerr = 'The connection is too slow, some of the components could not be loaded. Please reload the page.';

        window.alert(reqerr);
        window.location.reload();
    }
});