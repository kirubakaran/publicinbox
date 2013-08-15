//forge.debug = true;

var debugging_mode = true;
var clog = function(v){
	if(debugging_mode){
		window.console.log(v);
	}
};

var App = {
	Models:      {},
	Collections: {},
	Views:       {},
	Utils:       {},
	Plugins:     {},
	Events: 	 _.extend({}, Backbone.Events),
	Data: 		 {
		version: "0.0.13",
		InMemory: {},
		online: true,
		LoggedIn: false, // Logged into mailstats servers
		notifications_queue: [],
		paused: false,
		was_paused: false,
		pushNotification: null,
		Keys: {},
		debug_messages: {},
		backbutton_functions: [],
		menubutton_functions: [],
		settings: {},
		default_settings: {
			debug: true
		},
		xy: {
			win_height: 0, // by default, starts in portrait mode and as orientation changes this will update (portrait only)
			win_width: 0,
			mode: 'portrait' // landscape
		},
		timers: {},
		timerbucket: {},
		Store: { // a temporary data store

			ModelCache: {},
			CollectionCache: {},

			// Models on server
			Thread: {},
			Email: {},

			// Not Models on server (local only, sync later)
			ThreadsRecentlyViewed: [],
			ThreadsRecentlyActedOn: [],
			ContactsRecentlyViewed: [],

			// Local only (don't sync?)
			Attachment: {},
			Contacts: [], // usePg=collection, browser=array
			ContactsParsed: [],
			Contact: {},
			Link: {}
		},
		PermaViews: {
			all: null,
			dunno: null,
			due: null,
			later: null,
			leisure: null,
			contacts: null
		},
		GlobalViews: {
			OnlineStatus: null
		}
	},
	Credentials: tmp_credentials,

	// Called once, at app startup
	init: function () {

		// Measurements
		App.Data.xy.win_height = $(window).height();
		App.Data.xy.win_width = $(window).width();

		var currentUrl = window.location.href;

		// Update in-memory store with localStorage/Prefs
		App.Utils.Storage.get('AppDataStore')
			.then(function(store){
				if(store != null){
					// Make sure all the default keys exist
					App.Data.Store = $.extend(App.Data.Store,store);
					// console.log('AppDataStore');
					// console.log(App.Data.Store);
				} else {
					console.log('null AppDataStore');
				}
			});

		// Update local settings
		// - use default settings if no local ones
		App.Utils.Storage.get('settings','critical')
			.then(function(settings){
				if(!settings){
					// Not created, create them
					settings = $.extend({}, App.Data.default_settings);

					// Save them
					App.Utils.Storage.set('settings',settings,'critical');
						// .then();
				}

				// Set to global
				App.Data.settings = settings;

			});


		App.Utils.Storage.init()
			.then(function(){

				console.log('Loaded Storage.init');

				// init Router
				// - not sure if this actually launches the "" position...
				App.router = new App.Router();

				// Get access_token if it exists
				var oauthParams = App.Utils.getOAuthParamsInUrl();
				if(typeof oauthParams.access_token == "string"){

					// Have an access_token
					// - save it to localStorage
					App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier, 'critical');
					App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token, 'critical');

					// Save
					App.Events.trigger('saveAppDataStore',true);

					// Reload page, back to #
					window.location = [location.protocol, '//', location.host, location.pathname].join('');
					return;
				}

				// Continue loading router
				Backbone.history.start({silent: true}); // Launches "" router
				App.router.navigate('',true);

				// Get user and set to app global
				App.Utils.Storage.get(App.Credentials.prefix_access_token + 'user', 'critical')
					.then(function(user){
						App.Credentials.user = user;
					});

				// Get access_token, set to app global, login to mailstats server (doesn't allow offline access yet)
				// - switch to be agnostic to online state (if logged in, let access offline stored data: need better storage/sync mechanisms)
				App.Utils.Storage.get(App.Credentials.prefix_access_token + 'access_token', 'critical')
					.then(function(access_token){

						console.log('Stored access_token:' + access_token);	

						// Make available to requests
						App.Credentials.access_token = access_token;

						// Run login script from body_login page if not logged in
						if(typeof App.Credentials.access_token != 'string' || App.Credentials.access_token.length < 1){
							// App.router.navigate("body_login", true);

						
							Backbone.history.loadUrl('body_login')
							return;
						}

						// Validate credentials with mailstats server and emailbox 
						// - make an api request to load my email address

						var dfd = $.Deferred();

						// Logged in on mailstats server
						App.Data.LoggedIn = true;


						// Load login
						// Api.Event.start_listening();
						Backbone.history.loadUrl('body');


					});

		}); // end App.Utils.Storage.init().then...

	}

	
};


jQuery.fn.reverse = [].reverse;
$.whenall = function(arr) { return $.when.apply($, arr); };
