/// <reference path="../../../minute/_all.d.ts" />
module Minute {
    export class AngularYouTubeEditor implements ng.IServiceProvider {
        constructor() {
            this.$get.$inject = ['$rootScope', '$timeout', '$q', '$interval', '$ui'];
        }

        $get = ($rootScope: ng.IRootScopeService, $timeout: ng.ITimeoutService, $q: ng.IQService, $interval: ng.IIntervalService, $ui: any) => {
            let service: any = {ready: false};
            let template = `
            <div class="box box-lg">
                <div class="box-header with-border">
                    <b class="pull-left"><span translate="">Cut YouTube video</span></b>
                    <a class="pull-right close-button" href=""><i class="fa fa-times"></i></a>
                    <div class="clearfix"></div>
                </div>
    
                <div class="box-body">
                    <div class="embed-responsive embed-responsive-16by9">
                        <youtube-video class="embed-responsive-item" video-url="data.videoUrl" player="data.player" player-vars="data.playerVars"></youtube-video>
                        <span style="position: absolute;" class="badge text-lg">{{toSeconds(getCurrentTime())}}</span>
                    </div>
    
                    <div>
                        <rzslider rz-slider-model="data.video.startTime" rz-slider-high="data.video.endTime" rz-slider-options="data.slider.options"></rzslider>
                    </div>
    
                    <p class="hidden-xs">&nbsp;</p>
    
                    <div class="panel panel-default hidden-xs">
                        <div class="panel-body">
                            <form class="form-inline">
                                <div class="form-group">
                                    <label>Start time: </label>
    
                                    <input type="number" ng-model="data.video.startTime" min="0" max="{{(data.video.duration||9999)-1}}" class="form-control input-sm" placeholder="sec">
                                </div>
    
                                &nbsp;&nbsp;
    
                                <div class="form-group">
                                    <label>End time: </label>
    
                                    <input type="number" ng-model="data.video.endTime" min="{{(data.video.startTime || 0)+1}}" max="{{(data.video.duration||9999)}}" class="form-control input-sm"
                                               placeholder="sec">
                                </div>
    
                                &nbsp;&nbsp;
    
                                <div class="form-group">
                                    <label>Volume: </label>
    
                                    <input type="number" ng-model="data.video.volume" min="0" max="100" class="form-control input-sm" placeholder="vol">
                                </div>
    
                                &nbsp;&nbsp;
    
                                <button type="submit" class="btn btn-flat btn-default btn-sm" ng-click="seek(data.video.startTime, 'playVideo')"><i class="fa fa-bolt"></i> Test</button>
                            </form>
                        </div>
                    </div>
                </div>
    
                <div class="box-footer with-border">
                    <div class="pull-left hidden-xs" ng-show="data.video.endTime - data.video.startTime > 20">
                        <p class="help-block">
                            <i class="fa fa-exclamation-triangle"></i> <span class="text-danger" translate="">Videos longer than 20s may not qualify for fair-use!</span>
                            <a href="" google-search="fair use"><i class="fa fa-question-circle"></i></a>
                        </p>
                    </div>
                    <button type="button" class="btn btn-flat btn-primary pull-right" ng-click="cutVideo()">
                        <i class="fa fa-scissors"></i> <span translate>Cut video</span>
                    </button>
                </div>
            </div>
            `;

            service.cutVideo = (videoUrl: string, args: any = {startTime: 0, endTime: 9999, volume: 100}) => {
                let $scope: any = $rootScope.$new(true);
                let deferred = $q.defer();

                $scope.data = {
                    videoUrl: videoUrl,
                    playerVars: {autoplay: 1, controls: 0, modestbranding: 1, rel: 0, showInfo: 0},
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

                $scope.interval = $interval(() => {
                    $scope.data.currentTime = $scope.getCurrentTime();
                }, 1000);

                $scope.toSeconds = (value) => {
                    return window['moment']("2015-01-01").startOf('day').seconds(Math.max(0, value)).format('H:mm:ss');
                };

                $scope.getCurrentTime = () => {
                    return $scope.data.player && $scope.data.player.hasOwnProperty('getCurrentTime') ? $scope.data.player.getCurrentTime() : 0;
                };

                $scope.$watch('data.video.startTime + data.player.seekTo', () => {
                    $scope.seek($scope.data.video.startTime, 'pauseVideo');
                }, true);

                $scope.$watch('data.video.endTime + data.player.seekTo', () => {
                    if (!$scope.data.video.endTime || ($scope.data.video.endTime < $scope.data.video.startTime)) {
                        $scope.data.video.endTime = $scope.data.video.startTime + 1;
                    }

                    $scope.seek($scope.data.video.endTime, 'pauseVideo');
                }, true);

                $scope.$watch('data.video.volume', (value) => {
                    if ($scope.data.player && $scope.data.player.hasOwnProperty('setVolume')) {
                        $scope.data.player.setVolume(value);
                    }
                });

                $scope.$watch('data.currentTime', (time) => {
                    if (time > $scope.data.video.endTime) {
                        $scope.seek($scope.data.video.startTime);
                    }
                });

                $scope.seek = (value, force = '') => {
                    if ($scope.data.player && $scope.data.player.hasOwnProperty('seekTo')) {
                        if (force && $scope.data.ready) {
                            $scope.data.player[force]();
                        }

                        $scope.data.player.seekTo(value);
                    }
                };

                $scope.$on('youtube.player.ready', function ($event, player) {
                    let duration = player.getDuration();
                    $scope.data.video.duration = duration;
                    $scope.data.slider.options.ceil = duration;
                    $scope.data.slider.options.showTicksValues = $(document).width() > 800 ? Math.floor(duration / 10) : false;
                });

                $scope.$on('youtube.player.ended', function () {
                    $scope.seek($scope.data.video.startTime);
                });

                $scope.cutVideo = () => {
                    deferred.resolve($scope.data.video);
                    $scope.hide();
                };

                $scope.$on('youtube.player.playing', () => $scope.data.ready = true);

                $ui.popup(template, false, $scope).then(() => {
                    $interval.cancel($scope.interval);
                });

                return deferred.promise;
            };

            service.init = () => {
                return service;
            };

            return service.init();
        }
    }

    angular.module('AngularYouTubeEditor', ['MinuteFramework', 'youtube-embed', 'rzModule'])
        .provider("$youtubeEditor", AngularYouTubeEditor);
}