/**
 * External dependencies
 */
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';

/**
 * Internal dependencies
 */
import sitesSync from './sites/enhancer';
import noticesMiddleware from './notices/middleware';
import application from './application/reducer';
import accountRecovery from './account-recovery/reducer';
import automatedTransfer from './automated-transfer/reducer';
import billingTransactions from './billing-transactions/reducer';
import comments from './comments/reducer';
import componentsUsageStats from './components-usage-stats/reducer';
import consoleDispatcher from './console-dispatch';
import countryStates from './country-states/reducer';
import currentUser from './current-user/reducer';
import documentHead from './document-head/reducer';
import domains from './domains/reducer';
import geo from './geo/reducer';
import googleAppsUsers from './google-apps-users/reducer';
import help from './help/reducer';
import jetpackConnect from './jetpack-connect/reducer';
import jetpack from './jetpack/reducer';
import jetpackSync from './jetpack-sync/reducer';
import happinessEngineers from './happiness-engineers/reducer';
import happychat from './happychat/reducer';
import media from './media/reducer';
import notices from './notices/reducer';
import pageTemplates from './page-templates/reducer';
import plans from './plans/reducer';
import plugins from './plugins/reducer';
import postFormats from './post-formats/reducer';
import posts from './posts/reducer';
import postTypes from './post-types/reducer';
import preferences from './preferences/reducer';
import preview from './preview/reducer';
import productsList from './products-list/reducer';
import pushNotifications from './push-notifications/reducer';
import purchases from './purchases/reducer';
import reader from './reader/reducer';
import receipts from './receipts/reducer';
import sharing from './sharing/reducer';
import shortcodes from './shortcodes/reducer';
import signup from './signup/reducer';
import sites from './sites/reducer';
import siteRoles from './site-roles/reducer';
import siteSettings from './site-settings/reducer';
import stats from './stats/reducer';
import storedCards from './stored-cards/reducer';
import support from './support/reducer';
import terms from './terms/reducer';
import themes from './themes/reducer';
import ui from './ui/reducer';
import users from './users/reducer';
import wordads from './wordads/reducer';

/**
 * Module variables
 */
export const reducer = combineReducers( {
	application,
	accountRecovery,
	automatedTransfer,
	billingTransactions,
	comments,
	componentsUsageStats,
	countryStates,
	currentUser,
	documentHead,
	domains,
	geo,
	googleAppsUsers,
	happinessEngineers,
	happychat,
	help,
	jetpackConnect,
	jetpack,
	jetpackSync,
	media,
	notices,
	pageTemplates,
	plugins,
	plans,
	postFormats,
	posts,
	postTypes,
	preferences,
	preview,
	productsList,
	purchases,
	pushNotifications,
	reader,
	receipts,
	sharing,
	shortcodes,
	signup,
	sites,
	siteRoles,
	siteSettings,
	stats,
	storedCards,
	support,
	terms,
	themes,
	ui,
	users,
	wordads,
} );

const middleware = [ thunkMiddleware, noticesMiddleware ];

if ( typeof window === 'object' ) {
	// Browser-specific middlewares
	middleware.push(
		require( './analytics/middleware.js' ).analyticsMiddleware,
		require( './data-layer/wpcom-api-middleware.js' ).middleware,
	);
}

export function createReduxStore( initialState = {} ) {
	const enhancers = [ applyMiddleware( ...middleware ) ];

	if ( 'object' === typeof window ) {
		enhancers.push( sitesSync );

		if ( window.app && window.app.isDebug ) {
			enhancers.push( consoleDispatcher );
		}

		if ( window.devToolsExtension ) {
			enhancers.push( window.devToolsExtension() );
		}
	}

	return compose( ...enhancers )( createStore )( reducer, initialState );
}
