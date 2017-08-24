var myApp = angular.module('myApp', []);

myApp.controller('MyController', ['$scope', '$http', '$interval',
    function ($scope, $http, $interval) {
        // Retrieve data
        // $http.get('js/data_w3s.json').success(function (data) {
            // $scope.records = data;
            // var json_parsed = JSON.parse(localStorage.getItem('ShareData'));
            // $scope.records = JSON.stringify(json_parsed);
            $scope.records = JSON.parse(localStorage.getItem('ShareData'));
            // Sort records by key
            if ($scope.records.length > 1)
                $scope.records.sort(function (_x, _y) {
                    return new Date('2017/08/23 ' + _x) - new Date('2017/08/23 ' + _y);
                });
        // });
        // Handler definition: data transfer to server
        $scope.timer_value = 0;
        $scope.wpm_timer_value = 0;
        var _timer, _wpm_timer, _text;
        var _doTimeWpm = true;

        //TODO: change timer limit to 60
        var serverHandler = function () {
            if ($scope.timer_value < 60)
                $scope.timer_value++;
            else {
                $interval.cancel(_timer);
                console.log(">> Sending data..");
                analyze();
            }
        }

        var wpmHandler = function () {
            $scope.wpm_timer_value ++;
        }

        // User interaction handler
        $scope.change = function () {
            // if (_doTimeWpm) {
            // _doTimeWpm = true;
            // $interval.cancel(_wpm_timer);
            if (_wpm_timer == null)
                _wpm_timer = $interval(wpmHandler, 1000);
            // }
            // _doTimeWpm = false;

            $scope.timer_value = 0;
            _text = $scope.usertext;
            $interval.cancel(_timer);

            if (_text.length < 1) {
                return;
            }

            // if ($scope.timer == 0)
            _timer = $interval(serverHandler, 1000); // call callback fn every 1 sec
        }


        function analyze() {
            console.log(">> Processing.. "); //
            var json_obj = {};
            // Time
            var _time = new Date().toLocaleTimeString();
            json_obj[_time] = {};

            // Word Count
            var _words = _text.split(/[\W]+/);
            var _word_count = _words.length;
            json_obj[_time]["wc"] = _word_count;

            // WPM
            var _total_minutes = $scope.wpm_timer_value / 60;
            var _char_count = _text.length;
            var _wpm = (_char_count / 5.0) / (_total_minutes-1);
            _wpm = Math.round(_wpm);
            json_obj[_time]["wpm"] = _wpm;

            // Word Frequency
            var freq_map = {};
            var _tfw = "";
            _words.forEach( function(_word) {
                var _w = _word.toLowerCase();
                // Top frequency word
                if (_tfw == "")
                    _tfw = _w;
                else if(freq_map[_w] && freq_map[_w] > freq_map[_tfw])
                    _tfw = _w;
                // Frequency map construction
                if(freq_map[_w])
                    freq_map[_w] ++;
                else
                    freq_map[_w] = 1;
            });
            json_obj[_time]["tfw"] = _tfw;
            // console.log(_time + "| " + _word_count + "| " + _wpm + "| " + tfw);
            // console.log(JSON.stringify(json_obj));
            localStorage.setItem("ShareData", JSON.stringify(json_obj));
        }
    }]);

// Custom directive
// Reference: https://stackoverflow.com/questions/30946624/how-to-use-ngchange-on-a-div-or-something-similar
myApp.directive('contenteditable', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, elm, attr, ngModel) {

            function updateViewValue() {
                ngModel.$setViewValue(this.textContent);
            }

            //Binding it to keyup, lly bind it to any other events of interest
            //like change etc..
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