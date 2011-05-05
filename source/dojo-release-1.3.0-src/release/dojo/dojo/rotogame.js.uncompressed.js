/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is a compiled version of Dojo, built for deployment and not for
	development. To get an editable version, please visit:

		http://dojotoolkit.org

	for documentation and information on getting the source.
*/

if(!dojo._hasResource["dojox.gfx.matrix"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.gfx.matrix"] = true;
dojo.provide("dojox.gfx.matrix");

(function(){
	var m = dojox.gfx.matrix;

	// candidates for dojox.math:
	var _degToRadCache = {};
	m._degToRad = function(degree){
		return _degToRadCache[degree] || (_degToRadCache[degree] = (Math.PI * degree / 180));
	};
	m._radToDeg = function(radian){ return radian / Math.PI * 180; };

	m.Matrix2D = function(arg){
		// summary: a 2D matrix object
		// description: Normalizes a 2D matrix-like object. If arrays is passed,
		//		all objects of the array are normalized and multiplied sequentially.
		// arg: Object
		//		a 2D matrix-like object, a number, or an array of such objects
		if(arg){
			if(typeof arg == "number"){
				this.xx = this.yy = arg;
			}else if(arg instanceof Array){
				if(arg.length > 0){
					var matrix = m.normalize(arg[0]);
					// combine matrices
					for(var i = 1; i < arg.length; ++i){
						var l = matrix, r = dojox.gfx.matrix.normalize(arg[i]);
						matrix = new m.Matrix2D();
						matrix.xx = l.xx * r.xx + l.xy * r.yx;
						matrix.xy = l.xx * r.xy + l.xy * r.yy;
						matrix.yx = l.yx * r.xx + l.yy * r.yx;
						matrix.yy = l.yx * r.xy + l.yy * r.yy;
						matrix.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
						matrix.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
					}
					dojo.mixin(this, matrix);
				}
			}else{
				dojo.mixin(this, arg);
			}
		}
	};

	// the default (identity) matrix, which is used to fill in missing values
	dojo.extend(m.Matrix2D, {xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0});

	dojo.mixin(m, {
		// summary: class constants, and methods of dojox.gfx.matrix

		// matrix constants

		// identity: dojox.gfx.matrix.Matrix2D
		//		an identity matrix constant: identity * (x, y) == (x, y)
		identity: new m.Matrix2D(),

		// flipX: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at x = 0 line: flipX * (x, y) == (-x, y)
		flipX:    new m.Matrix2D({xx: -1}),

		// flipY: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at y = 0 line: flipY * (x, y) == (x, -y)
		flipY:    new m.Matrix2D({yy: -1}),

		// flipXY: dojox.gfx.matrix.Matrix2D
		//		a matrix, which reflects points at the origin of coordinates: flipXY * (x, y) == (-x, -y)
		flipXY:   new m.Matrix2D({xx: -1, yy: -1}),

		// matrix creators

		translate: function(a, b){
			// summary: forms a translation matrix
			// description: The resulting matrix is used to translate (move) points by specified offsets.
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value
			if(arguments.length > 1){
				return new m.Matrix2D({dx: a, dy: b}); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: dojox.gfx.Point: a point-like object, which specifies offsets for both dimensions
			// b: null
			return new m.Matrix2D({dx: a.x, dy: a.y}); // dojox.gfx.matrix.Matrix2D
		},
		scale: function(a, b){
			// summary: forms a scaling matrix
			// description: The resulting matrix is used to scale (magnify) points by specified offsets.
			// a: Number: a scaling factor used for the x coordinate
			// b: Number: a scaling factor used for the y coordinate
			if(arguments.length > 1){
				return new m.Matrix2D({xx: a, yy: b}); // dojox.gfx.matrix.Matrix2D
			}
			if(typeof a == "number"){
				// branch
				// a: Number: a uniform scaling factor used for the both coordinates
				// b: null
				return new m.Matrix2D({xx: a, yy: a}); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: dojox.gfx.Point: a point-like object, which specifies scale factors for both dimensions
			// b: null
			return new m.Matrix2D({xx: a.x, yy: a.y}); // dojox.gfx.matrix.Matrix2D
		},
		rotate: function(angle){
			// summary: forms a rotating matrix
			// description: The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an angle of rotation in radians (>0 for CW)
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			return new m.Matrix2D({xx: c, xy: -s, yx: s, yy: c}); // dojox.gfx.matrix.Matrix2D
		},
		rotateg: function(degree){
			// summary: forms a rotating matrix
			// description: The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.rotate() for comparison.
			// degree: Number: an angle of rotation in degrees (>0 for CW)
			return m.rotate(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		skewX: function(angle) {
			// summary: forms an x skewing matrix
			// description: The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an skewing angle in radians
			return new m.Matrix2D({xy: Math.tan(angle)}); // dojox.gfx.matrix.Matrix2D
		},
		skewXg: function(degree){
			// summary: forms an x skewing matrix
			// description: The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.skewX() for comparison.
			// degree: Number: an skewing angle in degrees
			return m.skewX(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		skewY: function(angle){
			// summary: forms a y skewing matrix
			// description: The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number: an skewing angle in radians
			return new m.Matrix2D({yx: Math.tan(angle)}); // dojox.gfx.matrix.Matrix2D
		},
		skewYg: function(degree){
			// summary: forms a y skewing matrix
			// description: The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox.gfx.matrix.skewY() for comparison.
			// degree: Number: an skewing angle in degrees
			return m.skewY(m._degToRad(degree)); // dojox.gfx.matrix.Matrix2D
		},
		reflect: function(a, b){
			// summary: forms a reflection matrix
			// description: The resulting matrix is used to reflect points around a vector,
			//		which goes through the origin.
			// a: dojox.gfx.Point: a point-like object, which specifies a vector of reflection
			// b: null
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// branch
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value

			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = 2 * a * b / n2;
			return new m.Matrix2D({xx: 2 * a2 / n2 - 1, xy: xy, yx: xy, yy: 2 * b2 / n2 - 1}); // dojox.gfx.matrix.Matrix2D
		},
		project: function(a, b){
			// summary: forms an orthogonal projection matrix
			// description: The resulting matrix is used to project points orthogonally on a vector,
			//		which goes through the origin.
			// a: dojox.gfx.Point: a point-like object, which specifies a vector of projection
			// b: null
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// branch
			// a: Number: an x coordinate value
			// b: Number: a y coordinate value

			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = a * b / n2;
			return new m.Matrix2D({xx: a2 / n2, xy: xy, yx: xy, yy: b2 / n2}); // dojox.gfx.matrix.Matrix2D
		},

		// ensure matrix 2D conformance
		normalize: function(matrix){
			// summary: converts an object to a matrix, if necessary
			// description: Converts any 2D matrix-like object or an array of
			//		such objects to a valid dojox.gfx.matrix.Matrix2D object.
			// matrix: Object: an object, which is converted to a matrix, if necessary
			return (matrix instanceof m.Matrix2D) ? matrix : new m.Matrix2D(matrix); // dojox.gfx.matrix.Matrix2D
		},

		// common operations

		clone: function(matrix){
			// summary: creates a copy of a 2D matrix
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object to be cloned
			var obj = new m.Matrix2D();
			for(var i in matrix){
				if(typeof(matrix[i]) == "number" && typeof(obj[i]) == "number" && obj[i] != matrix[i]) obj[i] = matrix[i];
			}
			return obj; // dojox.gfx.matrix.Matrix2D
		},
		invert: function(matrix){
			// summary: inverts a 2D matrix
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object to be inverted
			var M = m.normalize(matrix),
				D = M.xx * M.yy - M.xy * M.yx,
				M = new m.Matrix2D({
					xx: M.yy/D, xy: -M.xy/D,
					yx: -M.yx/D, yy: M.xx/D,
					dx: (M.xy * M.dy - M.yy * M.dx) / D,
					dy: (M.yx * M.dx - M.xx * M.dy) / D
				});
			return M; // dojox.gfx.matrix.Matrix2D
		},
		_multiplyPoint: function(matrix, x, y){
			// summary: applies a matrix to a point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// x: Number: an x coordinate of a point
			// y: Number: a y coordinate of a point
			return {x: matrix.xx * x + matrix.xy * y + matrix.dx, y: matrix.yx * x + matrix.yy * y + matrix.dy}; // dojox.gfx.Point
		},
		multiplyPoint: function(matrix, /* Number||Point */ a, /* Number, optional */ b){
			// summary: applies a matrix to a point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// a: Number: an x coordinate of a point
			// b: Number: a y coordinate of a point
			var M = m.normalize(matrix);
			if(typeof a == "number" && typeof b == "number"){
				return m._multiplyPoint(M, a, b); // dojox.gfx.Point
			}
			// branch
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix object to be applied
			// a: dojox.gfx.Point: a point
			// b: null
			return m._multiplyPoint(M, a.x, a.y); // dojox.gfx.Point
		},
		multiply: function(matrix){
			// summary: combines matrices by multiplying them sequentially in the given order
			// matrix: dojox.gfx.matrix.Matrix2D...: a 2D matrix-like object,
			//		all subsequent arguments are matrix-like objects too
			var M = m.normalize(matrix);
			// combine matrices
			for(var i = 1; i < arguments.length; ++i){
				var l = M, r = m.normalize(arguments[i]);
				M = new m.Matrix2D();
				M.xx = l.xx * r.xx + l.xy * r.yx;
				M.xy = l.xx * r.xy + l.xy * r.yy;
				M.yx = l.yx * r.xx + l.yy * r.yx;
				M.yy = l.yx * r.xy + l.yy * r.yy;
				M.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
				M.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
			}
			return M; // dojox.gfx.matrix.Matrix2D
		},

		// high level operations

		_sandwich: function(matrix, x, y){
			// summary: applies a matrix at a centrtal point
			// matrix: dojox.gfx.matrix.Matrix2D: a 2D matrix-like object, which is applied at a central point
			// x: Number: an x component of the central point
			// y: Number: a y component of the central point
			return m.multiply(m.translate(x, y), matrix, m.translate(-x, -y)); // dojox.gfx.matrix.Matrix2D
		},
		scaleAt: function(a, b, c, d){
			// summary: scales a picture using a specified point as a center of scaling
			// description: Compare with dojox.gfx.matrix.scale().
			// a: Number: a scaling factor used for the x coordinate
			// b: Number: a scaling factor used for the y coordinate
			// c: Number: an x component of a central point
			// d: Number: a y component of a central point

			// accepts several signatures:
			//	1) uniform scale factor, Point
			//	2) uniform scale factor, x, y
			//	3) x scale, y scale, Point
			//	4) x scale, y scale, x, y

			switch(arguments.length){
				case 4:
					// a and b are scale factor components, c and d are components of a point
					return m._sandwich(m.scale(a, b), c, d); // dojox.gfx.matrix.Matrix2D
				case 3:
					if(typeof c == "number"){
						// branch
						// a: Number: a uniform scaling factor used for both coordinates
						// b: Number: an x component of a central point
						// c: Number: a y component of a central point
						// d: null
						return m._sandwich(m.scale(a), b, c); // dojox.gfx.matrix.Matrix2D
					}
					// branch
					// a: Number: a scaling factor used for the x coordinate
					// b: Number: a scaling factor used for the y coordinate
					// c: dojox.gfx.Point: a central point
					// d: null
					return m._sandwich(m.scale(a, b), c.x, c.y); // dojox.gfx.matrix.Matrix2D
			}
			// branch
			// a: Number: a uniform scaling factor used for both coordinates
			// b: dojox.gfx.Point: a central point
			// c: null
			// d: null
			return m._sandwich(m.scale(a), b.x, b.y); // dojox.gfx.matrix.Matrix2D
		},
		rotateAt: function(angle, a, b){
			// summary: rotates a picture using a specified point as a center of rotation
			// description: Compare with dojox.gfx.matrix.rotate().
			// angle: Number: an angle of rotation in radians (>0 for CW)
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) rotation angle in radians, Point
			//	2) rotation angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.rotate(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an angle of rotation in radians (>0 for CCW)
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.rotate(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		rotategAt: function(degree, a, b){
			// summary: rotates a picture using a specified point as a center of rotation
			// description: Compare with dojox.gfx.matrix.rotateg().
			// degree: Number: an angle of rotation in degrees (>0 for CW)
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) rotation angle in degrees, Point
			//	2) rotation angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.rotateg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an angle of rotation in degrees (>0 for CCW)
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.rotateg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewXAt: function(angle, a, b){
			// summary: skews a picture along the x axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewX().
			// angle: Number: an skewing angle in radians
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in radians, Point
			//	2) skew angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewX(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an skewing angle in radians
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewX(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewXgAt: function(degree, a, b){
			// summary: skews a picture along the x axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewXg().
			// degree: Number: an skewing angle in degrees
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in degrees, Point
			//	2) skew angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewXg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an skewing angle in degrees
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewXg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewYAt: function(angle, a, b){
			// summary: skews a picture along the y axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewY().
			// angle: Number: an skewing angle in radians
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in radians, Point
			//	2) skew angle in radians, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewY(angle), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// angle: Number: an skewing angle in radians
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewY(angle), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		},
		skewYgAt: function(/* Number */ degree, /* Number||Point */ a, /* Number, optional */ b){
			// summary: skews a picture along the y axis using a specified point as a center of skewing
			// description: Compare with dojox.gfx.matrix.skewYg().
			// degree: Number: an skewing angle in degrees
			// a: Number: an x component of a central point
			// b: Number: a y component of a central point

			// accepts several signatures:
			//	1) skew angle in degrees, Point
			//	2) skew angle in degrees, x, y

			if(arguments.length > 2){
				return m._sandwich(m.skewYg(degree), a, b); // dojox.gfx.matrix.Matrix2D
			}

			// branch
			// degree: Number: an skewing angle in degrees
			// a: dojox.gfx.Point: a central point
			// b: null
			return m._sandwich(m.skewYg(degree), a.x, a.y); // dojox.gfx.matrix.Matrix2D
		}

		//TODO: rect-to-rect mapping, scale-to-fit (isotropic and anisotropic versions)

	});
})();

// propagate Matrix2D up
dojox.gfx.Matrix2D = dojox.gfx.matrix.Matrix2D;

}

if(!dojo._hasResource["dojox.gfx._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.gfx._base"] = true;
dojo.provide("dojox.gfx._base");

(function(){
	var g = dojox.gfx, b = g._base;

	// candidates for dojox.style (work on VML and SVG nodes)
	g._hasClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		// return (new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)	// Boolean
		var cls = node.getAttribute("className");
		return cls && (" " + cls + " ").indexOf(" " + classStr + " ") >= 0;  // Boolean
	}
	g._addClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		var cls = node.getAttribute("className") || "";
		if(!cls || (" " + cls + " ").indexOf(" " + classStr + " ") < 0){
			node.setAttribute("className", cls + (cls ? " " : "") + classStr);
		}
	}
	g._removeClass = function(/*DomNode*/node, /*String*/classStr){
		//	summary: Removes classes from node.
		var cls = node.getAttribute("className");
		if(cls){
			node.setAttribute(
				"className", 
				cls.replace(new RegExp('(^|\\s+)' + classStr + '(\\s+|$)'), "$1$2")
			);
		}
	}

	// candidate for dojox.html.metrics (dynamic font resize handler is not implemented here)

	//	derived from Morris John's emResized measurer
	b._getFontMeasurements = function(){
		//	summary:
		//		Returns an object that has pixel equivilents of standard font
		//		size values.
		var heights = {
			'1em': 0, '1ex': 0, '100%': 0, '12pt': 0, '16px': 0, 'xx-small': 0,
			'x-small': 0, 'small': 0, 'medium': 0, 'large': 0, 'x-large': 0,
			'xx-large': 0
		};

		if(dojo.isIE){
			//	we do a font-size fix if and only if one isn't applied already.
			//	NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			dojo.doc.documentElement.style.fontSize="100%";
		}

		//	set up the measuring node.
		var div = dojo.doc.createElement("div");
		var s = div.style;
		s.position = "absolute";
		s.left = "-100px";
		s.top = "0px";
		s.width = "30px";
		s.height = "1000em";
		s.border = "0px";
		s.margin = "0px";
		s.padding = "0px";
		s.outline = "none";
		s.lineHeight = "1";
		s.overflow = "hidden";
		dojo.body().appendChild(div);

		//	do the measurements.
		for(var p in heights){
			div.style.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}

		dojo.body().removeChild(div);
		div = null;
		return heights; 	//	object
	};

	var fontMeasurements = null;

	b._getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = b._getFontMeasurements();
		}
		return fontMeasurements;
	};

	// candidate for dojox.html.metrics

	var measuringNode = null, empty = {};
	b._getTextBox = function(/* String */ text, /* Object */ style, /* String? */ className){
		var m, s;
		if(!measuringNode){
			m = measuringNode = dojo.doc.createElement("div");
			s = m.style;
			s.position = "absolute";
			s.left = "-10000px";
			s.top = "0";
			dojo.body().appendChild(m);
		}else{
			m = measuringNode;
			s = m.style;
		}
		// reset styles
		m.className = "";
		s.border = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(arguments.length > 1 && style){
			for(var i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(arguments.length > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;
		return dojo.marginBox(m);
	};

	// candidate for dojo.dom

	var uniqueId = 0;
	b._getUniqueId = function(){
		// summary: returns a unique string for use with any DOM element
		var id;
		do{
			id = dojo._scopeName + "Unique" + (++uniqueId);
		}while(dojo.byId(id));
		return id;
	};
})();

dojo.mixin(dojox.gfx, {
	//	summary:
	// 		defines constants, prototypes, and utility functions

	// default shapes, which are used to fill in missing parameters
	defaultPath: {
		type: "path", path: ""
	},
	defaultPolyline: {
		type: "polyline", points: []
	},
	defaultRect: {
		type: "rect", x: 0, y: 0, width: 100, height: 100, r: 0
	},
	defaultEllipse: {
		type: "ellipse", cx: 0, cy: 0, rx: 200, ry: 100
	},
	defaultCircle: {
		type: "circle", cx: 0, cy: 0, r: 100
	},
	defaultLine: {
		type: "line", x1: 0, y1: 0, x2: 100, y2: 100
	},
	defaultImage: {
		type: "image", x: 0, y: 0, width: 0, height: 0, src: ""
	},
	defaultText: {
		type: "text", x: 0, y: 0, text: "", align: "start",
		decoration: "none", rotated: false, kerning: true
	},
	defaultTextPath: {
		type: "textpath", text: "", align: "start",
		decoration: "none", rotated: false, kerning: true
	},

	// default geometric attributes
	defaultStroke: {
		type: "stroke", color: "black", style: "solid", width: 1, 
		cap: "butt", join: 4
	},
	defaultLinearGradient: {
		type: "linear", x1: 0, y1: 0, x2: 100, y2: 100,
		colors: [
			{ offset: 0, color: "black" }, { offset: 1, color: "white" }
		]
	},
	defaultRadialGradient: {
		type: "radial", cx: 0, cy: 0, r: 100,
		colors: [
			{ offset: 0, color: "black" }, { offset: 1, color: "white" }
		]
	},
	defaultPattern: {
		type: "pattern", x: 0, y: 0, width: 0, height: 0, src: ""
	},
	defaultFont: {
		type: "font", style: "normal", variant: "normal", 
		weight: "normal", size: "10pt", family: "serif"
	},

	getDefault: (function(){
		var typeCtorCache = {};
		// a memoized delegate()
		return function(/*String*/ type){
			var t = typeCtorCache[type];
			if(t){
				return new t();
			}
			t = typeCtorCache[type] = function(){};
			t.prototype = dojox.gfx[ "default" + type ];
			return new t();
		}
	})(),

	normalizeColor: function(/*Color*/ color){
		//	summary:
		// 		converts any legal color representation to normalized
		// 		dojo.Color object
		return (color instanceof dojo.Color) ? color : new dojo.Color(color); // dojo.Color
	},
	normalizeParameters: function(existed, update){
		//	summary:
		// 		updates an existing object with properties from an "update"
		// 		object
		//	existed: Object
		//		the "target" object to be updated
		//	update:  Object
		//		the "update" object, whose properties will be used to update
		//		the existed object
		if(update){
			var empty = {};
			for(var x in existed){
				if(x in update && !(x in empty)){
					existed[x] = update[x];
				}
			}
		}
		return existed;	// Object
	},
	makeParameters: function(defaults, update){
		//	summary:
		// 		copies the original object, and all copied properties from the
		// 		"update" object
		//	defaults: Object
		//		the object to be cloned before updating
		//	update:   Object
		//		the object, which properties are to be cloned during updating
		if(!update){
			// return dojo.clone(defaults);
			return dojo.delegate(defaults);
		}
		var result = {};
		for(var i in defaults){
			if(!(i in result)){
				result[i] = dojo.clone((i in update) ? update[i] : defaults[i]);
			}
		}
		return result; // Object
	},
	formatNumber: function(x, addSpace){
		// summary: converts a number to a string using a fixed notation
		// x:			Number:		number to be converted
		// addSpace:	Boolean?:	if it is true, add a space before a positive number
		var val = x.toString();
		if(val.indexOf("e") >= 0){
			val = x.toFixed(4);
		}else{
			var point = val.indexOf(".");
			if(point >= 0 && val.length - point > 5){
				val = x.toFixed(4);
			}
		}
		if(x < 0){
			return val; // String
		}
		return addSpace ? " " + val : val; // String
	},
	// font operations
	makeFontString: function(font){
		// summary: converts a font object to a CSS font string
		// font:	Object:	font object (see dojox.gfx.defaultFont)
		return font.style + " " + font.variant + " " + font.weight + " " + font.size + " " + font.family; // Object
	},
	splitFontString: function(str){
		// summary: converts a CSS font string to a font object
		// str:		String:	a CSS font string
		var font = dojox.gfx.getDefault("Font");
		var t = str.split(/\s+/);
		do{
			if(t.length < 5){ break; }
			font.style  = t[0];
			font.varian = t[1];
			font.weight = t[2];
			var i = t[3].indexOf("/");
			font.size = i < 0 ? t[3] : t[3].substring(0, i);
			var j = 4;
			if(i < 0){
				if(t[4] == "/"){
					j = 6;
					break;
				}
				if(t[4].substr(0, 1) == "/"){
					j = 5;
					break;
				}
			}
			if(j + 3 > t.length){ break; }
			font.size = t[j];
			font.family = t[j + 1];
		}while(false);
		return font;	// Object
	},
	// length operations
	cm_in_pt: 72 / 2.54,	// Number: points per centimeter
	mm_in_pt: 7.2 / 2.54,	// Number: points per millimeter
	px_in_pt: function(){
		// summary: returns a number of pixels per point
		return dojox.gfx._base._getCachedFontMeasurements()["12pt"] / 12;	// Number
	},
	pt2px: function(len){
		// summary: converts points to pixels
		// len: Number: a value in points
		return len * dojox.gfx.px_in_pt();	// Number
	},
	px2pt: function(len){
		// summary: converts pixels to points
		// len: Number: a value in pixels
		return len / dojox.gfx.px_in_pt();	// Number
	},
	normalizedLength: function(len) {
		// summary: converts any length value to pixels
		// len: String: a length, e.g., "12pc"
		if(len.length == 0) return 0;
		if(len.length > 2){
			var px_in_pt = dojox.gfx.px_in_pt();
			var val = parseFloat(len);
			switch(len.slice(-2)){
				case "px": return val;
				case "pt": return val * px_in_pt;
				case "in": return val * 72 * px_in_pt;
				case "pc": return val * 12 * px_in_pt;
				case "mm": return val * dojox.gfx.mm_in_pt * px_in_pt;
				case "cm": return val * dojox.gfx.cm_in_pt * px_in_pt;
			}
		}
		return parseFloat(len);	// Number
	},

	// a constant used to split a SVG/VML path into primitive components
	pathVmlRegExp: /([A-Za-z]+)|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,
	pathSvgRegExp: /([A-Za-z])|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,

	equalSources: function(a, b){
		// summary: compares event sources, returns true if they are equal
		return a && b && a == b;
	}
});

}

if(!dojo._hasResource["dojox.gfx"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.gfx"] = true;
dojo.provide("dojox.gfx");




dojo.loadInit(function(){
	//Since loaderInit can be fired before any dojo.provide/require calls,
	//make sure the dojox.gfx object exists and only run this logic if dojox.gfx.renderer
	//has not been defined yet.
	var gfx = dojo.getObject("dojox.gfx", true), sl, flag, match;
	if(!gfx.renderer){
		var renderers = (typeof dojo.config.gfxRenderer == "string" ?
			dojo.config.gfxRenderer : "svg,vml,silverlight,canvas").split(",");

		// mobile platform detection
		// TODO: move to the base?

		var ua = navigator.userAgent, iPhoneOsBuild = 0, androidVersion = 0;
		if(dojo.isSafari >= 3){
			// detect mobile version of WebKit starting with "version 3"

			//	comprehensive iPhone test.  Have to figure out whether it's SVG or Canvas based on the build.
			//	iPhone OS build numbers from en.wikipedia.org.
			if(ua.indexOf("iPhone") >= 0 || ua.indexOf("iPod") >= 0){
				//	grab the build out of this.  Expression is a little nasty because we want
				//		to be sure we have the whole version string.
				match = ua.match(/Version\/(\d(\.\d)?(\.\d)?)\sMobile\/([^\s]*)\s?/);
				if(match){
					//	grab the build out of the match.  Only use the first three because of specific builds.
					iPhoneOsBuild = parseInt(match[4].substr(0,3), 16);
				}
			}
		}
		if(dojo.isWebKit){
			// Android detection
			if(!iPhoneOsBuild){
				match = ua.match(/Android\s+(\d+\.\d+)/);
				if(match){
					androidVersion = parseFloat(match[1]);
					// Android 1.0-1.1 doesn't support SVG but supports Canvas
				}
			}
		}

		for(var i = 0; i < renderers.length; ++i){
			switch(renderers[i]){
				case "svg":
					//	iPhone OS builds greater than 5F1 should have SVG.
					if(!dojo.isIE && (!iPhoneOsBuild || iPhoneOsBuild >= 0x5f1) && !androidVersion && !dojo.isAIR){
						dojox.gfx.renderer = "svg";
					}
					break;
				case "vml":
					if(dojo.isIE){
						dojox.gfx.renderer = "vml";
					}
					break;
				case "silverlight":
					try{
						if(dojo.isIE){
							sl = new ActiveXObject("AgControl.AgControl");
							if(sl && sl.IsVersionSupported("1.0")){
								flag = true;
							}
						}else{
							if(navigator.plugins["Silverlight Plug-In"]){
								flag = true;
							}
						}
					}catch(e){
						flag = false;
					}finally{
						sl = null;
					}
					if(flag){ dojox.gfx.renderer = "silverlight"; }
					break;
				case "canvas":
					//TODO: need more comprehensive test for Canvas
					if(!dojo.isIE){
						dojox.gfx.renderer = "canvas";
					}
					break;
			}
			if(dojox.gfx.renderer){ break; }
		}
		if(dojo.config.isDebug){
			console.log("gfx renderer = " + dojox.gfx.renderer);
		}
	}
});

// include a renderer conditionally
dojo.requireIf(dojox.gfx.renderer == "svg", "dojox.gfx.svg");
dojo.requireIf(dojox.gfx.renderer == "vml", "dojox.gfx.vml");
dojo.requireIf(dojox.gfx.renderer == "silverlight", "dojox.gfx.silverlight");
dojo.requireIf(dojox.gfx.renderer == "canvas", "dojox.gfx.canvas");

}

if(!dojo._hasResource["dojox.xml.parser"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.xml.parser"] = true;
dojo.provide("dojox.xml.parser");

//DOM type to int value for reference.
//Ints make for more compact code than full constant names.
//ELEMENT_NODE                  = 1;
//ATTRIBUTE_NODE                = 2;
//TEXT_NODE                     = 3;
//CDATA_SECTION_NODE            = 4;
//ENTITY_REFERENCE_NODE         = 5;
//ENTITY_NODE                   = 6;
//PROCESSING_INSTRUCTION_NODE   = 7;
//COMMENT_NODE                  = 8;
//DOCUMENT_NODE                 = 9;
//DOCUMENT_TYPE_NODE            = 10;
//DOCUMENT_FRAGMENT_NODE        = 11;
//NOTATION_NODE                 = 12;

dojox.xml.parser.parse = function(/*String?*/ str, /*String?*/ mimetype){
	//	summary:
	//		cross-browser implementation of creating an XML document object from null, empty string, and XML text..
	//
	//	str:
	//		Optional text to create the document from.  If not provided, an empty XML document will be created.  
	//		If str is empty string "", then a new empty document will be created.
	//	mimetype:
	//		Optional mimetype of the text.  Typically, this is text/xml.  Will be defaulted to text/xml if not provided.
	var _document = dojo.doc;
	var doc;

	mimetype = mimetype || "text/xml";
	if(str && dojo.trim(str) && "DOMParser" in dojo.global){
		//Handle parsing the text on Mozilla based browsers etc..
		var parser = new DOMParser();
		doc = parser.parseFromString(str, mimetype);
		var de = doc.documentElement;
		var errorNS = "http://www.mozilla.org/newlayout/xml/parsererror.xml";
		if(de.nodeName == "parsererror" && de.namespaceURI == errorNS){
			var sourceText = de.getElementsByTagNameNS(errorNS, 'sourcetext')[0];
			if(!sourceText){
				sourceText = sourceText.firstChild.data;
			}
        	throw new Error("Error parsing text " + nativeDoc.documentElement.firstChild.data + " \n" + sourceText);
		}
		return doc;

	}else if("ActiveXObject" in dojo.global){
		//Handle IE.
		var ms = function(n){ return "MSXML" + n + ".DOMDocument"; };
		var dp = ["Microsoft.XMLDOM", ms(6), ms(4), ms(3), ms(2)];
		dojo.some(dp, function(p){
			try{
				doc = new ActiveXObject(p);
			}catch(e){ return false; }
			return true;
		});
		if(str && doc){
			doc.async = false;
			doc.loadXML(str);
			var pe = doc.parseError;
			if(pe.errorCode !== 0){
				throw new Error("Line: " + pe.line + "\n" +
					"Col: " + pe.linepos + "\n" +
					"Reason: " + pe.reason + "\n" + 
					"Error Code: " + pe.errorCode + "\n" +
					"Source: " + pe.srcText);
			}
		}
		if(doc){
			return doc; //DOMDocument
		}
	}else if(_document.implementation && _document.implementation.createDocument){
		if(str && dojo.trim(str) && _document.createElement){
			//Everyone else that we couldn't get to work.  Fallback case.
			// FIXME: this may change all tags to uppercase!
			var tmp = _document.createElement("xml");
			tmp.innerHTML = str;
			var xmlDoc = _document.implementation.createDocument("foo", "", null);
			dojo.forEach(tmp.childNodes, function(child){
				xmlDoc.importNode(child, true);
			});
			return xmlDoc;	//	DOMDocument
		}else{
			return _document.implementation.createDocument("", "", null); // DOMDocument
		}
	}
	return null;	//	null
}

dojox.xml.parser.textContent = function(/*Node*/node, /*String?*/text){
	//	summary:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//	description:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//		This function can also update the text of a node by replacing all child 
	//		content of the node.
	//	node:
	//		The node to get the text off of or set the text on.
	//	text:
	//		Optional argument of the text to apply to the node.
	if(arguments.length>1){
		var _document = node.ownerDocument || dojo.doc;  //Preference is to get the node owning doc first or it may fail
		dojox.xml.parser.replaceChildren(node, _document.createTextNode(text));
		return text;	//	String
	}else{
		if(node.textContent !== undefined){ //FF 1.5 -- remove?
			return node.textContent;	//	String
		}
		var _result = "";
		if(node){
			dojo.forEach(node.childNodes, function(child){
				switch(child.nodeType){
					case 1: // ELEMENT_NODE
					case 5: // ENTITY_REFERENCE_NODE
						_result += dojox.xml.parser.textContent(child);
						break;
					case 3: // TEXT_NODE
					case 2: // ATTRIBUTE_NODE
					case 4: // CDATA_SECTION_NODE
						_result += child.nodeValue;
				}
			});
		}
		return _result;	//	String
	}
}

dojox.xml.parser.replaceChildren = function(/*Element*/node, /*Node || Array*/ newChildren){
	//	summary:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	//	description:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	// 	node:
	//		The node to modify the children on
	//	newChildren:
	//		The children to add to the node.  It can either be a single Node or an
	//		array of Nodes.
	var nodes = [];

	if(dojo.isIE){
		dojo.forEach(node.childNodes, function(child){
			nodes.push(child);
		});
	}

	dojox.xml.parser.removeChildren(node);
	dojo.forEach(nodes, dojo.destroy);

	if(!dojo.isArray(newChildren)){
		node.appendChild(newChildren);
	}else{
		dojo.forEach(newChildren, function(child){
			node.appendChild(child);
		});
	}
}

dojox.xml.parser.removeChildren = function(/*Element*/node){
	//	summary:
	//		removes all children from node and returns the count of children removed.
	//		The children nodes are not destroyed. Be sure to call dojo.destroy on them
	//		after they are not used anymore.
	//	node:
	//		The node to remove all the children from.
	var count = node.childNodes.length;
	while(node.hasChildNodes()){
		node.removeChild(node.firstChild);
	}
	return count; // int
}


dojox.xml.parser.innerXML = function(/*Node*/node){
	//	summary:
	//		Implementation of MS's innerXML function.
	//	node:
	//		The node from which to generate the XML text representation.
	if(node.innerXML){
		return node.innerXML;	//	String
	}else if(node.xml){
		return node.xml;		//	String
	}else if(typeof XMLSerializer != "undefined"){
		return (new XMLSerializer()).serializeToString(node);	//	String
	}
	return null;
}

}

if(!dojo._hasResource["dojo.string"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.string"] = true;
dojo.provide("dojo.string");

/*=====
dojo.string = { 
	// summary: String utilities for Dojo
};
=====*/

dojo.string.rep = function(/*String*/str, /*Integer*/num){
	//	summary:
	//		Efficiently replicate a string `n` times.
	//	str:
	//		the string to replicate
	//	num:
	//		number of times to replicate the string
	
	if(num <= 0 || !str){ return ""; }
	
	var buf = [];
	for(;;){
		if(num & 1){
			buf.push(str);
		}
		if(!(num >>= 1)){ break; }
		str += str;
	}
	return buf.join("");	// String
};

dojo.string.pad = function(/*String*/text, /*Integer*/size, /*String?*/ch, /*Boolean?*/end){
	//	summary:
	//		Pad a string to guarantee that it is at least `size` length by
	//		filling with the character `ch` at either the start or end of the
	//		string. Pads at the start, by default.
	//	text:
	//		the string to pad
	//	size:
	//		length to provide padding
	//	ch:
	//		character to pad, defaults to '0'
	//	end:
	//		adds padding at the end if true, otherwise pads at start
	//	example:
	//	|	// Fill the string to length 10 with "+" characters on the right.  Yields "Dojo++++++".
	//	|	dojo.string.pad("Dojo", 10, "+", true);

	if(!ch){
		ch = '0';
	}
	var out = String(text),
		pad = dojo.string.rep(ch, Math.ceil((size - out.length) / ch.length));
	return end ? out + pad : pad + out;	// String
};

dojo.string.substitute = function(	/*String*/		template, 
									/*Object|Array*/map, 
									/*Function?*/	transform, 
									/*Object?*/		thisObject){
	//	summary:
	//		Performs parameterized substitutions on a string. Throws an
	//		exception if any parameter is unmatched.
	//	template: 
	//		a string with expressions in the form `${key}` to be replaced or
	//		`${key:format}` which specifies a format function. keys are case-sensitive. 
	//	map:
	//		hash to search for substitutions
	//	transform: 
	//		a function to process all parameters before substitution takes
	//		place, e.g. dojo.string.encodeXML
	//	thisObject: 
	//		where to look for optional format function; default to the global
	//		namespace
	//	example:
	//	|	// returns "File 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"File '${0}' is not found in directory '${1}'.",
	//	|		["foo.html","/temp"]
	//	|	);
	//	|
	//	|	// also returns "File 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"File '${name}' is not found in directory '${info.dir}'.",
	//	|		{ name: "foo.html", info: { dir: "/temp" } }
	//	|	);
	//	example:
	//		use a transform function to modify the values:
	//	|	// returns "file 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"${0} is not found in ${1}.",
	//	|		["foo.html","/temp"],
	//	|		function(str){
	//	|			// try to figure out the type
	//	|			var prefix = (str.charAt(0) == "/") ? "directory": "file";
	//	|			return prefix + " '" + str + "'";
	//	|		}
	//	|	);
	//	example:
	//		use a formatter
	//	|	// returns "thinger -- howdy"
	//	|	dojo.string.substitute(
	//	|		"${0:postfix}", ["thinger"], null, {
	//	|			postfix: function(value, key){
	//	|				return value + " -- howdy";
	//	|			}
	//	|		}
	//	|	);

	thisObject = thisObject||dojo.global;
	transform = (!transform) ? 
					function(v){ return v; } : 
					dojo.hitch(thisObject, transform);

	return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key, format){
		var value = dojo.getObject(key, false, map);
		if(format){
			value = dojo.getObject(format, false, thisObject).call(thisObject, value, key);
		}
		return transform(value, key).toString();
	}); // string
};

/*=====
dojo.string.trim = function(str){
	//	summary:
	//		Trims whitespace from both sides of the string
	//	str: String
	//		String to be trimmed
	//	returns: String
	//		Returns the trimmed string
	//	description:
	//		This version of trim() was taken from [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The short yet performant version of this function is dojo.trim(),
	//		which is part of Dojo base.  Uses String.prototype.trim instead, if available.
	return "";	// String
}
=====*/

dojo.string.trim = String.prototype.trim ?
	dojo.trim : // aliasing to the native function
	function(str){
		str = str.replace(/^\s+/, '');
		for(var i = str.length - 1; i >= 0; i--){
			if(/\S/.test(str.charAt(i))){
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	};

}

if(!dojo._hasResource["dojo.date.stamp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.date.stamp"] = true;
dojo.provide("dojo.date.stamp");

// Methods to convert dates to or from a wire (string) format using well-known conventions

dojo.date.stamp.fromISOString = function(/*String*/formattedString, /*Number?*/defaultTime){
	//	summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	//	description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//			* dates only
	//			|	* yyyy
	//			|	* yyyy-MM
	//			|	* yyyy-MM-dd
	// 			* times only, with an optional time zone appended
	//			|	* THH:mm
	//			|	* THH:mm:ss
	//			|	* THH:mm:ss.SSS
	// 			* and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	// 		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
	//
  	//	formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	//
	//	defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!dojo.date.stamp._isoRegExp){
		dojo.date.stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = dojo.date.stamp._isoRegExp.exec(formattedString);
	var result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			dojo.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}).forEach(function(value, index){
				if(match[index] === undefined){
					match[index] = value;
				}
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0);
//		result.setFullYear(match[0]||1970); // for year < 100

		var offset = 0;
		var zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
}

/*=====
	dojo.date.stamp.__Options = function(){
		//	selector: String
		//		"date" or "time" for partial formatting of the Date object.
		//		Both date and time will be formatted by default.
		//	zulu: Boolean
		//		if true, UTC/GMT is used for a timezone
		//	milliseconds: Boolean
		//		if true, output milliseconds
		this.selector = selector;
		this.zulu = zulu;
		this.milliseconds = milliseconds;
	}
=====*/

dojo.date.stamp.toISOString = function(/*Date*/dateObject, /*dojo.date.stamp.__Options?*/options){
	//	summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	//	description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	//	dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [];
	var getter = options.zulu ? "getUTC" : "get";
	var date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") + 
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
}

}

if(!dojo._hasResource["dojo.i18n"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.i18n"] = true;
dojo.provide("dojo.i18n");

/*=====
dojo.i18n = {
	// summary: Utility classes to enable loading of resources for internationalization (i18n)
};
=====*/

dojo.i18n.getLocalization = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
	//	summary:
	//		Returns an Object containing the localization for a given resource
	//		bundle in a package, matching the specified locale.
	//	description:
	//		Returns a hash containing name/value pairs in its prototypesuch
	//		that values can be easily overridden.  Throws an exception if the
	//		bundle is not found.  Bundle must have already been loaded by
	//		`dojo.requireLocalization()` or by a build optimization step.  NOTE:
	//		try not to call this method as part of an object property
	//		definition (`var foo = { bar: dojo.i18n.getLocalization() }`).  In
	//		some loading situations, the bundle may not be available in time
	//		for the object definition.  Instead, call this method inside a
	//		function that is run after all modules load or the page loads (like
	//		in `dojo.addOnLoad()`), or in a widget lifecycle method.
	//	packageName:
	//		package which is associated with this resource
	//	bundleName:
	//		the base filename of the resource bundle (without the ".js" suffix)
	//	locale:
	//		the variant to load (optional).  By default, the locale defined by
	//		the host environment: dojo.locale

	locale = dojo.i18n.normalizeLocale(locale);

	// look for nearest locale match
	var elements = locale.split('-');
	var module = [packageName,"nls",bundleName].join('.');
	var bundle = dojo._loadedModules[module];
	if(bundle){
		var localization;
		for(var i = elements.length; i > 0; i--){
			var loc = elements.slice(0, i).join('_');
			if(bundle[loc]){
				localization = bundle[loc];
				break;
			}
		}
		if(!localization){
			localization = bundle.ROOT;
		}

		// make a singleton prototype so that the caller won't accidentally change the values globally
		if(localization){
			var clazz = function(){};
			clazz.prototype = localization;
			return new clazz(); // Object
		}
	}

	throw new Error("Bundle not found: " + bundleName + " in " + packageName+" , locale=" + locale);
};

dojo.i18n.normalizeLocale = function(/*String?*/locale){
	//	summary:
	//		Returns canonical form of locale, as used by Dojo.
	//
	//  description:
	//		All variants are case-insensitive and are separated by '-' as specified in [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt).
	//		If no locale is specified, the dojo.locale is returned.  dojo.locale is defined by
	//		the user agent's locale unless overridden by djConfig.

	var result = locale ? locale.toLowerCase() : dojo.locale;
	if(result == "root"){
		result = "ROOT";
	}
	return result; // String
};

dojo.i18n._requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
	//	summary:
	//		See dojo.requireLocalization()
	//	description:
	// 		Called by the bootstrap, but factored out so that it is only
	// 		included in the build when needed.

	var targetLocale = dojo.i18n.normalizeLocale(locale);
 	var bundlePackage = [moduleName, "nls", bundleName].join(".");
	// NOTE: 
	//		When loading these resources, the packaging does not match what is
	//		on disk.  This is an implementation detail, as this is just a
	//		private data structure to hold the loaded resources.  e.g.
	//		`tests/hello/nls/en-us/salutations.js` is loaded as the object
	//		`tests.hello.nls.salutations.en_us={...}` The structure on disk is
	//		intended to be most convenient for developers and translators, but
	//		in memory it is more logical and efficient to store in a different
	//		order.  Locales cannot use dashes, since the resulting path will
	//		not evaluate as valid JS, so we translate them to underscores.
	
	//Find the best-match locale to load if we have available flat locales.
	var bestLocale = "";
	if(availableFlatLocales){
		var flatLocales = availableFlatLocales.split(",");
		for(var i = 0; i < flatLocales.length; i++){
			//Locale must match from start of string.
			//Using ["indexOf"] so customBase builds do not see
			//this as a dojo._base.array dependency.
			if(targetLocale["indexOf"](flatLocales[i]) == 0){
				if(flatLocales[i].length > bestLocale.length){
					bestLocale = flatLocales[i];
				}
			}
		}
		if(!bestLocale){
			bestLocale = "ROOT";
		}		
	}

	//See if the desired locale is already loaded.
	var tempLocale = availableFlatLocales ? bestLocale : targetLocale;
	var bundle = dojo._loadedModules[bundlePackage];
	var localizedBundle = null;
	if(bundle){
		if(dojo.config.localizationComplete && bundle._built){return;}
		var jsLoc = tempLocale.replace(/-/g, '_');
		var translationPackage = bundlePackage+"."+jsLoc;
		localizedBundle = dojo._loadedModules[translationPackage];
	}

	if(!localizedBundle){
		bundle = dojo["provide"](bundlePackage);
		var syms = dojo._getModuleSymbols(moduleName);
		var modpath = syms.concat("nls").join("/");
		var parent;

		dojo.i18n._searchLocalePath(tempLocale, availableFlatLocales, function(loc){
			var jsLoc = loc.replace(/-/g, '_');
			var translationPackage = bundlePackage + "." + jsLoc;
			var loaded = false;
			if(!dojo._loadedModules[translationPackage]){
				// Mark loaded whether it's found or not, so that further load attempts will not be made
				dojo["provide"](translationPackage);
				var module = [modpath];
				if(loc != "ROOT"){module.push(loc);}
				module.push(bundleName);
				var filespec = module.join("/") + '.js';
				loaded = dojo._loadPath(filespec, null, function(hash){
					// Use singleton with prototype to point to parent bundle, then mix-in result from loadPath
					var clazz = function(){};
					clazz.prototype = parent;
					bundle[jsLoc] = new clazz();
					for(var j in hash){ bundle[jsLoc][j] = hash[j]; }
				});
			}else{
				loaded = true;
			}
			if(loaded && bundle[jsLoc]){
				parent = bundle[jsLoc];
			}else{
				bundle[jsLoc] = parent;
			}
			
			if(availableFlatLocales){
				//Stop the locale path searching if we know the availableFlatLocales, since
				//the first call to this function will load the only bundle that is needed.
				return true;
			}
		});
	}

	//Save the best locale bundle as the target locale bundle when we know the
	//the available bundles.
	if(availableFlatLocales && targetLocale != bestLocale){
		bundle[targetLocale.replace(/-/g, '_')] = bundle[bestLocale.replace(/-/g, '_')];
	}
};

(function(){
	// If other locales are used, dojo.requireLocalization should load them as
	// well, by default. 
	// 
	// Override dojo.requireLocalization to do load the default bundle, then
	// iterate through the extraLocale list and load those translations as
	// well, unless a particular locale was requested.

	var extra = dojo.config.extraLocale;
	if(extra){
		if(!extra instanceof Array){
			extra = [extra];
		}

		var req = dojo.i18n._requireLocalization;
		dojo.i18n._requireLocalization = function(m, b, locale, availableFlatLocales){
			req(m,b,locale, availableFlatLocales);
			if(locale){return;}
			for(var i=0; i<extra.length; i++){
				req(m,b,extra[i], availableFlatLocales);
			}
		};
	}
})();

dojo.i18n._searchLocalePath = function(/*String*/locale, /*Boolean*/down, /*Function*/searchFunc){
	//	summary:
	//		A helper method to assist in searching for locale-based resources.
	//		Will iterate through the variants of a particular locale, either up
	//		or down, executing a callback function.  For example, "en-us" and
	//		true will try "en-us" followed by "en" and finally "ROOT".

	locale = dojo.i18n.normalizeLocale(locale);

	var elements = locale.split('-');
	var searchlist = [];
	for(var i = elements.length; i > 0; i--){
		searchlist.push(elements.slice(0, i).join('-'));
	}
	searchlist.push(false);
	if(down){searchlist.reverse();}

	for(var j = searchlist.length - 1; j >= 0; j--){
		var loc = searchlist[j] || "ROOT";
		var stop = searchFunc(loc);
		if(stop){ break; }
	}
};

dojo.i18n._preloadLocalizations = function(/*String*/bundlePrefix, /*Array*/localesGenerated){
	//	summary:
	//		Load built, flattened resource bundles, if available for all
	//		locales used in the page. Only called by built layer files.

	function preload(locale){
		locale = dojo.i18n.normalizeLocale(locale);
		dojo.i18n._searchLocalePath(locale, true, function(loc){
			for(var i=0; i<localesGenerated.length;i++){
				if(localesGenerated[i] == loc){
					dojo["require"](bundlePrefix+"_"+loc);
					return true; // Boolean
				}
			}
			return false; // Boolean
		});
	}
	preload();
	var extra = dojo.config.extraLocale||[];
	for(var i=0; i<extra.length; i++){
		preload(extra[i]);
	}
};

}

if(!dojo._hasResource["dojox.atom.io.model"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.atom.io.model"] = true;
dojo.provide("dojox.atom.io.model");






dojox.atom.io.model._Constants = {
	//	summary: 
	//		Container for general constants.
	//	description: 
	//		Container for general constants.
	"ATOM_URI": "http://www.w3.org/2005/Atom",
	"ATOM_NS": "http://www.w3.org/2005/Atom",
	"PURL_NS": "http://purl.org/atom/app#",
	"APP_NS": "http://www.w3.org/2007/app"
};

dojox.atom.io.model._actions = {
	//	summary: 
	//		Container for tag handling functions.
	//	description: 
	//		Container for tag handling functions.  Each child of this container is
	//		a handler function for the given type of node. Each accepts two parameters:
	//	obj:  Object.
	//		  The object to insert data into.
	//	node: DOM Node.
	//		  The dom node containing the data
	"link": function(obj,node){
		if(obj.links === null){obj.links = [];}
		var link = new dojox.atom.io.model.Link();
		link.buildFromDom(node);
		obj.links.push(link);
	},
	"author": function(obj,node){
		if(obj.authors === null){obj.authors = [];}
		var person = new dojox.atom.io.model.Person("author");
		person.buildFromDom(node);
		obj.authors.push(person);
	},
	"contributor": function(obj,node){
		if(obj.contributors === null){obj.contributors = [];}
		var person = new dojox.atom.io.model.Person("contributor");
		person.buildFromDom(node);
		obj.contributors.push(person);
	},
	"category": function(obj,node){
		if(obj.categories === null){obj.categories = [];}
		var cat = new dojox.atom.io.model.Category();
		cat.buildFromDom(node);
		obj.categories.push(cat);
	},
	"icon": function(obj,node){
		obj.icon = dojox.xml.parser.textContent(node);
	},
	"id": function(obj,node){
		obj.id = dojox.xml.parser.textContent(node);
	},
	"rights": function(obj,node){
		obj.rights = dojox.xml.parser.textContent(node);
	},
	"subtitle": function(obj,node){
		var cnt = new dojox.atom.io.model.Content("subtitle");
		cnt.buildFromDom(node);
		obj.subtitle = cnt;
	},
	"title": function(obj,node){
		var cnt = new dojox.atom.io.model.Content("title");
		cnt.buildFromDom(node);
		obj.title = cnt;
	},
	"updated": function(obj,node){
		obj.updated = dojox.atom.io.model.util.createDate(node);
	},
	// Google news
	"issued": function(obj,node){
		obj.issued = dojox.atom.io.model.util.createDate(node);
	},
	// Google news
	"modified": function(obj,node){
		obj.modified = dojox.atom.io.model.util.createDate(node);
	},
	"published": function(obj,node){
		obj.published = dojox.atom.io.model.util.createDate(node);	  
	},
	"entry": function(obj,node){
		if(obj.entries === null){obj.entries = [];}
		//The object passed in should be a Feed object, since only feeds can contain Entries
		var entry = obj.createEntry ? obj.createEntry() : new dojox.atom.io.model.Entry();
		entry.buildFromDom(node);
		obj.entries.push(entry);	
	}, 
	"content": function(obj, node){
		var cnt = new dojox.atom.io.model.Content("content");
		cnt.buildFromDom(node);
		obj.content = cnt;
	}, 
	"summary": function(obj, node){
		var summary = new dojox.atom.io.model.Content("summary");
		summary.buildFromDom(node);
		obj.summary = summary;
	}, 

	"name": function(obj,node){
		obj.name = dojox.xml.parser.textContent(node);
	},
	"email" : function(obj,node){
		obj.email = dojox.xml.parser.textContent(node);
	},
	"uri" : function(obj,node){
		obj.uri = dojox.xml.parser.textContent(node);
	},
	"generator" : function(obj,node){
		obj.generator = new dojox.atom.io.model.Generator();
		obj.generator.buildFromDom(node);
	}
};

dojox.atom.io.model.util = {
	createDate: function(/*DOM node*/node){
		//	summary: 
		//		Utility function to create a date from a DOM node's text content.
		//	description: 
		//		Utility function to create a date from a DOM node's text content.
		//
		//	node: 
		//		The DOM node to inspect.
		//	returns: 
		//		Date object from a DOM Node containing a ISO-8610 string.
		var textContent = dojox.xml.parser.textContent(node);
		if(textContent){
			return dojo.date.stamp.fromISOString(dojo.trim(textContent));
		}
		return null;
	},
	escapeHtml: function(/*String*/str){
		//	summary: 
		//		Utility function to escape XML special characters in an HTML string.
		//	description: 
		//		Utility function to escape XML special characters in an HTML string.
		//
		// 	str: 
		//		The string to escape
		//	returns: 
		//		HTML String with special characters (<,>,&, ", etc,) escaped.
		str = str.replace(/&/gm, "&amp;").replace(/</gm, "&lt;").replace(/>/gm, "&gt;").replace(/"/gm, "&quot;");
		str = str.replace(/'/gm, "&#39;"); 
		return str;
	},
	unEscapeHtml: function(/*String*/str){
		//	summary: 
		//		Utility function to un-escape XML special characters in an HTML string.
		//	description: 
		//		Utility function to un-escape XML special characters in an HTML string.
		//
		//	str: 
		//		The string to un-escape.
		//	returns: 
		//		HTML String converted back to the normal text (unescaped) characters (<,>,&, ", etc,).
		str = str.replace(/&amp;/gm, "&").replace(/&lt;/gm, "<").replace(/&gt;/gm, ">").replace(/&quot;/gm, "\"");
		str = str.replace(/&#39;/gm, "'"); 
		return str;
	},
	getNodename: function(/*DOM node*/node){
		//	summary: 
		//		Utility function to get a node name and deal with IE's bad handling of namespaces
		//		on tag names.
		//	description: 
		//		Utility function to get a node name and deal with IE's bad handling of namespaces
		//		on tag names.
		//
		//	node: 
		//		The DOM node whose name to retrieve.
		//	returns: 
		//		String
		//	The name without namespace prefixes.
		var name = null;
		if(node !== null){
			name = node.localName ? node.localName: node.nodeName;
			if(name !== null){
				var nsSep = name.indexOf(":");
				if(nsSep !== -1){
					name = name.substring((nsSep + 1), name.length);
				}
			}
		}
		return name;
	}
};

dojo.declare('dojox.atom.io.model.Node', null, {
	constructor: function(name_space,name, attributes,content, shortNs){
		this.name_space = name_space;
		this.name = name;
		this.attributes = [];
		if(attributes){
			this.attributes = attributes;
		}
		this.content = [];
		this.rawNodes = [];
		this.textContent = null;
		if(content){
			this.content.push(content);
		}
		this.shortNs = shortNs;
		this._objName = "Node";//for debugging purposes
	},
	buildFromDom: function(node){
		this._saveAttributes(node);
		this.name_space = node.namespaceURI;
		this.shortNs = node.prefix;
		this.name = dojox.atom.io.model.util.getNodename(node);
		for(var x=0; x < node.childNodes.length; x++){
			var c = node.childNodes[x];
			if(dojox.atom.io.model.util.getNodename(c) != "#text" ){
				this.rawNodes.push(c);
				var n = new dojox.atom.io.model.Node();
				n.buildFromDom(c, true);
				this.content.push(n);
			}else{
				this.content.push(c.nodeValue);
			}
		}
		this.textContent = dojox.xml.parser.textContent(node);
	},
	_saveAttributes: function(node){
		if(!this.attributes){this.attributes = [];}
		// Work around lack of hasAttributes() in IE
		var hasAttributes = function(node){
			var attrs = node.attributes;
			if(attrs === null){return false;}
			return (attrs.length !== 0);
		};
	
		if(hasAttributes(node) && this._getAttributeNames){
			var names = this._getAttributeNames(node);
			if(names && names.length > 0){
				for(var x in names){
					var attrib = node.getAttribute(names[x]);
					if(attrib){this.attributes[names[x]] = attrib;}
				}
			}
		}
	},
	addAttribute: function(name, value){
		this.attributes[name]=value;
	},
	getAttribute: function(name){
		return this.attributes[name];
	},
	//if child objects want their attributes parsed, they should override
	//to return an array of attrib names
	_getAttributeNames: function(node){
		var names = [];
		for(var i =0; i<node.attributes.length; i++){
			names.push(node.attributes[i].nodeName);
		}
		return names;
	},
	toString: function(){
		var xml = [];
		var x;
		var name = (this.shortNs?this.shortNs+":":'')+this.name;
		var cdata = (this.name == "#cdata-section");
		if(cdata){ 
			xml.push("<![CDATA[");
			xml.push(this.textContent);
			xml.push("]]>");
		}else{
			xml.push("<");
			xml.push(name);
			if(this.name_space){
				xml.push(" xmlns='" + this.name_space + "'");
			}
			if(this.attributes){
				for(x in this.attributes){
					xml.push(" " + x + "='" + this.attributes[x] + "'");
				}
			}
			if(this.content){
				xml.push(">");
				for(x in this.content){ 
					xml.push(this.content[x]);
				}
				xml.push("</" + name + ">\n");
			}else{
				xml.push("/>\n");
			}
		}
		return xml.join('');
	},
	addContent: function(content){
		this.content.push(content);
	}
});
//Types are as follows: links: array of Link, authors: array of Person, categories: array of Category
//contributors: array of Person, ico
dojo.declare("dojox.atom.io.model.AtomItem",dojox.atom.io.model.Node,{
	 constructor: function(args){
		this.ATOM_URI = dojox.atom.io.model._Constants.ATOM_URI;
		this.links = null;				  		//Array of Link
		this.authors = null;					//Array of Person
		this.categories = null;					//Array of Category
		this.contributors = null;				//Array of Person   
		this.icon = this.id = this.logo = this.xmlBase = this.rights = null; //String
		this.subtitle = this.title = null;		//Content
		this.updated = this.published = null;	//Date
		// Google news
		this.issued = this.modified = null;		//Date
		this.content =  null;					//Content
		this.extensions = null;					//Array of Node, non atom based
		this.entries = null;					//Array of Entry
		this.name_spaces = {};
		this._objName = "AtomItem";			 //for debugging purposes
	},
	// summary: Class container for generic Atom items.
	// description: Class container for generic Atom items.
	_getAttributeNames: function(){return null;},
	_accepts: {},
	accept: function(tag){return Boolean(this._accepts[tag]);},
	_postBuild: function(){},//child objects can override this if they want to be called after a Dom build
	buildFromDom: function(node){
		var i, c, n;
		for(i=0; i<node.attributes.length; i++){
			c = node.attributes.item(i);
			n = dojox.atom.io.model.util.getNodename(c);
			if(c.prefix == "xmlns" && c.prefix != n){
				this.addNamespace(c.nodeValue, n);
			}
		}
		c = node.childNodes;
		for(i = 0; i< c.length; i++){
			if(c[i].nodeType == 1) {
				var name = dojox.atom.io.model.util.getNodename(c[i]);
				if(!name){continue;}
				if(c[i].namespaceURI != dojox.atom.io.model._Constants.ATOM_NS && name != "#text"){
					if(!this.extensions){this.extensions = [];}
					var extensionNode = new dojox.atom.io.model.Node();
					extensionNode.buildFromDom(c[i]);
					this.extensions.push(extensionNode);
				}
				if(!this.accept(name.toLowerCase())){
					continue;
				}
				var fn = dojox.atom.io.model._actions[name];
				if(fn) {
					fn(this,c[i]);
				}
			}
		}
		this._saveAttributes(node); 
		if(this._postBuild){this._postBuild();}
	},
	addNamespace: function(fullName, shortName){
		if(fullName && shortName){
			this.name_spaces[shortName] = fullName;
		}
	},
	addAuthor: function(/*String*/name, /*String*/email, /*String*/uri){
		//	summary: 
		//		Function to add in an author to the list of authors.
		//	description: 
		//		Function to add in an author to the list of authors.
		//
		//	name: 
		//		The author's name.
		//	email: 
		//		The author's e-mail address.
		//	uri: 
		//		A URI associated with the author.
		if(!this.authors){this.authors = [];}
		this.authors.push(new dojox.atom.io.model.Person("author",name,email,uri));
	},
	addContributor: function(/*String*/name, /*String*/email, /*String*/uri){
		//	summary: 
		//		Function to add in an author to the list of authors.
		//	description: 
		//		Function to add in an author to the list of authors.
		//
		//	name: 
		//		The author's name.
		//	email: 
		//		The author's e-mail address.
		//	uri: 
		//		A URI associated with the author.
		if(!this.contributors){this.contributors = [];}
		this.contributors.push(new dojox.atom.io.model.Person("contributor",name,email,uri));
	},
	addLink: function(/*String*/href,/*String*/rel,/*String*/hrefLang,/*String*/title,/*String*/type){
		//	summary: 
		//		Function to add in a link to the list of links.
		//	description: 
		//		Function to add in a link to the list of links.
		//
		//	href: 
		//		The href.
		//	rel: 
		//		String
		//	hrefLang: 
		//		String
		//	title: 
		//		A title to associate with the link.
		//	type: 
		//		The type of link is is.
		if(!this.links){this.links=[];}
		this.links.push(new dojox.atom.io.model.Link(href,rel,hrefLang,title,type));
	},
	removeLink: function(/*String*/href, /*String*/rel){
		//	summary: 
		//		Function to remove a link from the list of links.
		//	description: 
		//		Function to remove a link from the list of links.
		//
		//	href: 
		//		The href.
		//	rel: 
		//		String
		if(!this.links || !dojo.isArray(this.links)){return;}
		var count = 0;
		for(var i = 0; i < this.links.length; i++){
			if((!href || this.links[i].href === href) && (!rel || this.links[i].rel === rel)){
				this.links.splice(i,1); count++;
			}
		}
		return count;
	},
	removeBasicLinks: function(){
		//	summary: 
		//		Function to remove all basic links from the list of links.
		//	description: 
		//		Function to remove all basic link from the list of links.
		if(!this.links){return;}
		var count = 0;
		for(var i = 0; i < this.links.length; i++){
			if(!this.links[i].rel){this.links.splice(i,1); count++; i--;}
		}
		return count;
	},
	addCategory: function(/*String*/scheme, /*String*/term, /*String*/label){
		//	summary: 
		//		Function to add in a category to the list of categories.
		//	description: 
		//		Function to add in a category to the list of categories.
		//
		//	scheme: 
		//		String
		//	term: 
		//		String
		//	label: 
		//		String
		if(!this.categories){this.categories = [];}
		this.categories.push(new dojox.atom.io.model.Category(scheme,term,label));
	},
	getCategories: function(/*String*/scheme){
		//	summary: 
		//		Function to get all categories that match a particular scheme.
		//	description: 
		//		Function to get all categories that match a particular scheme.
		//
		//	scheme: 
		//		String
		//		The scheme to filter on.
		if(!scheme){return this.categories;}
		//If categories belonging to a particular scheme are required, then create a new array containing these
		var arr = [];
		for(var x in this.categories){
			if(this.categories[x].scheme === scheme){arr.push(this.categories[x]);}
		}
		return arr;
	},
	removeCategories: function(/*String*/scheme, /*String*/term){
		//	summary: 
		//		Function to remove all categories that match a particular scheme and term.
		//	description: 
		//		Function to remove all categories that match a particular scheme and term.
		//
		//	scheme: 
		//		The scheme to filter on.
		//	term: 
		//		The term to filter on.
		if(!this.categories){return;}
		var count = 0;
		for(var i=0; i<this.categories.length; i++){
			if((!scheme || this.categories[i].scheme === scheme) && (!term || this.categories[i].term === term)){
				this.categories.splice(i, 1); count++; i--;
			}
		}
		return count;
	},
	setTitle: function(/*String*/str, /*String*/type){
		//	summary: 
		//		Function to set the title of the item.
		//	description: 
		//		Function to set the title of the item.
		//
		//	str: 
		//		The title to set.
		//	type: 
		//		The type of title format, text, xml, xhtml, etc.
		if(!str){return;}
		this.title = new dojox.atom.io.model.Content("title");
		this.title.value = str;
		if(type){this.title.type = type;}
	},
	addExtension: function(/*String*/name_space,/*String*/name, /*Array*/attributes, /*String*/content, /*String*/shortNS){
		//	summary: 
		//		Function to add in an extension namespace into the item.
		//	description: 
		//		Function to add in an extension namespace into the item.
		//
		//	name_space: 
		//		The namespace of the extension.
		//	name: 
		//		The name of the extension
		//	attributes: 
		//		The attributes associated with the extension.
		//	content: 
		//		The content of the extension.
		if(!this.extensions){this.extensions=[];}
		this.extensions.push(new dojox.atom.io.model.Node(name_space,name,attributes,content, shortNS || "ns"+this.extensions.length));
	},
	getExtensions: function(/*String*/name_space, /*String*/name){
		//	summary: 
		//		Function to get extensions that match a namespace and name.
		//	description: 
		//		Function to get extensions that match a namespace and name.
		//
		//	name_space: 
		//		The namespace of the extension.
		//	name: 
		//		The name of the extension
		var arr = [];
		if(!this.extensions){return arr;}
		for(var x in this.extensions){
			if((this.extensions[x].name_space === name_space || this.extensions[x].shortNs === name_space) && (!name || this.extensions[x].name === name)){
				arr.push(this.extensions[x]);
			}
		}
		return arr;
	},
	removeExtensions: function(/*String*/name_space, /*String*/name){
		//	summary: 
		//		Function to remove extensions that match a namespace and name.
		//	description: 
		//		Function to remove extensions that match a namespace and name.
		//
		//	name_space: 
		//		The namespace of the extension.
		//	name: 
		//		The name of the extension
		if(!this.extensions){return;}
		for(var i=0; i< this.extensions.length; i++){
			if((this.extensions[i].name_space == name_space || this.extensions[i].shortNs === name_space) && this.extensions[i].name === name){
				this.extensions.splice(i,1);
				i--;
			}
		}
	},
	destroy: function() {
		this.links = null;
		this.authors = null;
		this.categories = null;
		this.contributors = null;
		this.icon = this.id = this.logo = this.xmlBase = this.rights = null;
		this.subtitle = this.title = null;
		this.updated = this.published = null;
		// Google news
		this.issued = this.modified = null;
		this.content =  null;
		this.extensions = null;
		this.entries = null;
	}
});

dojo.declare("dojox.atom.io.model.Category",dojox.atom.io.model.Node,{
	//	summary: 
	//		Class container for 'Category' types. 
	//	description: 
	//		Class container for 'Category' types.
	constructor: function(/*String*/scheme, /*String*/term, /*String*/label){
		this.scheme = scheme; this.term = term; this.label = label;
		this._objName = "Category";//for debugging
	},
	_postBuild: function(){},
	_getAttributeNames: function(){
		return ["label","scheme","term"];
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the category tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the category tag, which is an XML structure.
		var s = [];
		s.push('<category ');
		if(this.label){s.push(' label="'+this.label+'" ');}
		if(this.scheme){s.push(' scheme="'+this.scheme+'" ');}
		if(this.term){s.push(' term="'+this.term+'" ');}
		s.push('/>\n');
		return s.join('');
	},
	buildFromDom: function(/*DOM node*/node){
		//	summary: 
		//		Function to do construction of the Category data from the DOM node containing it.
		// 	description: 
		//		Function to do construction of the Category data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for content.
		this._saveAttributes(node);//just get the attributes from the node
		this.label = this.attributes.label;
		this.scheme = this.attributes.scheme;
		this.term = this.attributes.term;
		if(this._postBuild){this._postBuild();}
	}
});

dojo.declare("dojox.atom.io.model.Content",dojox.atom.io.model.Node,{
	//	summary: 
	//		Class container for 'Content' types. Such as summary, content, username, and so on types of data.
	//	description: 
	//		Class container for 'Content' types. Such as summary, content, username, and so on types of data.
	constructor: function(tagName, value, src, type,xmlLang){
		this.tagName = tagName; this.value = value; this.src = src; this.type=type; this.xmlLang = xmlLang;
		this.HTML = "html"; this.TEXT = "text"; this.XHTML = "xhtml"; this.XML="xml";
		this._useTextContent = "true";
	},
	_getAttributeNames: function(){return ["type","src"];},
	_postBuild: function(){},
	buildFromDom: function(/*DOM node*/node){
		//	summary: 
		//		Function to do construction of the Content data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the Content data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for content.
		if(node.innerHTML){
			this.value = node.innerHTML;
		}else{
			this.value = dojox.xml.parser.textContent(node);
		}

		this._saveAttributes(node);

		if(this.attributes){
			this.type = this.attributes.type;
			this.scheme = this.attributes.scheme;
			this.term = this.attributes.term;
		}
		if(!this.type){this.type = "text";}

		//We need to unescape the HTML content here so that it can be displayed correctly when the value is fetched.
		var lowerType = this.type.toLowerCase();
		if(lowerType === "html" || lowerType === "text/html" || lowerType === "xhtml" || lowerType === "text/xhtml"){
			this.value = dojox.atom.io.model.util.unEscapeHtml(this.value);
		}

		if(this._postBuild){this._postBuild();}
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the content tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the content tag, which is an XML structure.
		var s = [];
		s.push('<'+this.tagName+' ');
		if(!this.type){this.type = "text";}
		if(this.type){s.push(' type="'+this.type+'" ');}
		if(this.xmlLang){s.push(' xml:lang="'+this.xmlLang+'" ');}
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'" ');}
		
		//all HTML must be escaped
		if(this.type.toLowerCase() == this.HTML){
			s.push('>'+dojox.atom.io.model.util.escapeHtml(this.value)+'</'+this.tagName+'>\n');
		}else{
			s.push('>'+this.value+'</'+this.tagName+'>\n');
		}
		var ret = s.join('');
		return ret;
	}
});

dojo.declare("dojox.atom.io.model.Link",dojox.atom.io.model.Node,{
	//	summary: 
	//		Class container for 'link' types.
	//	description: 
	//		Class container for 'link' types.
	constructor: function(href,rel,hrefLang,title,type){
		this.href = href; this.hrefLang = hrefLang; this.rel = rel; this.title = title;this.type = type;
	},
	_getAttributeNames: function(){return ["href","jrefLang","rel","title","type"];},
	_postBuild: function(){},
	buildFromDom: function(node){
		//	summary: 
		//		Function to do construction of the link data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the link data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for link data.
		this._saveAttributes(node);//just get the attributes from the node
		this.href = this.attributes.href;
		this.hrefLang = this.attributes.hreflang;
		this.rel = this.attributes.rel;
		this.title = this.attributes.title;
		this.type = this.attributes.type;
		if(this._postBuild){this._postBuild();}
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the link tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the link tag, which is an XML structure.
		var s = []; 
		s.push('<link ');
		if(this.href){s.push(' href="'+this.href+'" ');}
		if(this.hrefLang){s.push(' hrefLang="'+this.hrefLang+'" ');}
		if(this.rel){s.push(' rel="'+this.rel+'" ');}
		if(this.title){s.push(' title="'+this.title+'" ');}
		if(this.type){s.push(' type = "'+this.type+'" ');}
		s.push('/>\n');
		return s.join('');
	}
});

dojo.declare("dojox.atom.io.model.Person",dojox.atom.io.model.Node,{
	//	summary: 
	//		Class container for 'person' types, such as Author, controbutors, and so on.
	//	description: 
	//		Class container for 'person' types, such as Author, controbutors, and so on.
	constructor: function(personType, name, email, uri){
		this.author = "author";
		this.contributor = "contributor";
		if(!personType){
			personType = this.author;
		}
		this.personType = personType;
		this.name = name || '';
		this.email = email || '';
		this.uri = uri || '';
		this._objName = "Person";//for debugging
	},
	_getAttributeNames: function(){return null;},
	_postBuild: function(){},
	accept: function(tag){return Boolean(this._accepts[tag]);},
	buildFromDom: function(node){
		//	summary: 
		//		Function to do construction of the person data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the person data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for person data.
		var c = node.childNodes;
		for(var i = 0; i< c.length; i++){
			var name = dojox.atom.io.model.util.getNodename(c[i]);
			
			if(!name){continue;}

			if(c[i].namespaceURI != dojox.atom.io.model._Constants.ATOM_NS && name != "#text"){
				if(!this.extensions){this.extensions = [];}
				var extensionNode = new dojox.atom.io.model.Node();
				extensionNode.buildFromDom(c[i]);
				this.extensions.push(extensionNode);
			}
			if(!this.accept(name.toLowerCase())){
				continue;
			}
			var fn = dojox.atom.io.model._actions[name];
			if(fn) {
				fn(this,c[i]);
			}
		}
		this._saveAttributes(node); 
		if(this._postBuild){this._postBuild();}
	},
	_accepts: {
		'name': true,
		'uri': true,
		'email': true
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the Person tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the Person tag, which is an XML structure.
		var s = [];
		s.push('<'+this.personType+'>\n');
		if(this.name){s.push('\t<name>'+this.name+'</name>\n');}
		if(this.email){s.push('\t<email>'+this.email+'</email>\n');}
		if(this.uri){s.push('\t<uri>'+this.uri+'</uri>\n');}
		s.push('</'+this.personType+'>\n');
		return s.join('');
	}
});

dojo.declare("dojox.atom.io.model.Generator",dojox.atom.io.model.Node,{
	//	summary: 
	//		Class container for 'Generator' types.
	//	description: 
	//		Class container for 'Generator' types.
	constructor: function(/*String*/uri, /*String*/version, /*String*/value){
		this.uri = uri;
		this.version = version;
		this.value = value;
	},
	_postBuild: function(){},
	buildFromDom: function(node){
		//	summary: 
		//		Function to do construction of the generator data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the generator data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for link data.

		this.value = dojox.xml.parser.textContent(node);
		this._saveAttributes(node);

		this.uri = this.attributes.uri; 
		this.version = this.attributes.version;

		if(this._postBuild){this._postBuild();}
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the Generator tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the Generator tag, which is an XML structure.
		var s = [];
		s.push('<generator ');
		if(this.uri){s.push(' uri="'+this.uri+'" ');}
		if(this.version){s.push(' version="'+this.version+'" ');}
		s.push('>'+this.value+'</generator>\n');
		var ret = s.join('');
		return ret;
	}
});

dojo.declare("dojox.atom.io.model.Entry",dojox.atom.io.model.AtomItem,{
	//	summary: 
	//		Class container for 'Entry' types.
	//	description: 
	//		Class container for 'Entry' types.
	constructor: function(/*String*/id){
		this.id = id; this._objName = "Entry"; this.feedUrl = null;
	},
	_getAttributeNames: function(){return null;},
	_accepts: {
		'author': true,
		'content': true,
		'category': true,
		'contributor': true,
		'created': true,
		'id': true,
		'link': true,
		'published': true,
		'rights': true,
		'summary': true,
		'title': true,
		'updated': true,
		'xmlbase': true,
		'issued': true,
		'modified': true
	},
	toString: function(amPrimary){
		//	summary: 
		//		Function to construct string form of the entry tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the entry tag, which is an XML structure.
		var s = [];
		var i;
		if(amPrimary){
			s.push("<?xml version='1.0' encoding='UTF-8'?>");
			s.push("<entry xmlns='"+dojox.atom.io.model._Constants.ATOM_URI+"'");
		}else{s.push("<entry");}
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'" ');}
		for(i in this.name_spaces){s.push(' xmlns:'+i+'="'+this.name_spaces[i]+'"');}
		s.push('>\n');
		s.push('<id>' + (this.id ? this.id: '') + '</id>\n'); 
		if(this.issued && !this.published){this.published = this.issued;}
		if(this.published){s.push('<published>'+dojo.date.stamp.toISOString(this.published)+'</published>\n');}
		if(this.created){s.push('<created>'+dojo.date.stamp.toISOString(this.created)+'</created>\n');}
		//Google News
		if(this.issued){s.push('<issued>'+dojo.date.stamp.toISOString(this.issued)+'</issued>\n');}

		//Google News
		if(this.modified){s.push('<modified>'+dojo.date.stamp.toISOString(this.modified)+'</modified>\n');}

		if(this.modified && !this.updated){this.updated = this.modified;}
		if(this.updated){s.push('<updated>'+dojo.date.stamp.toISOString(this.updated)+'</updated>\n');}
		if(this.rights){s.push('<rights>'+this.rights+'</rights>\n');}
		if(this.title){s.push(this.title.toString());}
		if(this.summary){s.push(this.summary.toString());}
		var arrays = [this.authors,this.categories,this.links,this.contributors,this.extensions];
		for(var x in arrays){
			if(arrays[x]){
				for(var y in arrays[x]){
					s.push(arrays[x][y]);
				}
			}
		}
		if(this.content){s.push(this.content.toString());}
		s.push("</entry>\n");
		return s.join(''); //string
	},
	getEditHref: function(){
		//	summary: 
		//		Function to get the href that allows editing of this feed entry.
		//	description: 
		//		Function to get the href that allows editing of this feed entry.
		//
		// 	returns: 
		//		The href that specifies edit capability.
		if(this.links === null || this.links.length === 0){
			return null;
		}
		for(var x in this.links){
			if(this.links[x].rel && this.links[x].rel == "edit"){
				return this.links[x].href; //string
			}
		}
		return null;
	},
	setEditHref: function(url){
		if(this.links === null){
			this.links = [];
		}
		for(var x in this.links){
			if(this.links[x].rel && this.links[x].rel == "edit"){
				this.links[x].href = url;
				return;
			}
		}
		this.addLink(url, 'edit');
	}
});

dojo.declare("dojox.atom.io.model.Feed",dojox.atom.io.model.AtomItem,{
	//	summary: 
	//		Class container for 'Feed' types.
	//	description: 
	//		Class container for 'Feed' types.
	_accepts: {
		'author': true,
		'content': true,
		'category': true,
		'contributor': true,
		'created': true,
		'id': true,
		'link': true,
		'published': true,
		'rights': true,
		'summary': true,
		'title': true,
		'updated': true,
		'xmlbase': true,
		'entry': true,
		'logo': true,
		'issued': true,
		'modified': true,
		'icon': true,
		'subtitle': true
	},
	addEntry: function(/*object*/entry){
		//	summary: 
		//		Function to add an entry to this feed.
		//	description: 
		//		Function to add an entry to this feed.
		//	entry: 
		//		The entry object to add.
		if(!entry.id){
			var _nlsResources = dojo.i18n.getLocalization("dojox.atom.io", "messages");
			throw new Error(_nlsResources.noId);
		}
		if(!this.entries){this.entries = [];}
		entry.feedUrl = this.getSelfHref();
		this.entries.push(entry);
	},
	getFirstEntry: function(){
		//	summary: 
		//		Function to get the first entry of the feed.
		//	description: 
		//		Function to get the first entry of the feed.
		//
		//	returns: 
		//		The first entry in the feed.
		if(!this.entries || this.entries.length === 0){return null;}
		return this.entries[0]; //object
	},
	getEntry: function(/*String*/entryId){
		//	summary: 
		//		Function to get an entry by its id.
		//	description: 
		//		Function to get an entry by its id.
		//
		//	returns: 
		//		The entry desired, or null if none.
		if(!this.entries){return null;}
		for(var x in this.entries){
			if(this.entries[x].id == entryId){
				return this.entries[x];
			}
		}
		return null;
	},
	removeEntry: function(/*object*/entry){
		//	summary: 
		//		Function to remove an entry from the list of links.
		//	description: 
		//		Function to remove an entry from the list of links.
		//
		//	entry: 
		//		The entry.
		if(!this.entries){return;}
		var count = 0;
		for(var i = 0; i < this.entries.length; i++){
			if(this.entries[i] === entry){
				this.entries.splice(i,1);
				count++;
			}
		}
		return count;
	},
	setEntries: function(/*array*/arrayOfEntry){
		//	summary: 
		//		Function to add a set of entries to the feed.
		//	description: 
		//		Function to get an entry by its id.
		//
		//	arrayOfEntry: 
		//		An array of entry objects to add to the feed.
		for(var x in arrayOfEntry){
			this.addEntry(arrayOfEntry[x]);
		}
	},
	toString: function(){
		//	summary: 
		//		Function to construct string form of the feed tag, which is an XML structure.
		//	description: 
		//		Function to construct string form of the feed tag, which is an XML structure.
		var s = [];
		var i;
		s.push('<?xml version="1.0" encoding="utf-8"?>\n');
		s.push('<feed xmlns="'+dojox.atom.io.model._Constants.ATOM_URI+'"');
		if(this.xmlBase){s.push(' xml:base="'+this.xmlBase+'"');}
		for(i in this.name_spaces){s.push(' xmlns:'+i+'="'+this.name_spaces[i]+'"');}
		s.push('>\n');
		s.push('<id>' + (this.id ? this.id: '') + '</id>\n'); 
		if(this.title){s.push(this.title);}
		if(this.copyright && !this.rights){this.rights = this.copyright;}
		if(this.rights){s.push('<rights>' + this.rights + '</rights>\n');}
		
		// Google news
		if(this.issued){s.push('<issued>'+dojo.date.stamp.toISOString(this.issued)+'</issued>\n');}
		if(this.modified){s.push('<modified>'+dojo.date.stamp.toISOString(this.modified)+'</modified>\n');}

		if(this.modified && !this.updated){this.updated=this.modified;}
		if(this.updated){s.push('<updated>'+dojo.date.stamp.toISOString(this.updated)+'</updated>\n');}
		if(this.published){s.push('<published>'+dojo.date.stamp.toISOString(this.published)+'</published>\n');}
		if(this.icon){s.push('<icon>'+this.icon+'</icon>\n');}
		if(this.language){s.push('<language>'+this.language+'</language>\n');}
		if(this.logo){s.push('<logo>'+this.logo+'</logo>\n');}
		if(this.subtitle){s.push(this.subtitle.toString());}
		if(this.tagline){s.push(this.tagline.toString());}
		//TODO: need to figure out what to do with xmlBase
		var arrays = [this.alternateLinks,this.authors,this.categories,this.contributors,this.otherLinks,this.extensions,this.entries];
		for(i in arrays){
			if(arrays[i]){
				for(var x in arrays[i]){
					s.push(arrays[i][x]);
				}
			}
		}
		s.push('</feed>');
		return s.join('');
	},
	createEntry: function(){
		//	summary: 
		//		Function to Create a new entry object in the feed.
		//	description: 
		//		Function to Create a new entry object in the feed.
		//	returns: 
		//		An empty entry object in the feed.
		var entry = new dojox.atom.io.model.Entry();
		entry.feedUrl = this.getSelfHref();
		return entry; //object
	},
	getSelfHref: function(){
		//	summary: 
		//		Function to get the href that refers to this feed.
		//	description: 
		//		Function to get the href that refers to this feed.
		//	returns: 
		//		The href that refers to this feed or null if none.
		if(this.links === null || this.links.length === 0){
			return null;
		}
		for(var x in this.links){
			if(this.links[x].rel && this.links[x].rel == "self"){
				return this.links[x].href; //string
			}
		}
		return null;
	}
});

dojo.declare("dojox.atom.io.model.Service",dojox.atom.io.model.AtomItem,{
	//	summary: 
	//		Class container for 'Feed' types.
	//	description: 
	//		Class container for 'Feed' types.
	constructor: function(href){
		this.href = href;
	},
	//builds a Service document.  each element of this, except for the namespace, is the href of 
	//a service that the server supports.  Some of the common services are:
	//"create-entry" , "user-prefs" , "search-entries" , "edit-template" , "categories"
	buildFromDom: function(/*DOM node*/node){
		//	summary: 
		//		Function to do construction of the Service data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the Service data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for content.
		var href;
		var i;
		var len = node.childNodes ? node.childNodes.length : 0;
		this.workspaces = [];
		if(node.tagName != "service"){
			// FIXME: Need 0.9 DOM util...
			//node = dojox.xml.parser.firstElement(node,"service");
			//if(!node){return;}
			return;
		}
		if(node.namespaceURI != dojox.atom.io.model._Constants.PURL_NS && node.namespaceURI != dojox.atom.io.model._Constants.APP_NS){return;}
		var ns = node.namespaceURI;
		this.name_space = node.namespaceURI;
		//find all workspaces, and create them
		var workspaces ;
		if(typeof(node.getElementsByTagNameNS)!= "undefined"){
			workspaces = node.getElementsByTagNameNS(ns,"workspace");
		}else{
			// This block is IE only, which doesn't have a 'getElementsByTagNameNS' function
			workspaces = [];
			var temp = node.getElementsByTagName('workspace');
			for(i=0; i<temp.length; i++){
				if(temp[i].namespaceURI == ns){
					workspaces.push(temp[i]);
				}
			}
		}
		if(workspaces && workspaces.length > 0){
			var wkLen = 0;
			var workspace;
			for(i = 0; i< workspaces.length; i++){
				workspace = (typeof(workspaces.item)==="undefined"?workspaces[i]:workspaces.item(i));
				var wkspace = new dojox.atom.io.model.Workspace();
				wkspace.buildFromDom(workspace);
				this.workspaces[wkLen++] = wkspace;
			}
		}
	},
	getCollection: function(/*String*/url){
		//	summary: 
		//		Function to collections that match a specific url.
		//	description: 
		//		Function to collections that match a specific url.
		//
		//	url: 
		//		e URL to match collections against.
		for(var i=0;i<this.workspaces.length;i++){
			var coll=this.workspaces[i].collections;
			for(var j=0;j<coll.length;j++){
				if(coll[j].href == url){
					return coll;
				}
			}
		}
		return null;
	}
});

dojo.declare("dojox.atom.io.model.Workspace",dojox.atom.io.model.AtomItem,{
	//	summary: 
	//		Class container for 'Workspace' types.
	//	description: 
	//		Class container for 'Workspace' types.
	constructor: function(title){
		this.title = title;
		this.collections = [];
	},

	buildFromDom: function(/*DOM node*/node){
		//	summary: 
		//		Function to do construction of the Workspace data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the Workspace data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for content.
		var name = dojox.atom.io.model.util.getNodename(node);
		if(name != "workspace"){return;}
		var c = node.childNodes;
		var len = 0;
		for(var i = 0; i< c.length; i++){
			var child = c[i];
			if(child.nodeType === 1){
				name = dojox.atom.io.model.util.getNodename(child);
				if(child.namespaceURI == dojox.atom.io.model._Constants.PURL_NS || child.namespaceURI == dojox.atom.io.model._Constants.APP_NS){
					if(name === "collection"){
						var coll = new dojox.atom.io.model.Collection();
						coll.buildFromDom(child);
						this.collections[len++] = coll;
					}
				}else if(child.namespaceURI === dojox.atom.io.model._Constants.ATOM_NS){
					if(name === "title"){
						this.title = dojox.xml.parser.textContent(child);
					}
				}else{/*Only accept the PURL name_space for now */
					var _nlsResources = dojo.i18n.getLocalization("dojox.atom.io", "messages");
					throw new Error(_nlsResources.badNS);
				}
			}
		}
	}
});

dojo.declare("dojox.atom.io.model.Collection",dojox.atom.io.model.AtomItem,{
	//	summary: 
	//		Class container for 'Collection' types.
	//	description: 
	//		Class container for 'Collection' types.
	constructor: function(href, title){
		this.href = href;
		this.title = title;
		this.attributes = [];
		this.features = [];
		this.children = [];
		this.memberType = null;
		this.id = null;
	},

	buildFromDom: function(/*DOM node*/node){
		//	summary: 
		//		Function to do construction of the Collection data from the DOM node containing it.
		//	description: 
		//		Function to do construction of the Collection data from the DOM node containing it.
		//
		//	node: 
		//		The DOM node to process for content.
		this.href = node.getAttribute("href");
		var c = node.childNodes;
		for(var i = 0; i< c.length; i++){
			var child = c[i];
			if(child.nodeType === 1){
				var name = dojox.atom.io.model.util.getNodename(child);
				if(child.namespaceURI == dojox.atom.io.model._Constants.PURL_NS || child.namespaceURI == dojox.atom.io.model._Constants.APP_NS){
					if(name === "member-type"){
						this.memberType = dojox.xml.parser.textContent(child);
					}else if(name == "feature"){//this IF stmt might need some more work
						if(child.getAttribute("id")){this.features.push(child.getAttribute("id"));}
					}else{
						var unknownTypeChild = new dojox.atom.io.model.Node();
						unknownTypeChild.buildFromDom(child);
						this.children.push(unknownTypeChild);
					}
				}else if(child.namespaceURI === dojox.atom.io.model._Constants.ATOM_NS){
					if(name === "id"){
						this.id = dojox.xml.parser.textContent(child);
					}else if(name === "title"){
						this.title = dojox.xml.parser.textContent(child);
					}
				}
			}
		}
	}
});

}


dojo.i18n._preloadLocalizations("dojo.nls.rotogame", ["ROOT","ar","ca","cs","da","de","de-de","el","en","en-gb","en-us","es","es-es","fi","fi-fi","fr","fr-fr","he","he-il","hu","it","it-it","ja","ja-jp","ko","ko-kr","nl","nl-nl","no","pl","pt","pt-br","pt-pt","ru","sk","sl","sv","th","tr","xx","zh","zh-cn","zh-tw"]);
