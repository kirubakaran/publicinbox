Backbone.View.prototype.close = function (notRemove) {
	if (this.beforeClose) {
		this.beforeClose();
	}

	// Empty of HTML content, but don't remove the parent element
	// this.$el.empty();
	if(notRemove){
		// this.remove();
		clog('emptied, not removed');
		this.$el.empty();
	} else {
		this.$el.empty();
		this.remove();
	}
	this.unbind();
};


Backbone.View.prototype.garbage = function (view_list) {};



App.Views.Body = Backbone.View.extend({
	
	// el: 'body',
	className: 'main_body',

	events: {
	},

	initialize: function() {
		var that = this;
		_.bindAll(this, 'render');
	},


	logout: function(){
		Backbone.history.loadUrl('confirm_logout');
	},

	render: function() {

		var that = this;

		// Data
		// var data = this.options.accounts.UserGmailAccounts;

		// Should start the updater for accounts
		// - have a separate view for Accounts?


		// Template
		var template = App.Utils.template('t_body');

		// Write HTML
		$(this.el).html(template());


		return this;
	},
});


App.Views.Logout = Backbone.View.extend({

	className: 'logout',

	events: {
		'click #logout' : 'logout' // logging out
	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	logout: function(ev){
		// This doesn't work at all
		// - just stopped working completely for some reason

		alert('logout clicked');
		Backbone.history.loadUrl('logout');
		return false;

	},

	render: function(){
		var that = this;

		// Remove any previous one
		// $('.logout').remove();

		// Build from template
		var template = App.Utils.template('t_logout');

		// Write HTML
		that.$el.html(template());

		// Show logout
		that.$el.addClass('display');

		that.$el.transition({
			top: '150px',
			opacity: 1
		},'fast');
		
		// Just show a logout dialog box
		var p = confirm('Logout?');
		if(p){
			Backbone.history.loadUrl('logout');
		} else {
			that.close();
		}

		return this;
	}

});

App.Views.BodyLogin = Backbone.View.extend({
	
	el: 'body',

	events: {
		'click p.login button' : 'login'

	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	login: function(ev){
		// Start OAuth process
		var that = this;

		var p = {
			app_id : App.Credentials.app_key,
			callback : [location.protocol, '//', location.host, location.pathname].join('')
		};
		
		if(usePg){
			
			var p = {
				response_type: 'token', // token = "#", code = "?"
				client_id : App.Credentials.app_key,
				redirect_uri : 'https://getemailbox.com/testback'
			};
			var params = $.param(p);
			var call_url = App.Credentials.base_login_url + "/apps/authorize/?" + params;

			var ref = window.open(call_url, '_blank', 'location=no');
			ref.addEventListener('loadstart', function(event) { 
				// event.url;

				var tmp_url = event.url;

				var parser = document.createElement('a');
				parser.href = tmp_url;

				if(parser.hostname == 'getemailbox.com' && parser.pathname.substr(0,9) == '/testback'){
					
					// window.plugins.childBrowser.close();
					// alert('closing childbrowser after /testback');
					// return false;
					// alert('testback');

					// url-decode
					// alert(tmp_url);
					var url = decodeURIComponent(tmp_url);
					// alert(url);

					// var qs = App.Utils.getUrlVars();
					var oauthParams = App.Utils.getOAuthParamsInUrl(url);
					// alert(JSON.stringify(oauthParams));

					// if(typeof qs.user_token == "string"){
					if(typeof oauthParams.access_token == "string"){

						// Have an access_token
						// - save it to localStorage

						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier);
						// App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token);

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'user', oauthParams.user_identifier, 'critical')
							.then(function(){
								// Saved user!
								// alert('saved user');
							});

						App.Utils.Storage.set(App.Credentials.prefix_access_token + 'access_token', oauthParams.access_token, 'critical')
							.then(function(){
								
								// Reload page, back to #home
								// forge.logging.info('reloading');

								// alert('success');
								// window.plugins.childBrowser.close();

								// Emit save event (write file)
								App.Events.trigger('FileSave',true);
								ref.close();


								// // Reload page, back to #home
								// window.location = [location.protocol, '//', location.host, location.pathname].join('');

								$('body').html('Loading');

								// Reload page, back to #home
								window.setTimeout(function(){
									window.location = [location.protocol, '//', location.host, location.pathname].join('');
								},500);
							});

					} else {
						// Show login splash screen
						var page = new App.Views.BodyLogin();
						App.router.showView('bodylogin',page);

						alert('Problem logging in');
						// window.plugins.childBrowser.close();
						ref.close();

					}

					return;

				}

				return;

			});
			// ref.addEventListener('loadstop', function(event) { alert('stop: ' + event.url); });
			ref.addEventListener('loaderror', function(event) { console.error('Uh Oh, encountered an error: ' + event.message); });
			// ref.addEventListener('exit', function(event) { alert('exit1');alert(event.type); });

		} else {

			var p = {
				response_type: 'token',
				client_id : App.Credentials.app_key,
				redirect_uri : [location.protocol, '//', location.host, location.pathname].join('')
			};
			var params = $.param(p);
			window.location = App.Credentials.base_login_url + "/apps/authorize/?" + params;

		}

		return false;

	},

	render: function() {

		var template = App.Utils.template('t_body_login');

		// Write HTML
		$(this.el).html(template());

		return this;
	}
});

App.Views.BodyUnreachable = Backbone.View.extend({
	
	el: 'body',

	events: {
		'click .retry' : 'reload'

	},

	initialize: function() {
		_.bindAll(this, 'render');

	},

	reload: function(){
		// Reload the page
		// - easiest way, simpler than reloading all the fetch calls
		window.location = window.location.href;
	},

	render: function() {

		var template = App.Utils.template('t_body_unreachable');

		// Write HTML
		$(this.el).html(template());

		return this;
	}
});



