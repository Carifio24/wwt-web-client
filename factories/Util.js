﻿wwt.app.factory('Util', ['$rootScope', function ($rootScope) {
	var api = {
		getClassificationText: getClassificationText,
		getAstroDetails: getAstroDetails,
		formatDecimalHours: formatDecimalHours,
		formatHms: formatHms,
		drawCircleOverPlace: drawCircleOverPlace,
		getIsPlanet: getIsPlanet,
		secondsToTime: secondsToTime,
		getQSParam: getQSParam,
		getImageset: getImageset,
		getCreditsText: getCreditsText,
		getCreditsUrl: getCreditsUrl,
		isAccelDevice: isAccelDevice,
		isMobile:  $('body').hasClass('mobile'),
		isStaging: function() {
			return location.href.indexOf('worldwidetelescope') === -1;
		},
		nav: nav,
		log: log,
		resetCamera: resetCamera,
		toggleFullScreen: toggleFullScreen,
		getImageSetType: getImageSetType,
		trackViewportChanges: trackViewportChanges,
		parseHms:parseHms
};
	var fullscreen = false;
	function getClassificationText(clsid) {
		if (clsid && !isNaN(parseInt(clsid))) {
			var str;
			$.each(wwtlib.Classification, function (k, v) {
				if (v === clsid) {
					str = k;
				}
			});
			var out = str.replace(/^\s*/, ""); // strip leading spaces
			out = out.replace(/^[a-z]|[^\s][A-Z]/g, function (str, offset) {
				if (offset == 0) {
					return (str.toUpperCase());
				} else {
					return (str.substr(0, 1) + " " + str.substr(1).toUpperCase());
				}
			});
			return (out);
		} else return null;
	};

	function formatDecimalHours(dayFraction, spaced) {
		var ts = new Date(new Date().toUTCString()).valueOf() - new Date().valueOf();
		var hr = ts / (1000 * 60 * 60);
		var day = (dayFraction - hr) + 0.0083333334;
		while (day > 24){
			day -= 24;
		}
		while (day < 0){
			day += 24;
		}
		var hours = day.toFixed(0);
		var minutes = ((day * 60) - (hours * 60)).toFixed(0);

		var join = spaced ? ' : ' : ':';
		//var seconds = ((day * 3600) - (((hours * 3600) + ((double)minutes * 60.0)));

		return ([int2(hours), int2(minutes)]).join(join);
	}
	function int2(dec) {
		return Math.abs(Math.floor(dec)) < 10 ? dec < 0 ?  '-0' + Math.abs(Math.floor(dec)) : '0' + Math.floor(dec) : Math.floor(dec);
	}
	function formatHms(angle, isHmsFormat, signed, spaced) {
		var minutes = (angle - Math.floor(angle)) * 60;
		var seconds = (minutes - Math.floor(minutes)) * 60;
		var join = spaced ? ' : ' : ':';
		if (isNaN(angle)) {
			angle = minutes = seconds = 0;
		}
		return isHmsFormat ? int2(angle) + 'h'
			+ int2(minutes) + 'm'
			+ int2(seconds) + 's' :
			([signed && angle > 0 ? '+' + int2(angle) : int2(angle), int2(minutes), int2(seconds)]).join(join);
	};

	function parseHms(input) {
		var parts;
		function convertHmstoDec(hours, minutes, seconds) {
			var dec = parseInt(hours) + parseInt(minutes) / 60 + parseInt(seconds) / (60 * 60);
			return dec;
		}
		if (input.indexOf(':') != -1) {
			parts = input.split(':');
		}
		else if (input.indexOf('h') != -1) {
			parts = input.replace(/h/, ',').replace(/m/, ',').replace(/s/, '').split(',');
		}
		if (parts) {
			return convertHmstoDec(parts[0], parts[1], parts[2]);
		} else {
			return parseFloat(input);
		}
	}
	

	

	function getAstroDetails(place) {
		var coords = wwtlib.Coordinates.fromRaDec(place.get_RA(), place.get_dec());
		var stc = wwtlib.SpaceTimeController;
		var altAz = wwtlib.Coordinates.equitorialToHorizon(coords, stc.get_location(), stc.get_now());
		place.altAz = altAz;
		var classificationText = getClassificationText(place.get_classification());
		var riseSet;
		if (classificationText == 'Solar System') {

			var jNow = stc.get_jNow() + .5;
			var p1 = wwtlib.Planets.getPlanetLocation(place.get_name(), jNow - 1);
			var p2 = wwtlib.Planets.getPlanetLocation(place.get_name(), jNow);
			var p3 = wwtlib.Planets.getPlanetLocation(place.get_name(), jNow + 1);

			var type = 0;
			switch (place.get_name()) {
				case "Sun":
					type = 1;
					break;
				case "Moon":
					type = 2;
					break;
				default:
					type = 0;
					break;
			}

			riseSet = wwtlib.AstroCalc.getRiseTrinsitSet(jNow, stc.get_location().get_lat(), -stc.get_location().get_lng(), p1.RA, p1.dec, p2.RA, p2.dec, p3.RA, p3.dec, type);
		}
		else {
			riseSet = wwtlib.AstroCalc.getRiseTrinsitSet(stc.get_jNow() + .5, stc.get_location().get_lat(), -stc.get_location().get_lng(), place.get_RA(), place.get_dec(), place.get_RA(), place.get_dec(), place.get_RA(), place.get_dec(), 0);
		}
		if (!riseSet.bValid && !riseSet.bNeverRises) {
			riseSet.bNeverSets = true;
		}
		place.riseSet = riseSet;
	}

	function drawCircleOverPlace(place) {
		wwt.wc.clearAnnotations();
		if ($('#lstLookAt').val() === '2') {
			var circle = wwt.wc.createCircle();
			circle.set_center(place.get_location3d());
			circle.set_skyRelative(false);
			
			wwt.wc.addAnnotation(circle);
		}
	}

	function getIsPlanet(place) {
		var cls,isPlanet;
		if (typeof place.get_classification === 'function') {
			cls = place.get_classification();
			isPlanet = getClassificationText(cls) === 'Solar System';
		}
		return isPlanet || typeof place.get_rotation ==='function';
	}

	function secondsToTime(secs) {
		var hours = Math.floor(secs / (60 * 60));

		var divisorForMinutes = secs % (60 * 60);
		var minutes = Math.floor(divisorForMinutes / 60);

		var divisorForSeconds = divisorForMinutes % 60;
		var seconds = Math.ceil(divisorForSeconds);

		var obj = {
			"h": hours < 10 ? '0' + hours : hours.toString(),
			"m": minutes < 10 ? '0' + minutes : minutes.toString(),
			"s": seconds < 10 ? '0' + seconds : seconds.toString()
		};
		return obj;
	}

	function getQSParam(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
		return results == null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
	}

	function getImageset(place) {
		if (!place) {
			return null;
		} else if (ss.canCast(place, wwtlib.Imageset)) {
			return place;
		} else if (place.get_backgroundImageset && ss.canCast(place.get_backgroundImageset(), wwtlib.Imageset)) {
			return place.get_backgroundImageset();
		} else if (place.get_studyImageset && ss.canCast(place.get_studyImageset(), wwtlib.Imageset)) {
			return place.get_studyImageset();
		} else {
			return null;
		}
	}

	function getCreditsText(pl) {
		var imageSet = getImageset(pl);
		if (imageSet) {
			return imageSet.get_creditsText();
		} else {
			return '';
		}
	}
	function getCreditsUrl(pl) {
		var imageSet = getImageset(pl);
		if (imageSet) {
			return imageSet.get_creditsUrl();
		} else {
			return '';
		}
	}
	/*var client = getQSParam('client');
	api.isMobile = client && client.toLowerCase().indexOf('m') === 0;
	var winW = $(window).width();
	var winH = $(window).height();
	var minDimension = Math.min(winW, winH);
	if (api.isMobile && minDimension > 500) {
		redirectClient('html5');
	}*/
	var accelDevice = false;
	window.ondevicemotion = function(event) {
		if (event.acceleration &&
			event.acceleration.x != null) {
			log('devicemotionevent', event);
			accelDevice = true;
			if (!api.isMobile && minDimension < 500) {

				redirectClient('mobile');
			}
			window.ondevicemotion = null;
		}
	}
	function redirectClient(val) {
		return;
		var qs = location.search.substr(1);
		var newQs = '?';

		$.each(qs.split('&'), function (i, s) {
			if (i > 0) {
				newQs += '&';
			}
			if (s.indexOf('client') !== 0) {
				newQs += s;

			}
		});
		if (newQs.length > 1) {
			newQs += '&';
		}
		newQs += 'client=' + val;
		location.href = '/webclient' + newQs + location.hash;
		
	}

	function isAccelDevice() {
		return accelDevice;
	}

	function log() {
		if (getQSParam('debug') != null) {
			console.log(arguments);
		}
	}

	function nav(url) {
		window.open(url);
	}
	function resetCamera() {
		wwt.wc.gotoRaDecZoom(0, 0, 60, true);
	};
	function toggleFullScreen () {
		if (fullscreen) {
			wwt.exitFullScreen();
			fullscreen = false;
		} else {
			wwt.requestFullScreen(document.body);
			fullscreen = true;
		}
	};

	var imageSetTypes = [];
	function getImageSetType(sType) {
		if (!imageSetTypes.length) {
			$.each(wwtlib.ImageSetType, function(k, v) {
				if (!isNaN(v)) {
					imageSetTypes[v] = k.toLowerCase();
				}
			});
		}
		return imageSetTypes.indexOf(sType.toLowerCase()) == -1 ? 2 : imageSetTypes.indexOf(sType.toLowerCase());
		
	}

	var dirtyInterval;
	function trackViewportChanges() {
		viewport = {
			isDirty: false,
			init: true,
			RA: wwt.wc.getRA(),
			Dec: wwt.wc.getDec(),
			Fov: wwt.wc.get_fov()
		};

		$rootScope.$broadcast('viewportchange', viewport);

		$rootScope.languagePromise.then(function() {
			viewport = {
				isDirty: false,
				init: true,
				RA: wwt.wc.getRA(),
				Dec: wwt.wc.getDec(),
				Fov: wwt.wc.get_fov()
			};

			$rootScope.$broadcast('viewportchange', viewport);
			viewport.init = false;


			dirtyInterval = setInterval(dirtyViewport, 250);
		});
	}

	var viewport = {
		isDirty: false,
		RA: 0,
		Dec: 0,
		Fov: 60
	};
	
	var dirtyViewport = function () {
		var wasDirty = viewport.isDirty;
		viewport.isDirty = wwt.wc.getRA() != viewport.RA || wwt.wc.getDec() != viewport.Dec || wwt.wc.get_fov() != viewport.Fov;
		viewport.RA = wwt.wc.getRA();
		viewport.Dec = wwt.wc.getDec();
		viewport.Fov = wwt.wc.get_fov();
		if (viewport.isDirty || wasDirty) {
			$rootScope.viewport = viewport;
			$rootScope.$broadcast('viewportchange', viewport);
		}
	}
	

	return api;

}]);

