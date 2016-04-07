/**
 * External dependencies
 */
import React from 'react';
import notices from 'notices';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import formBase from './form-base';
import productsValues from 'lib/products-values';
import protectForm from 'lib/mixins/protect-form';
import Card from 'components/card';
import Button from 'components/button';
import UpgradeNudge from 'my-sites/upgrade-nudge';
import SectionHeader from 'components/section-header';
import ExternalLink from 'components/external-link';
import EmptyContent from 'components/empty-content';
import { abtest } from 'lib/abtest';
import config from 'config';
import analytics from 'analytics';

const debug = debugFactory( 'calypso:my-sites:site-settings' );

export default React.createClass( {

	displayName: 'SiteSettingsFormAnalytics',

	mixins: [ protectForm.mixin, formBase ],

	getInitialState() {
		return {
			isCodeValid: true
		};
	},

	resetState() {
		this.replaceState( {
			wga: {
				code: null
			},
			fetchingSettings: true
		} );
		debug( 'resetting state' );
	},

	getSettingsFromSite( siteInstance ) {
		const site = siteInstance || this.props.site;
		const settings = {
			wga: {
				code: ''
			},
			fetchingSettings: site.fetchingSettings
		};

		if ( site.settings ) {
			debug( 'site settings fetched' );
			settings.wga = site.settings.wga;
		}

		return settings;
	},

	isCodeValid( code ) {
		return ! code || code.match( /^UA-\d+-\d+$/i );
	},

	handleCodeChange( event ) {
		const code = event.target.value;
		const isCodeValid = this.isCodeValid( code );
		let notice = this.state.notice;

		if ( ! isCodeValid && ! notice ) {
			notice = notices.error( this.translate( 'Invalid Google Analytics Tracking ID.' ) );
		} else if ( isCodeValid && notice ) {
			notices.removeNotice( notice );
			notice = null;
		}

		this.setState( {
			wga: {
				code: event.target.value
			},
			isCodeValid: isCodeValid,
			notice: notice
		} );
	},

	isSubmitButtonDisabled() {
		return this.state.fetchingSettings || this.state.submittingForm || ! this.state.isCodeValid;
	},

	onClickAnalyticsInput() {
		this.recordEvent( 'Clicked Analytics Key Field' );
	},

	onKeyPressAnalyticsInput() {
		this.recordEventOnce( 'typedAnalyticsKey', 'Typed In Analytics Key Field' );
	},

	form() {
		var placeholderText = '';

		if ( this.state.fetchingSettings ) {
			placeholderText = this.translate( 'Loading' );
		}

		if ( abtest( 'contextualGoogleAnalyticsNudge' ) === 'drake' ) {
			let plansLink = '/plans/';
			if ( config.isEnabled( 'manage/plans' ) ) {
				plansLink += this.props.site.domain;
			} else {
				plansLink += this.props.site.ID;
			}
			return <EmptyContent
				illustration="/calypso/images/drake/drake-whoops.svg"
				title={ this.translate( 'Want to use Google Analytics on your site?', { context: 'site setting upgrade' } ) }
				line={ this.translate( 'Support for Google Analytics is now available with WordPress.com Business.', { context: 'site setting upgrade' } ) }
				action={ this.translate( 'Upgrade Now', { context: 'site setting upgrade' } ) }
				actionURL={ plansLink }
				isCompact={ true }
				actionCallback={ this.trackUpgradeClick } />;
		}

		return (
			<form id="site-settings" onSubmit={ this.submitForm } onChange={ this.markChanged }>
				<SectionHeader label={ this.translate( 'Analytics Settings' ) }>
					<Button
						primary
						compact
						disabled={ this.isSubmitButtonDisabled() }
						onClick={ this.submitForm }
						>{
							this.state.submittingForm
									? this.translate( 'Saving…' )
									: this.translate( 'Save Settings' )
						}
					</Button>
				</SectionHeader>
				<Card className="analytics-settings">
					{ this.renderNudge() }
					<fieldset>
						<label htmlFor="wgaCode">{ this.translate( 'Google Analytics Tracking ID', { context: 'site setting' } ) }</label>
						<input
							name="wgaCode"
							id="wgaCode"
							type="text"
							value={ this.state.wga.code }
							onChange={ this.handleCodeChange }
							placeholder={ placeholderText }
							disabled={ this.state.fetchingSettings || ! this.isEnabled() }
							onClick={ this.onClickAnalyticsInput }
							onKeyPress={ this.onKeyPressAnalyticsInput }
						/>
						<ExternalLink
							icon={ true }
							href="https://support.google.com/analytics/answer/1032385?hl=en"
							target="_blank"
						>
							{ this.translate( 'Where can I find my Tracking ID?' ) }
						</ExternalLink>
					</fieldset>
					<p>
						{ this.translate(
							'Google Analytics is a free service that complements our {{a}}built-in stats{{/a}} with different insights into your traffic.' +
							' WordPress.com stats and Google Analytics use different methods to identify and track activity on your site, so they will ' +
							'normally show slightly different totals for your visits, views, etc.',
							{
								components: {
									a: <a href={ '/stats/' + this.props.site.domain } />
								}
							}
						) }
					</p>
					<p>
					{ this.translate( 'Learn more about using {{a}}Google Analytics with WordPress.com{{/a}}.',
						{
							components: {
								a: <a href="http://en.support.wordpress.com/google-analytics/" target="_blank" />
							}
						}
					) }
					</p>
				</Card>
			</form>
		);
	},

	isEnabled() {
		return productsValues.isBusiness( this.props.site.plan ) || productsValues.isEnterprise( this.props.site.plan );
	},

	renderNudge() {
		if ( this.isEnabled() ) {
			return;
		}

		const eventName = 'google_analytics_' + abtest( 'contextualGoogleAnalyticsNudge' ) || 'google_analytics_notice';

		debug( 'Google analitics is not enabled. adding nudge ...' );

		return (
			<UpgradeNudge
				title={ this.translate( 'Add Google Analytics' ) }
				message={ this.translate( 'Upgrade to the business plan and include your own analytics tracking ID.' ) }
				feature="google-analytics"
				event={ eventName }
				icon="stats-alt"
			/>
		);
	},

	trackUpgradeClick: function() {
		analytics.tracks.recordEvent( 'calypso_upgrade_nudge_cta_click', { cta_name: 'google_analytics' } );
	},

	render() {
		// we need to check that site has loaded first... a placeholder would be better,
		// but returning null is better than a fatal error for now
		if ( ! this.props.site ) {
			return null;
		}
		// Only show Google Analytics for business users.
		return this.form();
	}
} );
