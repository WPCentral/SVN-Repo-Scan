
// General check
cmd.get(
	'svn log -r 5189 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '3861' ] // fixes
		console.log( get_props( message ) ); // [ 'molecularbear' ]
	}
);



// Random #
cmd.get(
	'svn log -r 13823 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '12556', '7092' ] // fixes
		console.log( get_props( message ) ); // []
	}
);

// Double #
cmd.get(
	'svn log -r 26195 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '26011', '26012', '26013', '26014', '26038', '26039' ] // fixes
		console.log( get_props( message ) ); // [ 'mdbitz' ]
	}
);




// Could return [ 'ericmann', '' ] which should not happen
cmd.get(
	'svn log -r 16484 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '15405' ] //see
		console.log( get_props( message ) ); // [ 'ericmann' ]
	}
);

// Text after the props
cmd.get(
	'svn log -r 17643 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '16748' ] //see
		console.log( get_props( message ) ); // [ 'koke' ]
	}
);

// use of and instead of comma
cmd.get(
	'svn log -r 21437 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '21462' ] //see
		console.log( get_props( message ) ); // [ 'bradthomas127', 'obenland' ]
	}
);

// Not deleting last sign of markoheijnen
cmd.get(
	'svn log -r 22094 https://develop.svn.wordpress.org/trunk/',
	function(data) {
		var svnLogObjects = parser.parse(data);
		var message       = svnLogObjects[0].message;

		console.log( get_tickets( message ) ); // [ '6821' ] //see
		console.log( get_props( message ) ); // [ 'DH-Shredder', 'kurtpayne', 'markoheijnen' ]
	}
);

return;