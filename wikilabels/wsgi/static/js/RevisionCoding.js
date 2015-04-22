/**
 * Interface for evaluating revisions
 *
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 * Based on mockups by Aaron Halfaker
 * https://meta.wikimedia.org/wiki/Research_talk:Revision_scoring_as_a_service?oldid=10266386#Revision_handcoding_.28mockups.29
 */
( function ( mw, $ ) {
	'use strict';
	var fields, tasks, curTaskIdx,
		baseUrl = '//ores-test.wmflabs.org/coder/';

	mw.messages.set( {
		'rvc-review': 'Review',
		'rvc-revision-title': 'Revision: $1',
		'rvc-work-set': 'Work set:',
		'rvc-submit': 'Submit',
		'rvc-dataset-completed': 'You completed this dataset!'
	} );

	function failedRequest( jqXHR, textStatus ) {
		alert( 'An error occurred: ' + textStatus );
	}

	function notImplemented() {
		alert( 'Not implemented yet.' );
	}

	function lookup( k ) {
		return mw.msg( 'rvc-' + k );
	}

	// Applying a translation to any level of a form description doc
	function applyTranslation( value, lookup ) {
		var i, l, transList, obj, transObj, key, str;
		if ( typeof value === 'string' ) {
			// If a string, look to see if we need to translate it.
			str = value;
			if ( str.charAt( 0 ) === '<' && str.charAt( str.length - 1 ) === '>' ) {
				// Lookup translation
				return lookup( str.substr( 1, str.length - 2 ) );
			} else {
				// No translation necessary
				return str;
			}
		} else if ( $.isArray( value ) ) {
			// Going to have to recurse for each item
			l = value;
			transList = [];
			for ( i in l ) {
				if ( l.hasOwnProperty( i ) ) {
					transList.push( applyTranslation( l[i], lookup ) );
				}
			}
			return transList;
		} else if ( typeof value === 'object' ) {
			// Going to have to recurse for each value
			obj = value;
			transObj = {};
			for ( key in obj ) {
				if ( obj.hasOwnProperty( key ) ) {
					transObj[ key ] = applyTranslation( obj[key], lookup );
				}
			}
			return transObj;
		} else {
			// bool or numeric == A-OK
			return value;
		}
	}

	function toggleSelection( e ) {
		var $target = $( e.target ),
			wasSelected = $target.hasClass( 'rvc-selected' );
		$target
			.parent()
				.find( '.rvc-selected' )
					.removeClass( 'rvc-selected' )
					.end()
				.end();
		if ( !wasSelected ) {
			$target.addClass( 'rvc-selected' );
		}
		// The user must select one value for each field
		$( '#rvc-submit' ).prop(
			'disabled',
			$( '.mw-ui-button.rvc-selected' ).length !== fields.length ||
				curTaskIdx >= tasks.length
		);
	}

	function getWorkSet( campId, wsId ) {
		// FIXME: Remove these hardcoded values
		campId = campId || 1;
		wsId = wsId || 1;
		return $.ajax( {
			url: baseUrl + 'campaigns/' + mw.config.get( 'wgDBname' ) + '/' +
				campId + '/' + wsId + '/',
			data: {
				tasks: ''
			},
			dataType: 'jsonp',
			timeout: 5000
		} ).fail( failedRequest );
	}

	function showWorkSet( data ) {
		var i, j, field, $icon, className, tooltip, value,
			$bar = $( '.rvc-progress' ).empty();
		tasks = ( data && data.tasks ) || tasks;
		for ( i = 0; i < tasks.length; i++ ) {
			$icon = $( '<div>' );
			tooltip = mw.msg( 'rvc-revision-title', tasks[i].data.rev_id );
			for ( j = 0; j < fields.length; j++ ) {
				field = fields[j].id;
				// FIXME: how to get the labels (values) without doing an API request for each task in this workset?
				// FIXME: type of label values are inconsistent (boolean vs integers):
				// * true/false: https://ores-test.wmflabs.org/coder/campaigns/enwiki/111/222/333/
				// * 1/0: https://ores-test.wmflabs.org/coder/forms/damaging_and_goodfaith
				//
				// idx = tasks[i].fields[ field ];
				// value = fields[j].options[ idx ] && fields[j].options[ idx ].value;
				// tooltip += '\n' + fields[j].label + ' ' + value;
				className = 'rvc-' + field + '-' + value;
				$icon.append( $( '<div>' ).addClass( className ) );
			}
			$icon.attr(
				'title',
				tooltip
			);
			$bar.append( $icon );
		}
		$( '.rvc-progress > div' ).css( 'width', ( 100 / tasks.length ) + '%' );
		$( '.mw-ui-button.rvc-selected' ).removeClass( 'rvc-selected' );
		$( '#rvc-submit' ).prop( 'disabled', true );
		if ( curTaskIdx < tasks.length ) {
			$bar.find( '> div' ).eq( curTaskIdx ).addClass( 'rvc-selected' );
			showDiff( tasks[curTaskIdx].data.rev_id );
		}
	}

	function showDiff( revid ) {
		new mw.Api().get( {
			action: 'query',
			prop: 'revisions',
			rvdiffto: 'prev',
			revids: revid,
			indexpageids: true
		} ).done( function ( data ) {
			var page, pageids = data.query.pageids;
			if ( pageids && pageids[0] ) {
				page = data.query.pages[ pageids[0] ];
				if ( page.missing !== '' ) {
					// $( '#firstHeading' ).text( page.title );
					$( '#rvc-diff' ).empty().append(
						page.revisions[0].diff['*']
					);
				} else {
					$( '#rvc-diff' ).empty().text( mw.msg( 'rvc-page-missing' ) );
				}
			} else {
				$( '#rvc-diff' ).empty().text( mw.msg( 'rvc-badpageid' ) );
			}
		} );
	}

	function submit() {
		var campId = 1,
			wsId = 1,
			taskId = 1;
		$( '.mw-ui-button.rvc-selected' ).each( function () {
			var $this = $( this ),
				idxValue = $this.data( 'rvc-value' ),
				field = $this.parent().data( 'rvc-field' );
			if ( field !== undefined && idxValue !== undefined ) {
				if ( !tasks[ curTaskIdx ].fields ) {
					tasks[ curTaskIdx ].fields = {};
				}
				tasks[ curTaskIdx ].fields[ field ] = idxValue;
			}
		} );
		$( '#rvc-submit' ).injectSpinner( 'rvc-submit-spinner' );
		$.ajax( {
			url: baseUrl + 'campaigns/' + mw.config.get( 'wgDBname' ) + '/' +
				campId + '/' + wsId + '/' + taskId + '/',
			data: {
				label: JSON.stringify( {
					// TODO: use integers consistently for storing labels?
					goodfaith: true,
					damaging: false
				} )
			},
			dataType: 'jsonp',
			timeout: 5000
		} ).always( function () {
			$.removeSpinner( 'rvc-submit-spinner' );
		} ).fail( failedRequest );
		curTaskIdx++;
		showWorkSet();
		if ( curTaskIdx >= tasks.length ) {
			alert( mw.msg( 'rvc-dataset-completed' ) );
			$( '#rvc-submit' ).prop( 'disabled', true );
		}
	}

	function loadForm( data ) {
		var $ui = $( '#rvc-ui' ),
			// FIXME: Migrate to OOjs UI (http://livingstyleguide.wmflabs.org/wiki/OOjs_UI)
			$submit = $( '<input id="rvc-submit" class="mw-ui-button mw-ui-constructive" type="submit">' )
				.prop( 'disabled', true )
				.click( submit ),
			field, i, j, id, val, $feature, $group, key, messages, prefixedMsgs;
		// Reads in messages and sets a prefix for mw.msg to do lookups
		messages = data.i18n[ mw.config.get( 'wgUserLanguage' ) ] || data.i18n.en;
		prefixedMsgs = {};
		for ( key in messages ) {
			if ( messages.hasOwnProperty( key ) ) {
				prefixedMsgs[ 'rvc-' + key ] = messages[ key ];
			}
		}
		mw.messages.set( prefixedMsgs );
		fields = applyTranslation( data.fields, lookup );

		$submit.val( mw.msg( 'rvc-submit' ) );
		$ui.append(
			$( '<div>' )
				.text( mw.msg( 'rvc-work-set' ) ),
			$( '<div>' )
				.addClass( 'rvc-progress' )
		);
		for ( i = 0; i < fields.length; i++ ) {
			field = fields[i];
			id = field.id;
			$group = $( '<div>' )
				.data( 'rvc-field', id )
				// .addClass( 'mw-ui-radio');
				.addClass( 'mw-ui-button-group' );
			for ( j = 0; j < field.options.length; j++ ) {
				val = field.options[j].value;
				$group.append(
					$( '<div>' )
						.addClass( 'mw-ui-button' )
						.attr( 'id', 'rvc-' + field.id + '-' + val )
						.attr( 'title', field.options[j].tooltip )
						.text( field.options[j].label )
						.data( 'rvc-value', j )
						.click( toggleSelection )
// 					$( '<input type="radio">' )
// 						.attr( 'name', 'rvc-' + field.id )
// 						.attr( 'id', 'rvc-' + field.id + '-' + val )
// 						.attr( 'title', field.options[j].tooltip ),
// 					$( '<label for="">' )
// 						.text( field.options[j].label )
// 						.attr( 'for', 'rvc-' + field.id + '-' + val )
// 						.data( 'rvc-value', j )
// 						.click( toggleSelection )
				);
			}
			$feature = $( '<div>' )
				.attr( 'title', field.help )
				.append(
					$( '<div>' )
						.text( field.label ),
					$group
				);
			$ui.append( $feature, '<div style="clear:both"></div>' );
		}
		$ui.append( $submit )
			.append(
				'<table class="diff diff-contentalign-left">' +
				'<colgroup><col class="diff-marker">' +
				'<col class="diff-content">' +
				'<col class="diff-marker">' +
				'<col class="diff-content">' +
				'</colgroup><tbody id="rvc-diff"></tbody></table>'
			);
		curTaskIdx = 0;
		getWorkSet()
			.done( showWorkSet );
	}

	function showCampaigns( data ) {
		var i,
			dfd = $.Deferred(),
			promises = [],
			$ui = $( '#rvc-ui' ).empty(),
			$campaigns = $( '<div id="rvc-campaigns"></div>' ),
			$ul = $( '<ul></ul>' );

		function addCampaign( campId ) { // , $li
			return $.ajax( {
				url: baseUrl + 'campaigns/enwiki/' + campId + '/?worksets',
				dataType: 'jsonp'
			} )
			.then( function ( data ) {
				var i, d, $ul,
					$li = $( '<li></li>' )
						.text( data.campaign.name );
				if ( data.worksets.length ) {
					$ul = $( '<ul></ul>' )
						.addClass( 'mw-collapsible mw-collapsed' )
					for ( i = 0; i < data.worksets.length; i++ ) {
						d = new Date( data.worksets[i].created * 1000 );
						$ul.append(
							$( '<li></li>' )
								.append(
									$( '<div class="mw-ui-button-group"></div>' )
										.append(
											$( '<div class="mw-ui-button" disabled></div>' )
												.text( d.toString() + ' (100/100)' )
												.click( notImplemented ),
											$( '<div class="mw-ui-button mw-ui-progressive"></div>' )
												.text( mw.msg( 'rvc-review' ) )
												.click( notImplemented )
										),
									$( '<div style="clear:both"></div>' )
								)
						);
					}
					$li.append( $ul );
				}
				return $li;
			} );
		}

		for ( i = 0; i < data.campaigns.length; i++ ) {
			promises.push( addCampaign( data.campaigns[i].id ) );
		}
		$.when.apply( $, promises )
			.done( function () {
				var i;
				for ( i = 0; i < arguments.length; i++ ) {
					$ul.append( arguments[i] );
				}
				$ui.append( $campaigns.append( $ul ) );
				$( '.mw-collapsible' ).makeCollapsible();
				// FIXME: return the form for the campaing selected by the user, instead of the first one
				dfd.resolve( data.campaigns[0].form );
			} ).fail( function () {
				dfd.reject();
			} );
		return dfd.promise();
	}

	if ( $.inArray( mw.config.get( 'wgAction' ), [ 'view', 'purge' ] ) !== -1 ) {
		$( function () {
			// FIXME: Remove this hack! (once the server has campaigns for testwiki)
			var db = mw.config.get( 'wgDBname' ) === 'testwiki' ? 'enwiki' : mw.config.get( 'wgDBname' );
			if ( $( '#rvc-ui' ).length !== 0 ) {
				$.ajax( {
					url: baseUrl + 'campaigns/' + db + '/', // mw.config.get( 'wgDBname' ) + '/',
					dataType: 'jsonp'
				} )
				.then( mw.loader.using( [
					'mediawiki.api',
					'jquery.spinner',
					'jquery.makeCollapsible',
					// TODO: Load this only when necessary
					// (e.g. if the user will be required to click on some button before the first diff appears)
					'mediawiki.action.history.diff'
				] ) )
				.then( showCampaigns, failedRequest )
				.then( function ( formName ) {
					// FIXME: Remove this once the correct name is returned by the server
					if ( formName === 'damaging_and_badfaith' ) {
						formName = 'damaging_and_goodfaith';
					}
					$.ajax( {
						url: baseUrl + 'forms/' + formName,
						dataType: 'jsonp',
						timeout: 5000
					} )
					.done( loadForm )
					.fail( failedRequest );
				}, failedRequest );
			}
		} );
	}

}( mediaWiki, jQuery ) );
