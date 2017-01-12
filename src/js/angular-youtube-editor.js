/// <reference path="../../../minute/_all.d.ts" />
var Minute;
(function (Minute) {
    var AngularYouTubeEditor = (function () {
        function AngularYouTubeEditor() {
            this.$get = function ($rootScope, $timeout, $q, $interval, $ui) {
                var service = { ready: false };
                var template = "\n            <div class=\"box box-lg\">\n                <div class=\"box-header with-border\">\n                    <b class=\"pull-left\"><span translate=\"\">Cut YouTube video</span></b>\n                    <a class=\"pull-right close-button\" href=\"\"><i class=\"fa fa-times\"></i></a>\n                    <div class=\"clearfix\"></div>\n                </div>\n    \n                <div class=\"box-body\">\n                    <div class=\"embed-responsive embed-responsive-16by9\">\n                        <youtube-video class=\"embed-responsive-item\" video-url=\"data.videoUrl\" player=\"data.player\" player-vars=\"data.playerVars\"></youtube-video>\n                        <span style=\"position: absolute;\" class=\"badge text-lg\">{{toSeconds(getCurrentTime())}}</span>\n                    </div>\n    \n                    <div>\n                        <rzslider rz-slider-model=\"data.video.startTime\" rz-slider-high=\"data.video.endTime\" rz-slider-options=\"data.slider.options\"></rzslider>\n                    </div>\n    \n                    <p class=\"hidden-xs\">&nbsp;</p>\n    \n                    <div class=\"panel panel-default hidden-xs\">\n                        <div class=\"panel-body\">\n                            <form class=\"form-inline\">\n                                <div class=\"form-group\">\n                                    <label>Start time: </label>\n    \n                                    <input type=\"number\" ng-model=\"data.video.startTime\" min=\"0\" max=\"{{(data.video.duration||9999)-1}}\" class=\"form-control input-sm\" placeholder=\"sec\">\n                                </div>\n    \n                                &nbsp;&nbsp;\n    \n                                <div class=\"form-group\">\n                                    <label>End time: </label>\n    \n                                    <input type=\"number\" ng-model=\"data.video.endTime\" min=\"{{(data.video.startTime || 0)+1}}\" max=\"{{(data.video.duration||9999)}}\" class=\"form-control input-sm\"\n                                               placeholder=\"sec\">\n                                </div>\n    \n                                &nbsp;&nbsp;\n    \n                                <div class=\"form-group\">\n                                    <label>Volume: </label>\n    \n                                    <input type=\"number\" ng-model=\"data.video.volume\" min=\"0\" max=\"100\" class=\"form-control input-sm\" placeholder=\"vol\">\n                                </div>\n    \n                                &nbsp;&nbsp;\n    \n                                <button type=\"submit\" class=\"btn btn-flat btn-default btn-sm\" ng-click=\"seek(data.video.startTime, 'playVideo')\"><i class=\"fa fa-bolt\"></i> Test</button>\n                            </form>\n                        </div>\n                    </div>\n                </div>\n    \n                <div class=\"box-footer with-border\">\n                    <div class=\"pull-left hidden-xs\" ng-show=\"data.video.endTime - data.video.startTime > 20\">\n                        <p class=\"help-block\">\n                            <i class=\"fa fa-exclamation-triangle\"></i> <span class=\"text-danger\" translate=\"\">Videos longer than 20s may not qualify for fair-use!</span>\n                            <a href=\"\" google-search=\"fair use\"><i class=\"fa fa-question-circle\"></i></a>\n                        </p>\n                    </div>\n                    <button type=\"button\" class=\"btn btn-flat btn-primary pull-right\" ng-click=\"cutVideo()\">\n                        <i class=\"fa fa-scissors\"></i> <span translate>Cut video</span>\n                    </button>\n                </div>\n            </div>\n            ";
                service.cutVideo = function (videoUrl, args) {
                    if (args === void 0) { args = { startTime: 0, endTime: 9999, volume: 100 }; }
                    var $scope = $rootScope.$new(true);
                    var deferred = $q.defer();
                    $scope.data = {
                        videoUrl: videoUrl,
                        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showInfo: 0 },
                        video: args,
                        slider: {
                            options: {
                                floor: 0,
                                ceil: 100,
                                step: 1,
                                minRange: 1,
                                pushRange: true,
                                draggableRange: true,
                                showTicksValues: 10,
                                translate: function (value) {
                                    return $scope.toSeconds(value);
                                }
                            }
                        }
                    };
                    $scope.interval = $interval(function () {
                        $scope.data.currentTime = $scope.getCurrentTime();
                    }, 1000);
                    $scope.toSeconds = function (value) {
                        return window['moment']("2015-01-01").startOf('day').seconds(Math.max(0, value)).format('H:mm:ss');
                    };
                    $scope.getCurrentTime = function () {
                        return $scope.data.player && $scope.data.player.hasOwnProperty('getCurrentTime') ? $scope.data.player.getCurrentTime() : 0;
                    };
                    $scope.$watch('data.video.startTime + data.player.seekTo', function () {
                        $scope.seek($scope.data.video.startTime, 'pauseVideo');
                    }, true);
                    $scope.$watch('data.video.endTime + data.player.seekTo', function () {
                        if (!$scope.data.video.endTime || ($scope.data.video.endTime < $scope.data.video.startTime)) {
                            $scope.data.video.endTime = $scope.data.video.startTime + 1;
                        }
                        $scope.seek($scope.data.video.endTime, 'pauseVideo');
                    }, true);
                    $scope.$watch('data.video.volume', function (value) {
                        if ($scope.data.player && $scope.data.player.hasOwnProperty('setVolume')) {
                            $scope.data.player.setVolume(value);
                        }
                    });
                    $scope.$watch('data.currentTime', function (time) {
                        if (time > $scope.data.video.endTime) {
                            $scope.seek($scope.data.video.startTime);
                        }
                    });
                    $scope.seek = function (value, force) {
                        if (force === void 0) { force = ''; }
                        if ($scope.data.player && $scope.data.player.hasOwnProperty('seekTo')) {
                            if (force && $scope.data.ready) {
                                $scope.data.player[force]();
                            }
                            $scope.data.player.seekTo(value);
                        }
                    };
                    $scope.$on('youtube.player.ready', function ($event, player) {
                        var duration = player.getDuration();
                        $scope.data.video.duration = duration;
                        $scope.data.slider.options.ceil = duration;
                        $scope.data.slider.options.showTicksValues = $(document).width() > 800 ? Math.floor(duration / 10) : false;
                    });
                    $scope.$on('youtube.player.ended', function () {
                        $scope.seek($scope.data.video.startTime);
                    });
                    $scope.cutVideo = function () {
                        deferred.resolve($scope.data.video);
                        $scope.hide();
                    };
                    $scope.$on('youtube.player.playing', function () { return $scope.data.ready = true; });
                    $ui.popup(template, false, $scope).then(function () {
                        $interval.cancel($scope.interval);
                    });
                    return deferred.promise;
                };
                service.init = function () {
                    return service;
                };
                return service.init();
            };
            this.$get.$inject = ['$rootScope', '$timeout', '$q', '$interval', '$ui'];
        }
        return AngularYouTubeEditor;
    }());
    Minute.AngularYouTubeEditor = AngularYouTubeEditor;
    angular.module('AngularYouTubeEditor', ['MinuteFramework', 'youtube-embed', 'rzModule'])
        .provider("$youtube", AngularYouTubeEditor);
})(Minute || (Minute = {}));
