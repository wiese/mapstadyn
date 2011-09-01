/**
 * mapstadyn
 * (c) 2011-2011 wiese - https://github.com/wiese
 *
 * mapstadyn freely distributable under the terms of an MIT-style license.
 */

/**
 * mapstadyn constructor
 *
 * @return void
 */
function Mapstadyn() {
	if (typeof google == 'undefined' || typeof google.load == 'undefined') {
		alert(
			'You must include the google loader. Please see '	+
				'http://code.google.com/apis/loader/ for further information.'
		);
	}

	this.mapCount = 0;
}

/**
 * Start Mapstadyn
 *
 * @param Object options Configration values
 *
 * @return void
 */
function go(options) {

	var defaultOptions = {
		language: 'en',
		className: 'mapstadyn',
		debug: false
	};
	this.options = defaultOptions;

	if (typeof options == 'object') {
		for(var key in options) {
			this.options[key] = options[key];
		}
	}

	var that = this;

	google.load('maps', 3, {
		'language': this.options.language,
		// http://aktuell.de.selfhtml.org/artikel/javascript/organisation/#alternativen-kontext
		'callback': function () {
			return mapCallback.apply(that);
		},
		'other_params': 'sensor=false'
	});
}

/**
 * Function called by google maps when done loading the external library
 *
 * @return void
 */
function mapCallback() {
	var maps = this.getElementsByClassName(this.options.className);
	for (var i = 0; i < maps.length; i++) {
		this.dynamize(maps[i]);
	}
}

/**
 * Apply mapstadyn behaviour to given element
 *
 * @see http://code.google.com/intl/de/apis/maps/documentation/staticmaps/
 *
 * @param Object img     Static map (img dom element)
 *
 * @return void
 */
function dynamize(img) {

	img.style.position = 'absolute';
	img.style.zIndex = '2';

	var width = img.getAttribute('width');
	var height = img.getAttribute('height');
	var src = img.getAttribute('src');

	var wrapper = document.createElement('div');

	wrapper.style.position = 'relative';
	wrapper.style.width = width + 'px';
	wrapper.style.height = height + 'px';

	var canvas = document.createElement('div');
	canvas.id = 'mapstatdyn_canvas_' + (++this.mapCount);

	canvas.style.position = 'absolute';
	canvas.style.zIndex = '1';
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';

	wrapper.appendChild(img.cloneNode(true));
	img.parentNode.replaceChild(wrapper, img);

	wrapper.appendChild(canvas);

	// @todo map option from static map?
	var options = {
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: true,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		}
	};

	var center = this.getParameterByName('center', src);

	options.center = this.parseLocationString(center);

	options.zoom = parseInt(this.getParameterByName('zoom', src));

	var language = this.getParameterByName('language', src);
	if (typeof language == 'string' && language != '') {
		options.language = language;
	}
	else {
		options.language = this.options.language;
	}

	var map = new google.maps.Map(canvas, options);

	var markers = this.getParameterByName('markers', src);

	if (markers != null) {

		if (typeof markers == 'string') {	// may be a single one or array
			markers = new Array(markers);	// force array
		}

		for (var i = 0; i < markers.length; i++) {

			var marker = markers[i].split('|');

			var sizeName = 'normal';
			var label = '';
			var fillc = '000000';
			var icon = null;

			var positions = [];
			var currentValue;
			for (var j = 0; j < marker.length; j++) {

				currentValue = marker[j];

				this.debug("marker " + i + " property " + j + ": '" + currentValue + "'");

				var parsed = this.parseLocationString(currentValue);

				if (parsed) {	// position
					positions.push(parsed);
				}
				else {	// style(s)
					var match;

					// e.g. markers=icon:http://www.test.com/img/marker.png|51.0525,6.2236
					if (match = currentValue.match(/icon:(.+)/)) {
						icon = match[1];
					}
					else {	// e.g. markers=color:blue|label:G|51.0525,6.2236

						// @see http://code.google.com/intl/de/apis/maps/documentation/staticmaps/#MarkerStyles
						// @see http://groups.google.com/group/google-chart-api/web/chart-types-for-map-pins?pli=1

						if (match = currentValue.match(/label:(.+)/)) {
							var label = match[1];
						}

						if (match = currentValue.match(/color:(.+)/)) {
							var hexcolor = parseInt(match[1], 16).toString(16);
							if (hexcolor == 'NaN') {
								hexcolor = this.convertColorNameToHex(match[1]);
							}
							fillc = hexcolor;
						}

						if (match = currentValue.match(/size:(.+)/)) {
							sizeName = match[1];
						}
					}
				}
			}

			var image, shadow;
			if (icon == null) {
				var size = this.MAP_PIN_ICON_TYPES[sizeName];

				var url = this.MAP_PIN_HOST + size.url;
				url = url.replace('#LETTER#', label);
				url = url.replace('#FILLC#', fillc);

				image = new google.maps.MarkerImage(
					url,
					new google.maps.Size(size.dimensions.x, size.dimensions.y),
					new google.maps.Point(0,0),	// The origin for this image is 0,0
					new google.maps.Point(size.anchor.x, size.anchor.y)
				);
				shadow = new google.maps.MarkerImage(
					this.MAP_PIN_HOST + '/chart?chst=d_map_pin_shadow',
					new google.maps.Size(37, 32),
					new google.maps.Point(0,0),
					new google.maps.Point(14, 34)
				);
			}
			else {
				image = new google.maps.MarkerImage(
					icon
				);
				shadow = null;
			}

			for (var j = 0; j < positions.length; j++) {
				new google.maps.Marker({
					position: positions[j],
					map: map,
					icon: image,
					shadow: shadow
				});
			}
		}
	}

	google.maps.event.addListenerOnce(map, "tilesloaded", function() {
		var wrapper = this.getDiv().parentNode;
		wrapper.removeChild(wrapper.firstChild);	// getting rid of the static map
	});
}

/**
 * @see http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery
 *
 * @param string name  Name of the query string variable to get
 * @param string url   Url to work with [document location by default]
 * @param mixed  def   Default to return if parameter not found [null by default]
 *
 * @return mixed String or Array depending on variable count
 */
function getParameterByName(name, url, def) {
	if (typeof url == 'undefined') {
		url = window.location.href;
	}
	if (typeof def == 'undefined') {
		def = null;
	}

	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]+)", 'gi');

	var part;
	var result = new Array();
	while (part = regex.exec(url)) {
		result.push(decodeURIComponent(part[1].replace(/\+/g, " ")));
	}

	if (result.length == 0) {	// not present in query string
		return def;	// return defined default
	}
	else if (result.length == 1) {	// single item found
		return result.shift();	// one match, return individual item
	}
	else {
		return result;	// array of (2+) occurences
	}
}

/**
 * @tutorial This could implement GClientGeocoder for use of addresses
 *
 * @param string string
 *
 * @return LatLng
 */
function parseLocationString(string) {
	var coordinates = string.split(',');

	if (
		typeof coordinates == 'object'
		&&
		typeof coordinates.length != 'undefined'
		&&
		coordinates.length == 2
	) {
		return new google.maps.LatLng(
			parseFloat(coordinates[0]),
			parseFloat(coordinates[1])
		);
	}

	return false;
}

/**
 * @see http://robertnyman.com/2005/11/07/the-ultimate-getelementsbyclassname/
 *
 * @tutorial Preferably using native implementation - covers all modern clients
 *
 * @param string name Name of the class(es) to find elements by
 *
 * @return array
 */
function getElementsByClassName(name) {
	if (typeof document.getElementsByClassName == 'function') {
		return document.getElementsByClassName(name);
	}

	var haystack = document.getElementsByTagName('*');
	var testClass = new RegExp("(^|\\s)" + name + "(\\s|$)");

	var elements = [];
	for(var i = 0; i < haystack.length; i++) {
		if(testClass.test(haystack[i].className)){
			elements.push(haystack[i]);
		}
	}

	return elements;
}

/**
 * @param string colorName
 *
 * @see http://www.w3schools.com/HTML/html_colornames.asp
 *
 * @return string
 */
function convertColorNameToHex(colorName) {

	colorName = colorName.toLowerCase();

	var map = {
		'black': '656464',
		'brown': 'b68800',
		'blue': '43a9fc',
		'green': '65ba4a',
		'purple': '9773fe',
		'yellow': 'fcf357',
		'gray': 'bebebe',
		'orange': 'ffa900',
		'red': 'ff6357',
		'white': 'fefefe'
	};
	if (map[colorName] !== undefined) {
		return map[colorName];
	}

	throw "Failed translating unknown color name '"+colorName+"' to hex.";
}

function debug(message) {
	if (this.options.debug && typeof console == 'object') {
		console.log(message);
	}
}

Mapstadyn.prototype.go = go;
Mapstadyn.prototype.mapCallback = mapCallback;
Mapstadyn.prototype.getParameterByName = getParameterByName;
Mapstadyn.prototype.parseLocationString = parseLocationString;
Mapstadyn.prototype.dynamize = dynamize;
Mapstadyn.prototype.getElementsByClassName = getElementsByClassName;
Mapstadyn.prototype.convertColorNameToHex = convertColorNameToHex;
Mapstadyn.prototype.debug = debug;
Mapstadyn.prototype.MAP_PIN_HOST = 'http://chart.apis.google.com';
Mapstadyn.prototype.MAP_PIN_ICON_TYPES = {
	normal: {
		dimensions: { x: 20, y: 32 },
		anchor: { x: 11, y: 33 },
		url: '/chart?chst=d_map_pin_letter&chld=#LETTER#|#FILLC#|#TEXTC#'
	},
	mid: {
		dimensions: { x: 16, y: 29 },
		anchor: { x: 8, y: 29 },
		url: '/chart?chst=d_map_spin&chld=0.44|0|#FILLC#|10|b|#LETTER#'
	},
	small: {
		dimensions: { x: 13, y: 20 },
		anchor: { x: 6, y: 20 },
		url: '/chart?chst=d_map_spin&chld=0.32|0|#FILLC#|1'
	},
	tiny: {
		dimensions: { x: 8, y: 12 },
		anchor: { x: 3, y: 12 },
		url: '/chart?chst=d_map_spin&chld=0.19|0|#FILLC#|1'
	}
};

var mapstadyn = new Mapstadyn();
