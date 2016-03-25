import { expect } from 'chai';
import noop from 'lodash/noop';

import useMockery from 'test/helpers/use-mockery';
import useFakeDom from 'test/helpers/use-fake-dom';

import { sites } from './fixtures';
import i18n from 'lib/mixins/i18n';

describe( 'PluginsList', () => {
	let React, ReactInjection, TestUtils;
	let PluginsList = {};
	let siteListMock = {
		getSelectedSite() {
			return sites[0];
		}
	};
	useFakeDom();
	useMockery( mockery => {
		mockery.registerSubstitute( 'matches-selector', 'component-matches-selector' );
		mockery.registerSubstitute( 'query', 'component-query' );

		let emptyComponent = require( 'test/helpers/react/empty-component' );
		mockery.registerMock( 'my-sites/plugins/plugin-item/plugin-item', emptyComponent );
		mockery.registerMock( 'my-sites/plugins/plugin-list-header', emptyComponent );
		mockery.registerMock( 'analytics', { ga: { recordEvent: noop } } );
		mockery.registerMock( 'component-classes', () => {
			return { add: noop, toggle: noop, remove: noop }
		} );
		mockery.registerMock( 'lib/sites-list', () => siteListMock );
	} );

	before( () => {
		React = require( 'react' );
		ReactInjection = require( 'react/lib/ReactInjection' );
		TestUtils = require( 'react-addons-test-utils' );

		i18n.initialize();
		ReactInjection.Class.injectMixin( i18n.mixin );

		PluginsList = require( '../' );
	} );

	describe( 'rendering bulk actions', function() {
		let renderedPluginsList;
		let plugins = [
			{sites, slug: 'hello', name: 'Hello Dolly'},
			{sites, slug: 'jetpack', name: 'Jetpack'} ];

		beforeEach( () => {
			renderedPluginsList = TestUtils.renderIntoDocument(
				<PluginsList
					plugins={ plugins }
					header={ 'Plugins' }
					sites={ siteListMock }
					selectedSite={ { } }
					isPlaceholder={ false }
					pluginUpdateCount={ 2 }
				/> );
		} );

		it( 'should be intialized with no selectedPlugins', () => {
			expect( renderedPluginsList.state.selectedPlugins ).to.be.empty;
		} );

		it( 'should select all plugins when toggled on', () => {
			renderedPluginsList.toggleBulkManagement();
			expect( renderedPluginsList.state.selectedPlugins ).to.contain.all.keys( 'hello', 'jetpack' );
			expect( Object.keys( renderedPluginsList.state.selectedPlugins ) ).to.have.lengthOf( 2 );
		} );

		it( 'should always reset to all selected when toggled on', () => {
			renderedPluginsList.togglePlugin( plugins[0] );
			expect( Object.keys( renderedPluginsList.state.selectedPlugins ) ).to.have.lengthOf( 1 );

			renderedPluginsList.toggleBulkManagement();
			expect( renderedPluginsList.state.selectedPlugins ).to.contain.all.keys( 'hello', 'jetpack' );
			expect( Object.keys( renderedPluginsList.state.selectedPlugins ) ).to.have.lengthOf( 2 );
		} );
	} );
} );
