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
	
	functions.strToArray = function( string ) {
		return string.split( /[[0-9]|\.|-]/ )
	}
	
	/* STATISTICS */
	functions.sum = function( theArray ) {
		var thesum = 0;
		for (var i = theArray.length - 1; i >= 0; i--){
			thesum = thesum + theArray[i];
		};
		return thesum;
	}

	functions.sort = function( theArray ) {
		return theArray.sort( function( a, b ){
			return a - b;
		});
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

	// objects
	var objects = {}
	
	/* @class list */
	objects.List = function( /* any number of args or arrays */ ) {
				
		// make a real array out of args
		var args = Array.prototype.slice.apply(arguments, []);
		
		this.array = [];
		this.units = objects.List.prototype.units;
		
		
		for (var i = args.length - 1; i >= 0; i--) {
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
	objects.List.prototype = {
		type: 'list'
		, units: { prefix: '', suffix: '', multiplier: 1, fancy: false }
		// Private
		, _sortself:	function() {
			// make sure no one is futzing with our internal array and adding numbers or anything
			if ( !this.array.every(objects.List.check) ) {
				throw new TypeError('lists can only process numbers, arrays, and strings');
			}
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
			if ( Object.prototype.toString.apply(value) === '[object Array]' ) {
				for (var i = value.length - 1; i >= 0; i--){
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

				this._sortself();
				return this;
			}
		}
		// Queries
		, raw: function() {
			return this.array;
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
		, each: function( func ) { /* func( datum, index ) */
			var result = [];
			for (var i=0; i < this.array.length; i++) {
				result.push( func.apply(this, [ this.array[i], i+1 ]) );
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
			return this.i(-1) - this.i(0);
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
		
		
		
		// Pretty Printing
		, toString: function() {
			return this.asUnits( false );
		}
		, prefix: function( string ) {
			this.units.prefix = string;
		}
		, suffix: function( string ) {
			this.units.suffix = string;
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
	
	context.functions = functions;
	context.objects = objects;

})(exports)