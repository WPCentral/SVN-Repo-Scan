// set variables for environment
var async   = require('async'),
	mysql   = require('mysql'),
	Parser  = require('svn-log-parse').Parser,
	parser  = new Parser();
	cmd     = require('node-cmd');


var pool = mysql.createPool({
	connectionLimit : 5,
	host     : '127.0.0.1',
	user     : 'repo-scan',
	password : 'password',
	database : 'repo-scan'
});

var users_cache  = [];

var current_slug = 'core';
var current_repo = 'https://develop.svn.wordpress.org/trunk/';
var batch_size   = 500;


function log_error(msg) {
	console.log(msg);
}


function run() {
	var repo              = 'core'
		revision_current  = null,
		revision_latest   = null;

	pool.getConnection(function(err, connection) {
		var sql      = "SELECT revision FROM commits WHERE repo = ? ORDER BY revision DESC";
		var inserts  = [ repo ];
		sql          = mysql.format(sql, inserts);

		connection.query( sql, function(err, rows, fields) {
			if ( ! err ) {
				connection.release();

				if ( rows.length > 0 ) {
					revision_current = rows[0].revision;
				}
				else {
					revision_current = 0;
				}
			}
			else {
				log_error('Database is down');
				connection.release();
			}
		});
	});

	get_current_revision(function( revision ) {
		revision_latest = revision;
		complete();
	});

	function complete() {
		if ( revision_current !== null && revision_latest != null ) {
			run_commits( revision_current, revision_latest );
		}
	}

	function run_commits( current, latest ) {
		var to = Math.min( current + batch_size, latest );
		parse_revisions( current + 1, to, repo, function(err) {
			if ( ! err ) {
				console.log('Done running: ' + to + ' - ' + latest );
				if ( to == latest) {
					console.log('Done running');
				}
				else {
					run_commits( current + batch_size, latest );
				}
			}
			else {
				log_error(err);
			}
		} );
	}
}

run();



function get_current_revision( callback ) {
	cmd.get(
		'svn log -l 1 ' + current_repo,
		function(data) {
			var svnLogObjects = parser.parse(data);

			callback( escape_revision( svnLogObjects[0].revision ) );
		}
	);
}

function escape_revision( value ) {
	if ( 'r' === value[0] ) {
		value = value.substring(1);
	}

	return value;
}

function parse_revisions( start, end, repo, callback_done ) {
	cmd.get(
		'svn log -r ' + start + ':' + end + ' ' + current_repo,
		function(data) {
			pool.getConnection(function(err, connection) {
				var json = parser.parse(data);

				async.eachSeries(json, function iterator(item, callback) {
					item.repo = repo;

					get_user( connection, item.committer, function( user_id ) {
						item.committer = user_id;

						add_revision( connection, item, function(err) {
							if ( err ) {
								callback('Commit ' + data.revision + ' had some issues.');
							}
							else {
								callback();
							}
						} );
					});
				}, function(err){
					connection.release();

					if( err ) {
						callback_done( err );
					} else {
						callback_done();
					}
				});
			});
		}
	);
}

function get_user( connection, username, callback ) {
	if ( users_cache[ username ] ) {
		callback(users_cache[ username ]);
		return;
	}

	var sql     = "SELECT user_id FROM users where username = ?";
	var inserts = [ username ];
	sql         = mysql.format(sql, inserts);

	connection.query( sql, function(err, rows, fields) {
		if ( ! err ) {
			if ( rows.length > 0 ) {
				callback(rows[0].user_id);
			}
			else {
				var arr = {
					username: username
				};

				connection.query('INSERT INTO users SET ?', arr, function(err, result) {
					if ( ! err ) {
						users_cache[ username ] = result.insertId;
						callback(users_cache[ username ]);
					}
					else {
						callback(false);
					}
				});
			}
		}
		else {
			callback(false);
		}
	});
}

function add_revision( connection, data, callback ) {
	var arr = {
		repo:        data.repo,
		revision:    escape_revision( data.revision ),
		committer:   data.committer,
		date:        data.time,
		line_count:  data.line_count,
		message:     data.message
	};

	connection.query('INSERT INTO commits SET ?', arr, function(err, result) {
		if ( ! err ) {
			var commit_id = result.insertId;
			var tickets   = get_tickets( data.message );
			var props     = get_props( data.message );

			async.eachSeries(props, function iterator(username, callback2) {
				get_user( connection, username, function( user_id ) {
					var arr2 = {
						user_id: user_id,
						commit_id: commit_id
					};

					connection.query('INSERT INTO props SET ?', arr2, function(err, result) {
						callback2();
					});
				});

			}, function(err){
				async.eachSeries(tickets, function iterator(ticket, callback3) {
					var arr2 = {
						ticket: ticket,
						commit_id: commit_id
					};

					connection.query('INSERT INTO tickets SET ?', arr2, function(err, result) {
						callback3();
					});

				}, function(err){
					callback(false);
				});
			});
		}
		else {
			callback(err);
		}
	});
}

function get_tickets( description ) {
	// Get tickets by the hash tag.
	var tickets = description.match(/#\S+/g);

	// Remove # from the ticket number.
	if ( tickets ) {
		tickets = tickets.map( function(object){
			// Delete all non numbers
			object = object.replace(/\D/g, '');

			return object;
		});

		// Remove empty values
		tickets = tickets.filter(function(e){return e;}); 
	}
	else {
		tickets = [];
	}

	return tickets;
}

function get_props( description ) {
	var users = [];

	// Cleanup for easier parsing.
	description = description.toLowerCase().replace( /[\n|, ]fixes(.*)/i, '' ).replace( /(\n|. )see(.*)/i, '' );

	// Place enter to fix cases where it otherwise would fail. See changeset 22094
	if ( '.' != description.substr(description.length - 1) ) {
		description += '.';
	}

	// Get the props part
	var props = description.match(/\nprops(.*)./i);

	// If there are props then clean it out and build up an array.
	if ( props !== null ) {
		// Replace and with a comma so array can be build.
		users = props[1].trim().replace(' and ', ', ');

		// Build array
		users = users.split( /\s*,\s*/ );

		// Clean usernames up
		users = users.map( function(user) {
			user = user.replace(/(.*?) for.*/i, '$1');

			if ( '@' === user[0] ) {
				user = user.substring(1);
			}

			return user;
		});

		// Remove empty and incorrect values
		users = users.filter(function(e){
			// ignore and.
			if ( 'and' == e ) {
				return false;
			}

			return e;
		});
	}

	return users;
}

