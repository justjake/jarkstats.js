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
	
	functions.typeof = function (v) {
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
		// array object that list acts as a wrapper for
		this.array = []
		
		// make a real array out of args
		var args = Array.prototype.slice.apply(arguments, [0]);
		
		// break arrays down, filter out objects
		for (var i = args.length - 1; i >= 0; i--) {
			if ( typeof args[i] === 'number' ) {
				this.array.push( args[i] );
			} else if ( typeof args[i] === 'string' ) {
				this.array.push( parseFloat(args[i]) );
			} else if ( args[i].constructor == (new Array).constructor ) {
				Array.prototype.push.apply( this.array, args[i] );
			} else {
				console.log('Bad argument', args[i]);
				console.log('constructor is', args[i].constructor);
				throw new TypeError('lists can only process numbers, arrays, and strings');
			}
		};
		
		// garuntee order
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
		_sortself:	function() {
			// make sure no one is futzing with our internal array and adding numbers or anything
			if ( !this.array.every(objects.List.check) ) {
				throw new TypeError('lists can only process numbers, arrays, and strings');
			}
			this.array = this.array.sort( function(a,b){ return a - b });
			return this;
		}
		, i: function( index, value ) {
			var i;
			if ( index < 0 ) {
				i = this.array.length + index;
			} else {
				i = index - 1;
			}
			
			if ( typeof value === 'undefined' ) {
				return this.array[i];
			} else {
				if ( i < 0 ) {
					this.array.push( objects.List.check(value) );
				} else {
					this.array[i] = objects.List.check( value );
				}
				
				this._sortself();
				return this;
			}
		}
		, indexOf: function( value ) {
			return this.array.indexOf( value ) + 1;
		}
		, median: function() {
			if ( this.array.length % 2 ) {
				// odd
				return this.i( Math.ceil(this.array.length/2) );
			} else {
				//even
				return ( this.i(this.array.length/2) + this.i(this.array.length/2+1) ) / 2;
			}
		}
		, percentile: function( value ) {
			var index, num = objects.List.check( value );
			// ensure fractions
			if ( num > 1 ) {
				num = num/100;
			}

			// find index, rounding up, subtracting 1 because arays are zero-indexed
			return this.i( Math.ceil(this.array.length * num));			
		}, percentileOf: function( value ) {
			var l, i = this.indexOf( value );
			if ( i ) {
				// yay, el is in array
				return (i-1) / this.array.length;
			} // else
			// create a list with this item in it
			l = new objects.List( this.array, value );
			return (l.indexOf(value)-1) / this.array.length;
		}
		, sum: function() {
			return functions.sum( this.array );
		}
		, mean: function() {
			return this.sum() / this.array.length;
		}
		, mode: function() {
			var counts = new Object();
		}
	}
	
	context.functions = functions;
	context.objects = objects;

})(exports)