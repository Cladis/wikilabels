/**
 * Interface for evaluating the quality of revisions
 *
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 * Based on mockups by Aaron Halfaker
 * https://meta.wikimedia.org/wiki/Research_talk:Revision_scoring_as_a_service?oldid=10266386#Revision_handcoding_.28mockups.29
 */
( function ( mw, $ ) {
	'use strict';
	var i18n = {
		en: {
			'qc-work-set': 'Work set:',
			'qc-damaging': 'Damaging?',
			'qc-damaging-title': 'Did this edit cause damage to the article?',
			'qc-damaging-yes': 'Yes',
			'qc-damaging-yes-title': 'Yes, this edit is damaging and should be reverted.',
			'qc-damaging-no': 'No',
			'qc-damaging-no-title': 'No, this edit is not damaging and should not be reverted.',
			'qc-damaging-unsure': 'Unsure',
			'qc-damaging-unsure-title': 'It\'s not clear whether this edit damages the article or not.',
			'qc-good-faith': 'Good faith?',
			'qc-good-faith-title': 'Does it appear as though the author of this edit was trying to contribute productively?',
			'qc-good-faith-yes': 'Yes',
			'qc-good-faith-yes-title': 'Yes, this edit appears to have been made in good-faith.',
			'qc-good-faith-no': 'No',
			'qc-good-faith-no-title': 'No, this edit appears to have been made in bad-faith.',
			'qc-good-faith-unsure': 'Unsure',
			'qc-good-faith-unsure-title': 'It\'s not clear whether or not this edit was made in good-faith.',
			'qc-icon-title': 'Revision: $1\nDamaging? $2\nGood-faith? $3',
			'qc-submit': 'Submit',
			'qc-not-implemented': 'This feature is not implemented yet.'
		},
		pt: {
			'qc-work-set': 'Conjunto de trabalho:',
			'qc-damaging': 'Prejudicial?',
			'qc-damaging-title': 'Esta edição prejudicou o artigo?',
			'qc-damaging-yes': 'Sim',
			'qc-damaging-yes-title': 'Sim, esta edição é prejudicial e deveria ser revertida.',
			'qc-damaging-no': 'Não',
			'qc-damaging-no-title': 'Não, esta edição não é prejudicial e não deveria ser revertida.',
			'qc-damaging-unsure': 'Não tenho certeza',
			'qc-damaging-unsure-title': 'Não está claro se esta edição prejudica o artigo ou não.',
			'qc-good-faith': 'De boa fé?',
			'qc-good-faith-title': 'Parece que o autor desta edição estava tentando contribuir produtivamente?',
			'qc-good-faith-yes': 'Sim',
			'qc-good-faith-yes-title': 'Sim, esta edição parece ter sido feita de boa fé.',
			'qc-good-faith-no': 'Não',
			'qc-good-faith-no-title': 'Não, esta edição parece ter sido feita de má fé.',
			'qc-good-faith-unsure': 'Não tenho certeza',
			'qc-good-faith-unsure-title': 'Não está claro se esta edição foi feita de boa fé.',
			'qc-icon-title': 'Revisão: $1\nPrejudicial? $2\nDe boa fé? $3',
			'qc-submit': 'Submeter',
			'qc-not-implemented': 'Este recurso ainda não está implementado.'
		}
	}, fields;

	function notImplemented( e ) {
		var $target = $( e.target );
		$target
			.parent()
				.find( 'div' )
					.removeClass( 'qc-selected' )
					.end()
				.end()
			.addClass( 'qc-selected' );
		alert( 'The value is ' + $target.data( 'qc-value' ) );
	}

	// FIXME: Replace this by an actual call to some API which returns revision ids
	function getRandomSet( size, done ) {
		var i, j, rev, list = [];
		size = size || 100;
		done = done || 70;
		for ( i = 0; i < size; i++ ) {
			rev = {
				id: Math.floor( Math.random() * 1000000 ),
				// One key for each of the things we want to predict (vandalism, good-faith, quality, etc)
				fields: {}
			};
			if ( i <= done ) {
				// TODO:
				// * Should an 'undefined' value mean 'unknown'?
				//   In that case, this could be a boolean
				// * Or one should explicitly set a value (e.g. 0) to mean 'unknown'?
				//   In case there are just three possibilities, we could use -1, 0 and 1 instead of 0, 1 and 2?
				// FIXME: these names should not be hardcoded
				// TODO: Should we hardcode common sense such as "not damaging implies good faith"?
				for ( j = 0; j < fields.length; j++ ) {
					// Classes from 0 to (N-1), where N is the number of options for this field
					rev.fields[ fields[j].id ] = Math.floor( Math.random() * fields[j].options.length );
				}
			}
			list.push( rev );
		}
		return list;
	}

	function showWorkSet() {
		var i, j, field, idx, $icon, className,
			$bar = $( '.qc-progress' ),
			// FIXME: this will probably be assyncronous (obtained from some API)
			workSet = getRandomSet();
		for ( i = 0; i < workSet.length; i++ ) {
			$icon = $( '<div>' );
			for ( j = 0; j < fields.length; j++ ) {
				field = fields[j].id;
				idx = workSet[i].fields[ field ];
				if( idx !== undefined ){
					className = 'qc-' + field + '-' + fields[j].options[ idx ].value;
					$icon.addClass( className );
				}
			}
			$icon.attr(
				'title',
				mw.msg(
					'qc-icon-title',
					workSet[i].id,
					// FIXME: Each revision is scored according to more than one aspect
					// so we need to pass a variable number of parameters to the messages
					mw.msg( className )
				)
			);
			$bar.append( $icon );
		}
		$( '.qc-progress div' ).css( 'width', ( 100 / workSet.length ) + '%' );
	}

	function loadConfig(){
		return [
			{
				id: 'damaging',
				class: 'revcoding.ui.RadioButtons',
				label: mw.msg( 'qc-damaging' ),
				help: mw.msg( 'qc-damaging-title' ),
				options: [
					{
						label: mw.msg( 'qc-damaging-yes' ),
						tooltip: mw.msg( 'qc-damaging-yes-title' ),
						value: 'yes'
					},
					{
						label: mw.msg( 'qc-damaging-unsure' ),
						tooltip: mw.msg( 'qc-damaging-unsure-title' ),
						value: 'unsure'
					},
					{
						label: mw.msg( 'qc-damaging-no' ),
						tooltip: mw.msg( 'qc-damaging-no-title' ),
						value: 'no'
					}
				]
			},
			{
				id: 'good-faith',
				class: 'revcoding.ui.RadioButtons',
				label: mw.msg( 'qc-good-faith' ),
				help: mw.msg( 'qc-good-faith-title' ),
				options: [
					{
						label: mw.msg( 'qc-good-faith-yes' ),
						tooltip: mw.msg( 'qc-good-faith-yes-title' ),
						value: 'yes'
					},
					{
						label: mw.msg( 'qc-good-faith-unsure' ),
						tooltip: mw.msg( 'qc-good-faith-unsure-title' ),
						value: 'unsure'
					},
					{
						label: mw.msg( 'qc-good-faith-no' ),
						tooltip: mw.msg( 'qc-good-faith-no-title' ),
						value: 'no'
					}
				]
			}
		];
	}

	function load() {
		var $ui = $( '<div>' )
				.addClass( 'qc-ui' ),
			$submit = $( '<input class="mw-ui-button mw-ui-constructive" type="submit">' )
				.val( mw.msg( 'qc-submit' ) ),
			field, i, j, id, $feature, $group;
		// When moving this around, make sure that mw.messages.set is called before mw.msg
		fields = loadConfig();
		$ui.append(
			$( '<div>' )
				.text( mw.msg( 'qc-work-set' ) ),
			$( '<div>' )
				.addClass( 'qc-progress' )
		);
		for ( i = 0; i < fields.length; i++ ) {
			field = fields[i];
			id = field.id;
			$group = $( '<div>' )
				.addClass( 'mw-ui-button-group');
			for ( j = 0; j < field.options.length; j++ ) {
				$group.append(
					$( '<div>' )
						.addClass( 'mw-ui-button')
						.attr( 'title', field.options[j].tooltip )
						.text( field.options[j].label )
						.data( 'qc-value', field.options[j].value )
						.click( notImplemented )
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
		$ui.append( $submit );
		$( 'table.diff' ).first().before( $ui );
		showWorkSet();
	}

	if ( mw.util.getParamValue( 'diff' ) !== null ) {
		mw.messages.set( i18n[ mw.config.get( 'wgUserLanguage' ) ] || i18n.en );
		$( load );
	}

}( mediaWiki, jQuery ) );
