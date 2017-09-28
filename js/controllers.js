const TIMEOUT_SECONDS = 10;
const UI_TIMER_MILLISECONDS = 1000;
const MINUTE_IN_SECONDS = 60;
var myApp = angular.module('myApp', []);

myApp.controller('MyController', ['$scope', '$http', '$interval',
    function ($scope, $http, $interval) {
        // Retrieve data
        $scope.load = function () {
            var _data = localStorage.getItem($scope.load_code);
            if (_data != null) {
                $scope.records = JSON.parse(_data);
                // Sort records by key
                if ($scope.records.length > 1)
                    $scope.records.sort(function (_x, _y) {
                        return new Date('2017/08/23 ' + _x) - new Date('2017/08/23 ' + _y);
                    });
            }
        }
        $scope.debug = false;

        $scope.timer_value = 0;
        $scope.wpm_timer_value = 0;
        $scope.text_input = "";
        var _timer, _wpm_timer, _text;
        var auto_factor = 1;

        // Handler definition: data transfer to server
        var serverHandler = function () {
            if ($scope.timer_value < TIMEOUT_SECONDS)
                $scope.timer_value++;
            else {
                auto_factor = 1;
                $interval.cancel(_timer);
                $interval.cancel(_wpm_timer);
                _wpm_timer = null;
                analyze();
            }
        }

        var wpmHandler = function () {
            $scope.wpm_timer_value++;
        }

        // User interaction handler
        $scope.change = function () {
            if (_wpm_timer == null)
                _wpm_timer = $interval(wpmHandler, UI_TIMER_MILLISECONDS);
            $scope.timer_value = 0;
            _text = $scope.text_input;
            $interval.cancel(_timer);

            if (_text.length < 1) {
                return;
            }
            _timer = $interval(serverHandler, UI_TIMER_MILLISECONDS);
        }


        function analyze() {
            console.log(">> Processing.. "); //
            $scope.timer_value = null;
            $scope.text_input = "";

            if(typeof($scope.records) == "undefined") {
                $scope.records = {};
            }
            // Time
            var _time = new Date().toLocaleTimeString();

            $scope.records[_time] = {};
            // Word Count
            var _words = _text.replace( /\n/g, " " ).split(/[\W]+/);
            var _word_count = _words.length - 1;
            $scope.records[_time]["wc"] = _word_count;

            // WPM
            var _total_minutes = ($scope.wpm_timer_value - TIMEOUT_SECONDS*auto_factor) / MINUTE_IN_SECONDS;
            /*if(_total_minutes > 1.0)
                _total_minutes = _total_minutes - 1;*/
            var _char_count = _text.length;
            var _wpm = (_char_count / 5.0) / (_total_minutes);
            _wpm = Math.round(_wpm);
            $scope.records[_time]["wpm"] = _wpm;
            $scope.wpm_timer_value = 0;

            // Word Frequency
            var freq_map = {};
            var _tfw = "";
            _words.forEach(function (_word) {
                var _w = _word.toLowerCase();
              // Frequency map construction
                if (freq_map[_w])
                    freq_map[_w]++;
                else
                    freq_map[_w] = 1;
            });

            // Top frequency word II
            var max = 0;
            for(var key in freq_map){
                if(max < freq_map[key]) {
                    max = freq_map[key];
                    _tfw = key;
                }
            }

            $scope.records[_time]["tfw"] = _tfw;
            // console.log(_time + "| " + _word_count + "| " + _wpm + "| " + tfw);
            // console.log(JSON.stringify($scope.records));

        }

        /* Save data
            * "Web storage is more secure [than cookies], and large amounts of data can be stored locally,
            * without affecting website performance." w3schools.com
        */
        $scope.share = function () {
            $scope.share_code = Math.random().toString(36).slice(8);
            localStorage.setItem($scope.share_code, JSON.stringify($scope.records));
        }

        $scope.submitNow = function () {
            auto_factor = 0;
            $interval.cancel(_timer);
            $interval.cancel(_wpm_timer);
            _wpm_timer = null;
            analyze();
        }
    }]);    // End of SCOPE

/* Custom directive
* Reference: https://stackoverflow.com/questions/30946624/how-to-use-ngchange-on-a-div-or-something-similar
*/
myApp.directive('contenteditable', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, elm, attr, ngModel) {

            function updateViewValue() {
                ngModel.$setViewValue(this.innerText);
            }

            /* Binding editable div(alt for textarea) to keyup
            */
            elm.on('keyup', updateViewValue);

            scope.$on('$destroy', function () {
                elm.off('keyup', updateViewValue);
            });

            ngModel.$render = function () {
                elm.html(ngModel.$viewValue);
            }

        }
    }
});
