/** @ssr-ready **/

/**
 * External dependencies
 */
import React, { PropTypes } from 'react'
import { connect } from 'react-redux';
import get from 'lodash/get';
import classnames from 'classnames';

const Main = React.createClass( {
	displayName: 'Main',

	render: function() {
		/**
		 * Skip this line for now, go read the remaining comments in the file,
		 * and come back here last.
		 *
		 * `Main` now knows what to do w.r.t. `primary` and
		 * shouldShowGuidesTour. :]
		 */
		console.log( 'Rendering main for', this.props.className,
				'\nshouldShowGuidesTour:', this.props.shouldShowGuidesTour );

		return (
			<main className={ classnames( this.props.className, 'main' ) } role="main">
				{ this.props.children }
			</main>
		);
	}
} );

/**
 * As apparent below, the idea is simple: connect Main to Redux so it knows
 * whether it should render a guided tour rather than `primary`.
 *
 * Before we go on to the next piece, notice how the selector is built very
 * defensively thanks to `lodash/get`. The whole state tree could very well be
 * undefined and the selector would still function properly. This will make
 * sense with what follows.
 */
const ConnectedMain = connect( ( state ) => ( {
	shouldShowGuidesTour: get( state, 'ui.guidesTour.shouldShow', false ),
} ) )( Main );

/**
 * However, `connect` will fail if no store is found in the React tree's
 * context.
 *
 * It just so happens that most sections that use Main don't make a descedent
 * of a ReduxProvider instance, so no store is to be found in those case.
 * However, we'd like to be able to use a connected Main anywhere applicable
 * and that component should gracefully handle the absence of a store.
 */
const fakeStore = { getState() {}, subscribe() {}, dispatch() {} };

const MainWrapper = React.createClass( {
	contextTypes: { store: PropTypes.object },
	render() {
		const needsFakeStore = ! this.context.store;

		if ( needsFakeStore ) {
			console.log( 'MainWrapper using fake store' );
		}

		return needsFakeStore
			? <ConnectedMain store={ fakeStore } { ...this.props } />
			: <ConnectedMain { ...this.props } />;
	}
} );

export default MainWrapper;
