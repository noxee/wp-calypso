/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal Dependencies
 */
import FollowingStream from 'reader/following-stream';
import EmptyContent from './empty';
import StreamHeader from 'reader/stream-header';
import HeaderBack from 'reader/header-back';
import Gridicon from 'components/gridicon';

//const stats = require( 'reader/stats' );

const FeedStream = React.createClass( {

	propTypes: {
		query: React.PropTypes.string
	},

	getInitialState() {
		return {
			title: this.getTitle()
		};
	},

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.query !== this.props.query ) {
			this.updateState();
		}
	},

	updateState() {
		var newState = {
			title: this.getTitle()
		};
		if ( newState.title !== this.state.title ) {
			this.setState( newState );
		}
	},

	getTitle() {
		return this.props.query;
	},

	render() {
		const emptyContent = ( <EmptyContent query={ this.props.query } /> );

		if ( this.props.setPageTitle ) {
			this.props.setPageTitle( this.state.title );
		}

		return (
			<FollowingStream { ...this.props } listName={ this.state.title } emptyContent={ emptyContent } showFollowInHeader={ true } >
				{ this.props.showBack && <HeaderBack /> }
				<StreamHeader
					isPlaceholder={ false }
					icon={ <Gridicon icon="search" /> }
					title={ this.state.title }
					showFollow={ false } />
			</FollowingStream>
		);
	}
} );

export default FeedStream;
