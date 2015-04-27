( function (mw, $, OO, WL) {

	var Home = function ($element) {
		if ( $element === undefined || $element.length === 0 ) {
			throw "$element must be a defined element";
		}
		if ( $element.attr('id') !== WL.config.prefix + "home" ) {
			throw "Expected $element to have id='" + WL.config.prefix + "home'";
		}

		this.$element = $element;
		this.$menu = this.$element.find(".menu");
		if ( this.$menu === undefined || this.$menu.length === 0 ) {
			throw "." + WL.config.prefix + "menu must be a single defined element";
		}

		this.campaignList = new CampaignList();
		this.connector = new Connector();

		this.workspace = new WL.Workspace(
			this.$element.find(".workspace")
		);
		this.$element.append(this.workspace.$element);

		WL.user.updateStatus();
		WL.user.statusChanged.add(this.handleUserStatusChange.bind(this));
		this.handleUserStatusChange();
	};
	Home.prototype.handleUserStatusChange = function() {
		if ( WL.user.authenticated() ) {
			this.campaignList.load();
			this.$menu.empty();
			this.$menu.append(this.campaignList.$element);
		} else {
			this.$menu.empty();
			this.$menu.append(this.connector.$element);
		}
	};

	/**
	 * Connector Widget
	 *
	 *
	 */
	var Connector = function() {
		this.$element = $("<div>").addClass(".connector");

		this.button = new OO.ui.ButtonWidget( {
			label: WL.i18n("connect to server"),
			flags: ["primary"]
		} );
		this.$element.append(this.button.$element);
		this.button.on('click', this.handleButtonClick.bind(this));
	};
	Connector.prototype.handleButtonClick = function(e){
		WL.user.initiateOAuth();
	};

	var CampaignList = function () {
		this.$element = $("<div>").addClass("campaign-list");
	};
	CampaignList.prototype.handleConnectButtonClick = function(e){
		WL.user.initiateOAuth();
	};
	CampaignList.prototype.clear = function(){
		this.$element.html("");
	};
	CampaignList.prototype.load = function(){
		if ( !WL.user.authenticated() ) {
			throw "Cannot load campaign list when user is not authenticated.";
		}
		this.clear();
		WL.server.getCampaigns(
			function(doc){
				var i, campaignData;
				for ( i=0; i<doc['campaigns'].length; i++) {
					campaignData = doc['campaigns'][i];
					this.push(new Campaign(campaignData));
				}
			}.bind(this),
			function(doc){
				this.$element.html(doc.code + ":" + doc.message);
			}.bind(this)
		);
	};
	CampaignList.prototype.push = function(campaign) {
		this.$element.append(campaign.$element);
	};

	var Campaign = function (campaignData) {
		this.campaignData = campaignData;
		this.$element = $("<div>").addClass("campaign");

		this.expander = new OO.ui.ToggleButtonWidget( {
			label: "+",
			value: false,
			classes: [ "expander" ]
		} );
		this.$element.append(this.expander.$element);
		this.expander.on('change', this.handleExpanderChange.bind(this));

		this.$name = $("<div>").addClass("name");
		this.$element.append(this.$name);

		this.worksetList = new WorksetList();

		this.$controls = $("<div>").addClass("controls");
		this.$element.append(this.$controls);

		this.newButton = new OO.ui.ButtonWidget( {
			label: WL.i18n("new workset")
		} );
		this.$controls.append(this.newButton.$element);
		this.newButton.on('click', this.handleNewButtonClick.bind(this));

		this.expanded = $.Callbacks();

		this.load(campaignData);
	};
	Campaign.prototype.handleExpanderChange = function( expanded ) {
		this.expand(expanded);
	};
	Campaign.prototype.handleNewButtonClick = function (e) {
		WL.server.assignWorkset(
			this.campaignData['id'],
			function(doc){
				console.log(doc); //TODO: Should add a new workset to the list.
			},
			function(doc){

			}
		);
	};
	Campaign.prototype.handleWorksetUpdate = function ( workset ) {
		var i;
		if ( workset.completed && this.allCompleted() ) {
			this.newButton.setDisabled(false);
		} else {
			this.newButton.setDisabled(true);
		}
	};
	Campaign.prototype.load = function(campaignData){
		this.$name.text(campaignData['name']);
		WL.server.getUserWorksetList(
			WL.user.id, campaignData['id'],
			function(doc){

			},
			function(doc){
				
			}
		);
	};
	Campaign.prototype.expand = function(expanded){
		if ( expanded === undefined) {
			return this.$element.hasClass("expanded");
		} else if ( expanded ) {
			this.$element.addClass("expanded");
			this.expander.setLabel("-");
			this.expanded.fire(expanded);
			return this;
		} else {
			this.$element.removeClass("expanded");
			this.expander.setLabel("+");
			return this;
		}
	};

	var WorksetList = function () {
		this.$element = $("<div>").addClass("workset-list");

		this.$container = $("<div>").addClass("container");
		this.$element.append(this.$container);

		this.worksets = [];
		this.worksetActivated = $.Callbacks();

	};
	WorksetList.handleWorksetActivated = function (workset) {
		this.worksetActivated.fire(this, workset);
	};
	WorksetList.prototype.push = function (workset) {
		this.$container.append(workset.$element);
		this.worksets.push(workset);
		workset.updated.add(this.handleWorksetUpdate.bind(this));
	};
	WorksetList.prototype.clear = function () {
		// Clear the container
		this.$container.html("");
		this.worksets = [];
	};
	WorksetList.prototype.load = function (worksetListData) {
		var i, worksetData, workset;

		// Make sure we're clear
		this.clear();

		// Add all of the worksets
		for ( i = 0; i < worksetListData.length; i++ ) {
			worksetData = worksetListData[i];

			workset = new Workset(worksetData);
			this.push(workset);
		}
	};
	WorksetList.prototype.allComplete = function () {
		var i, workset;
		for ( i = 0; i < this.worksets.length; i++) {
			workset = this.worksets[i];

			if ( !workset.completed ) {
				return false;
			}
		}
		return true;
	};

	var Workset = function (worksetData) {
		this.$element = $("<div>").addClass("workset");

		this.progress = new OO.ui.ProgressBarWidget( {
			progress: 0,
			text: ""
		} );

		this.openButton = new OO.ui.ButtonWidget( {
			label: "",
			align: 'inline'
		} );
		this.openButton.on('click', this.handleOpenButtonClick.bind(this));

		this.completed = false;
		this.updated = $.Callbacks();
		this.activated = $.Callbacks();

		this.load(worksetData);
	};
	Workset.prototype.handleOpenButtonClick = function(e){
		this.activated.fire();
	};
	Workset.prototype.load = function (worksetData) {
		this.created = worksetData.created;
		this.updateProgress(worksetData.stats.tasks, worksetData.stats.labeled);
	};
	Workset.prototype.updateProgress = function (tasks, labeled) {
		this.completed = labeled === tasks;
		if ( this.completed ) {
			this.openButton.setLabel("review");
			this.openButton.setFlags( [] );
		} else {
			this.openButton.setLabel("open");
			this.openButton.setFlags(["constructive"]);
		}

		this.progress.setProgress( labeled / tasks );

		this.progress.setText( this.formatProgress(tasks, labeled) );

		this.updated.fire();
	};
	Workset.prototype.formatProgress = function (tasks, labeled) {
		return (new Date(this.reated)).format(WL.i18n("date-format")) + "(" +
		       String(labeled) + "/" + String(tasks) + ")";
	};
	Workset.prototype.select = function (selected) {
		if ( selected === undefined) {
			return this.$element.hasClass("selected");
		} else if ( selected ) {
			this.$element.addClass("selected");
			this.selected.fire();
			return this;
		} else {
			this.$element.removeClass("selected");
			return this;
		}
	};

	WL.Home = Home;

})(mediaWiki, jQuery, OO, wikiLabels);
