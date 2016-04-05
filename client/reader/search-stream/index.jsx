/**
 * External Dependencies
 */
import React from 'react';
import ReactDom from 'react-dom';

/**
 * Internal Dependencies
 */
import Main from 'components/main';
import FollowingStream from 'reader/following-stream';
import EmptyContent from './empty';
import StreamHeader from 'reader/stream-header';
import HeaderBack from 'reader/header-back';
import Gridicon from 'components/gridicon';
import FormTextInput from 'components/forms/form-text-input';

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

	updateQuery() {
		const newValue = ReactDom.findDOMNode( this.refs.searchInput ).value;
		console.log( 'new value', newValue );
		this.props.onQueryChange( newValue );
	},

	render() {
		const emptyContent = ( <EmptyContent query={ this.props.query } /> );

		if ( this.props.setPageTitle ) {
			this.props.setPageTitle( this.state.title || this.translate( 'Search' ) );
		}

		return (
			<FollowingStream { ...this.props }
				listName={ this.state.title }
				emptyContent={ emptyContent }
				showFollowInHeader={ true } >
				{ this.props.showBack && <HeaderBack /> }
				<h2>{ this.translate( 'Search' ) }</h2>
				<p>
					<FormTextInput type="text" value={ this.props.query } ref="searchInput" onChange={ this.updateQuery } placeholder={ this.translate( 'Enter a search term' ) } />
				</p>
				{ this.props.query && <StreamHeader
					isPlaceholder={ false }
					icon={ <Gridicon icon="search" /> }
					title={ this.state.title }
					showFollow={ false } />
				}
			</FollowingStream>
		);
	}
} );

export default FeedStream;
