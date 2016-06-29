/**
 * Created by Youri van Dorp on 3/31/2016.
 */
var PageApp = angular.module('PageApp', ['ngRoute']);

PageApp.config(function($routeProvider) {
    $routeProvider

        .when('/', {
            templateUrl : 'client/pages/MainMenu.html',
            controller  : 'MainMenuController'
        })

        .when('/HowToPlay', {
            templateUrl : 'client/pages/HowToPlay.html',
            controller  : 'HowToPlayController'
        })

        .when('/Credits', {
            templateUrl : 'client/pages/Credits.html',
            controller  : 'CreditsController'
        })
        .when('/Game', {
            templateUrl : 'client/pages/Game.html',
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
