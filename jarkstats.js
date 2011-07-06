/*
	my statistics library
	also a node.js module
*/
(function(context, undefined) {

	// functions
	var functions = {};
	
	// object(o) allows us to write prototype objects
	// without worrying about snarling up Javascript syntax
	functions.create = function( obj ) {
		// create generic funciton
		function F(){}
		// set its prototype to be the object
		F.prototype = obj;
		// produce our new object
		return new F();
	}
	
	functions.propPathCall = function( currentSelector, nodes, endfunc ) { /* endfunc( selectedAttribute ) */
		if (nodes.length > 0) {
			return functions.propPathCall( currentSelector[nodes[0]], nodes.slice(1), endfunc );
		} else {
			return function(){ endfunc( currentSelector ) }();
		}
	}
	
	functions.getset = function( propertyPath ) {
		var args = Array.prototype.slice.apply(arguments, []);
		
		// we're building:
		// this[ propPath[0] ][ propPath[1] ][ propPath[2] ] ... [ propPath(propPath.length -1)]
		
		
		propPathCall( this, propertyPath, 0 )
		
		
		var get = function() {
			return this
		}
	}
	
	functions.sign = function( v ) {
		if ( !  v  ) { return 0 }
		if ( v < 0 ) { return -1 }
		if ( v > 0 ) { return 1 }
	}
	
	functions.typeofConstructor = function (v) {
		if (typeof(v) == "object") {
			if (v === null) return "null";
			if (v.constructor == (new Array).constructor) return "array";
			if (v.constructor == (new Date).constructor) return "date";
			if (v.constructor == (new RegExp).constructor) return "regex";
			if (typeof v.type !== 'undefined') return v.type;
			return "object";
		}
		return typeof(v);
	}
	
	// ECMAScript standard typeof
	functions.objTypeof = function( value ) {
		return Object.prototype.toString.apply(value)
	}

	functions.punctuateNum = function( number ) {
		var rep = ('' + number).split('.');
		var whole;
		if ( rep.length > 1 ) {
			rep[1] = '.' + rep[1]
		} else {
		}
		// insert commas every 3 numbers
		whole = rep[0].split('').reverse().map( function(n, i, a) {
			if ( 0 === (i % 3) ) {
				return n + ',';
			}
			return n 
		});
		// strip potential commas from last number
		whole[0] = parseInt(whole[0]);
		rep[0] = whole.reverse().join('');

		return rep.join('');
	}

	functions.percentile = function( num, list ) {
		var index;
		// ensure fractions
		if ( num > 1 ) {
			num = num/100;
		}

		// find index, rounding up, subtracting 1 because arays are zero-indexed
		index = Math.ceil( list.length * num ) - 1;

		return list.sort( function(a, b){ return a - b; } )[index];
	}
	
	functions.factorial = function(n) {
		if ( n % 1 !== 0 ) {
			throw new TypeError('Integers only');
		}
		if ( n == 0 || n == 1 ) {
			return 1;
		}
		return ( n * functions.factorial(n-1) );
	}

	// objects
	var objects = {}
	
	/* @class Summary 
		Summary of 1 or 2 variable data
		Uses whatever data is available for computations.
		Uses the xList for 1-variable computations
	*/
	
	objects.Counting = function(){};
	objects.Counting.prototype = {
		  type: 'counting'
		, nPk: function(n, k) {
			/*
			The number of possible permutations (orderings) of k of n things is
				nPk = n!/(n−k)!
			(k must be at least 0 and no larger than n.)
			*/
			// for choosing k things in order from n total
			return functions.factorial(n) / functions.factorial(n-k);
		}
		, nCk: function(n, k) {
			/*
			Combinations

			The number of possible combinations of n things taken k at a time (without regard to order) is
				nCk = n! / (k!*(n-k)!)
			(k must be less than or equal to n.)
			*/
			return functions.factorial(n) / (functions.factorial(n-k) * functions.factorial(k));
		}
	}
	
	objects.Summary = function(xList, yList) {
		//@TODO rewrite to use x: {} and y: {} instead of SDx, ...
		this.xList = ((typeof xList === 'object') && (xList.type === 'list')) ? xList : undefined;
		this.SDx = undefined;
		this.Meanx = undefined;
		
		this.yList = ((typeof yList === 'object') && (yList.type === 'list')) ? yList : undefined;
		this.SDy = undefined;
		this.Meany = undefined;
		
		this.r = undefined;
		
		this.regressionSlope = undefined;
		this.regressionErrorRMS = undefined;
		
		this.refresh();
		
		return this;
	}
	objects.Summary.prototype = {
		  type: 'summary'
		, refresh: function() {
			// see if we know things we didn't know before
			if (this.xList) {
				this.SDx = this.xList.sd();
				this.Meanx = this.xList.mean();
			}
			if (this.yList) {
				this.SDy = this.yList.sd();
				this.Meany = this.yList.mean();
			}
			if (this.xList && this.yList) {
				this.r = this.correlation();
			}
			
			if (	(typeof this.SDx === 'number' )
				 	&& (typeof this.SDy === 'number' )
				 	&& (typeof this.r === 'number')
				) {
				// standard deviation slope
				this.sdSlope = functions.sign(this.r) * this.SDy / this.SDx;
				// regression line slope
				this.regressionSlope = this.r * this.SDy / this.SDx;
				// RMS regression error
				this.regressionErrorRMS = Math.sqrt( 1-Math.pow(this.r,2) ) * this.SDy;
			}
			
			// chain
			return this;
			
		}
		, correlation: function() {
			var xu = this.xList.su().raw;
			var yu = this.yList.su().raw;
			
			var total = 0;
			
			for (var i=0; i < xu.length; i++) {
				total += xu[i] * yu[i];
			};
			return total/xu.length;
		}
		, sdLine: function( x, y ) {
			var px = ((! x) && (this.Meanx)) ? this.Meanx : x;
			var py = ((! y) && (this.Meany)) ? this.Meanx : y;
			
			return objects.Line.pointSlope( px, py, this.sdSlope );
		}
		, regressionLine: function( x, y ) {
			var px = ((! x) && (this.Meanx)) ? this.Meanx : x;
			var py = ((! y) && (this.Meany)) ? this.Meanx : y;
			
			return objects.Line.pointSlope( px, py, this.regressionSlope );
		}
		, XonY: function() {
			var result = new objects.Summary();
			result.xList = this.yList;
			result.SDx = this.SDy;
			result.Meanx = this.Meany;

			result.yList = this.xList;
			result.SDy = this.SDx;
			result.Meany = this.Meanx;

			result.r = this.r;

			// for now we force these to be recalculated.
			// result.regressionSlope = undefined;
			// result.regressionLine = undefined;
			// result.regressionErrorRMS = undefined;
			
			result.refresh();
			return result;
		}
	}
	
	
	/* @class list */
	objects.List = function( /* any number of args or arrays */ ) {
				
		// make a real array out of args
		var args = Array.prototype.slice.apply(arguments, []);
		
		this.raw = [];
		this.array = [];
		this.units = objects.List.prototype.units;
		
		
		for (var i = 0; i < args.length; i++) {
			this.push( args[i] );
		};
		
		// ensure order
		this._sortself();
		
		// return new list
		return this;
	}
	
	objects.List.check = function (v) { // ensures only numbers
		if ( typeof v === 'number' ) return v;
		if ( typeof v === 'string' ) return parseFloat(v);
		throw new TypeError('lists can only process numbers, arrays, and strings');
		return false;
	}
	
	// STATIC FUNCTIONS AND MATHEMATICS
	objects.List.markov = function( mean, threshold ) {
		console.log( '[fraction of numbers in the list that are greater than or equal to x] ≤ Mean/x' )
		return mean/threshold;
	}
	objects.List.chebychev = function( sd, range ) {
		// for every positive number k, mean M, number of SDs SD
		console.log( 'the fraction of numbers in the list that are k standard deviations or further from M] ≤ 1/k^2' );
		var k = (range/2)/sd;
		return 1/(k*k);
	}
	
	objects.List.prototype = {
		type: 'list'
		, units: { prefix: '', suffix: '', multiplier: 1, fancy: false }
		// Private
		, _sortself:	function() {
			// // make sure no one is futzing with our internal array and adding numbers or anything
			// if ( !this.array.every(objects.List.check) ) {
			// 	throw new TypeError('lists can only process numbers, arrays, and strings');
			// }
			this.array.sort( function(a,b){ return a - b });
			return this;
		}
		, _valueAsUnit: function( value, punctuateNumbers ) {
			if ( punctuateNumbers ) {
				return this.units.prefix + functions.punctuateNum(value * this.units.multiplier) + this.units.suffix;
			}
			return this.units.prefix + (value * this.units.multiplier) + this.units.suffix;
		}
		// Mutator Methods
		, push: function( value ) {
			// handle arrays via recursion
			if ( functions.objTypeof(value) === '[object Array]' ) {
				for (var i = 0; i < value.length; i++ ){
					this.push( value[i] );
				};
			} else if ( value.type ) {
				// handle objects based on custom 'type'
				if ( value.type === 'list' ) this.push( value.raw() );
			} else if ( typeof value === 'string' ) {
				this.push( value.split(/[^[0-9]|\.|-]/).map(function(d){return parseFloat(d);}) );
			} else {
				// handle foundation types
				this.array.push( objects.List.check(value) );
				this.raw.push( objects.List.check(value) );
				
				this._sortself();
				return this;
			}
		}
		, with: function( list ) {
			return new objects.Table( this, list );
		}
		// Queries
		, raw: function() {
			return this.raw;
		}
		, length: function() {
			return this.array.length;
		}
		, i: function( index, value ) {
			var i;			
			if ( typeof value === 'undefined' ) {
				if ( index < 0 ) {
					i = this.array.length + index;
				} else {
					i = index - 1;
				}
				
				return this.array[i];
			} else {
				this.push(value);
			}
		}
		, indexOf: function( value ) {
			return this.array.indexOf( value ) + 1;
		}
		// Operations
		, plus: function( /* unlimited args */ ) {
			return new objects.List( this.array, Array.prototype.slice.apply(arguments, []) );
		}
		, sum: function() {
			var s = 0;
			for (var i = this.array.length - 1; i >= 0; i--){
				s = s + this.array[i];
			};
			return s;
		}
		, copy: function() {
			return new List( this.raw );
		}
		, each: function( func, useRaw ) { /* func( datum, index ) */
			var set, result = [];
			if ( useRaw ) {
				set = this.raw;
			} else {
				set = this.array;
			}
			for (var i=0; i < set.length; i++) {
				result.push( func.apply(this, [ set[i], i+1 ]) );
			};
			return new objects.List(result);
		}
		, affine: function( a, b) {
			return this.each( function(d){return a*d + b;});
		}

		// MEASURES OF LOCATION
		, percentileOf: function( value ) {
			var l, i = this.indexOf( value );
			if ( i > 0 ) {
				// yay, el is in array
				return (i-1) / this.array.length;
			} // else
			// create a list with this item in it
			l = new objects.List( this.array, value );
			return (l.indexOf(value)-1) / this.array.length;
		}
		, percentile: function( value ) {
			console.log("Reminder: exact percentile calculations may differ greatly from histogram estimations");
			var index, num = objects.List.check( value );
			// ensure fractions
			if ( num > 1 ) {
				num = num/100;
			}

			// find index, rounding up, subtracting 1 because arays are zero-indexed
			return this.i( Math.ceil(this.array.length * num));			
		}
		, median: function() {
			if ( this.array.length % 2 ) {
				// odd - the middle number is the median
				return this.array[ Math.ceil(this.array.length / 2) - 1 ];
			}
			//even
			return this.percentile(50);
		}
		, mean: function() {
			return this.sum() / this.array.length;
		}
		, mode: function() { //@TODO rewrite to use Object as a hash because NEGATIVE NUMBERS
			var counts = [], sorted, maxcount, i, nowSorting = true, modeCount = 0, result = [];
			for (i = this.array.length - 1; i >= 0; i--) {
				if (typeof counts[ this.array[i] ] === 'undefined' ) {
					counts[ this.array[i] ] = 1;
				} else {
					counts[ this.array[i] ] += 1;
				}
			}
			sorted = counts.map( function(i){return i})
			  .sort( function(a,b){return b-a});
			maxcount = sorted[0];
			
			if (maxcount > 1) {
				modeCount = sorted.lastIndexOf( sorted[0] ) + 1;
				if ( modeCount > 1) { 
					// multimodal
					for (var i=0; i < modeCount; i++) {
						result.push( counts.indexOf( sorted[i] ) );
						counts[ result[i] ] = 'consumed';
					};
					
					return result;
				}
				// uni-modal
				return [ counts.indexOf( sorted[0] ) ];
			}
			return this.array; // no real mode
		}
		, nmode: function() { // UNFINISHED
			var count = { };
			for (var i = this.array.length - 1; i >= 0; i--){
				if (typeof counts[ this.array[i] ] === 'undefined') {
					counts[ this.array[i] ] = 1;
				} else {
					counts[ this.array[i] ] += 1;
				}
			}
			
		}
		
		// MEASURES OF SPREAD
		, range: function() {
			return this.i(-1) - this.i(1);
		}
		, iqr: function() {
			return this.percentile(75) - this.percentile(25);
		}
		, rms: function() {
			// var squaredsum = this.each(function(d){ return d*d }).sum();
			return Math.sqrt( this.each(function(d){ return d*d }).sum() / this.array.length );
		}
		, sd: function() {
			return this.each(function(d){ return d-this.mean(); }).rms();
		}
		, su: function( v ) {
			var sd = this.sd();
			var mean = this.mean();
			
			if ( typeof v === 'undefined' ) {
				// no input, return all values
				return this.each( function(d){
					return ( d - mean ) / sd;
				}, true); // use raw
			} else {
				return ( v - mean ) / sd;
			}
		}
		, fromsu: function( su ) {
			var sd = this.sd();
			var mean = this.mean();
			
			return su * sd + mean;
		}
		
		
		// Pretty Printing
		, toString: function() {
			return this.asUnits( false );
		}
		, prefix: function( string ) {
			this.units.prefix = string;
			return this;
		}
		, suffix: function( string ) {
			var f = {
				  get: function() { return this.units.suffix; }
				, set: function(v) { }
			}
				return this.units.suffix;
			this.units.suffix = string;
			return this;
		}
		, asUnits: function( punctuateNumbers ) {
			return this.array.map( function(v){
				return this._valueAsUnit( v, punctuateNumbers );
			}, this );
		}
		, toString: function() {
			return this.array.toString();
		}
		, print: function() {
			return '"' + this.asUnits( true ).join('", "') + '"';
		}
	}
	
	/* @class Table
		collects related list data together
		relies on Summary objects for summary statistics and lines.
	*/
	objects.Table = function( /* n lists */ ) {
		this.lists = [];
		
		// make a real array out of args
		var args = Array.prototype.slice.apply(arguments, [0]);
		
		for (var i=0; i < args.length; i++) {
			// push provides sanitization for Table
			this.push( args[i] ); 
		};
		
		return this;
	}
	objects.Table._normalizeType = function(v) {
		// normalizes values to be of type Table
		// accepts only arrays, lists, and tables
		var result = new objects.Table();
		if (typeof v === 'object') {
			if ( functions.objTypeof(value) === '[object Array]' ) {
				result.lists.push( new objects.List(v) );
			} else if ( v.type === 'list' ) {
				result.lists.push( v );
			} else if ( v.type === 'table' ) {
				result = v;
			} else {
				throw new TypeError('Attempting to use non-listable type with Table');
			}
			return result;
		}
		throw new TypeError('Attempting to use non-listable type with Table');
	}
	
	objects.Table.prototype = {
		  type: 'table'
		, together: function() {
			var result = [];
			for (var datum=0; datum < this.lists[0].raw.length; datum++) {
				var row = [];
				for (var i=0; i < this.lists.length; i++) {
					console.log( 'pushing', this.lists[i].raw[datum]);
					row.push( this.lists[i].raw[datum] );
				};
				result.push(row);
			};
			
			return result;
		}
		, push: function( v ) {
			var t = new objects.Table();
			// make v a table if it isn't
			if (typeof v === 'object') {
				if ( functions.objTypeof(value) === '[object Array]' ) {
					t.lists.push( new objects.List(v) );
				} else if ( v.type === 'list' ) {
					t.lists.push( v );
				} else if ( v.type === 'table' ) {
					t = v;
				} else {
					throw new TypeError('Attempting to use non-listable type with Table');
				}
			} else {
				throw new TypeError('Attempting to use non-listable type with Table');
			}
			
			// merge t into this table
			for (var i=0; i < t.lists.length; i++) {
				this.lists.push( t.lists[i] );
			};
			
			// why not
			return this;
		}
		, with: function( /* lists or tables */ ) {
			var result = new objects.Table(), args = Array.prototype.slice.apply(arguments, [0]);
			result.push( this );
			for (var i=0; i < args.length; i++) {
				result.push( args[i] );
			};
			return result;
		}
		, summary: function( xIndex, yIndex ) {
			var x = (typeof xIndex === 'number') ? this.lists[xIndex] : this.lists[0];
			var y = (typeof yIndex === 'number') ? this.lists[yIndex] : this.lists[1];
			
			return new objects.Summary(x, y);
		}		
	}
	
	
	// @class Line
	objects.Line = function( m, b ) {
		this.m = m;
		this.b = b;
		return this
	}
	objects.Line.pointSlope = function( x, y, slope ) {
		var b = y - slope * x;
		return new objects.Line( slope, b );
	}
	objects.Line.prototype = {
		  type: 'line'
		, print: function() {
			return 'y = ' + this.m + 'x + ' + this.b;
		}
		, inverse: function() {
			return new objects.Line( 1 / this.m, (-1/this.m) * this.b );
		}
		// COMPUTE y from x
		, f: function( x ) {
			return this.m * x + this.b
		}
	}
	
	context.functions = functions;
	context.objects = objects;

})(exports)