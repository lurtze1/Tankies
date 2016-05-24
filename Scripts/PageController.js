/**
 * Created by Youri van Dorp on 3/31/2016.
 */
var PageApp = angular.module('PageApp', ['ngRoute']);

PageApp.config(function($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl : 'pages/MainMenu.html',
            controller  : 'MainMenuController'
        })

        .when('/HowToPlay', {
            templateUrl : 'pages/HowToPlay.html',
            controller  : 'HowToPlayController'
        })

        .when('/Credits', {
            templateUrl : 'pages/Credits.html',
            controller  : 'CreditsController'
        })
        .when('/Game', {
            templateUrl : 'pages/Game.html',
            controller  : 'GameController'
        })

        .otherwise({redirectTo: '/'});
});

PageApp.controller('MainMenuController', function($scope) {

});

PageApp.controller('HowToPlayController', function($scope) {

});

PageApp.controller('CreditsController', function($scope) {

});
PageApp.controller('GameController', function($scope) {

});
