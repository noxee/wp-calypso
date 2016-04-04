/**
 * External dependencies
 */
var expect = require( 'chai' ).expect,
	moment = require( 'moment' ),
	React = require( 'react' ),
	sinon = require( 'sinon' ),
	mockery = require( 'mockery' ),
	TestUtils = require( 'react-addons-test-utils' );

/**
 * Internal dependencies
 */
import useFakeDom from 'test/helpers/use-fake-dom';
import useMockery from 'test/helpers/use-mockery';
import { useSandbox } from 'test/helpers/use-sinon';

/**
 * Module variables
 */

describe( 'EditorGroundControl', function() {
	var sandbox,
		EditorGroundControl,
		MOCK_SITE = {
			capabilities: {
				publish_posts: true
			},
			options: {}
		};

	useFakeDom();
	useSandbox( ( _sandbox ) => sandbox = _sandbox );
	useMockery();

	before( function() {
		var MOCK_COMPONENT = React.createClass( {
			render: function() {
				return null;
			}
		} );

		mockery.registerMock( 'components/card', MOCK_COMPONENT );
		mockery.registerMock( 'components/popover', MOCK_COMPONENT );
		mockery.registerMock( 'my-sites/site', MOCK_COMPONENT );
		mockery.registerMock( 'post-editor/edit-post-status', MOCK_COMPONENT );
		mockery.registerMock( 'post-editor/editor-status-label', MOCK_COMPONENT );
		mockery.registerMock( 'components/sticky-panel', MOCK_COMPONENT );
		mockery.registerMock( 'components/post-schedule', MOCK_COMPONENT );
		EditorGroundControl = require( '../' ).WrappedComponent;
		EditorGroundControl.prototype.__reactAutoBindMap.translate = sinon.stub().returnsArg( 0 );
		EditorGroundControl.prototype.__reactAutoBindMap.moment = moment;
		// TODO: REDUX - add proper tests when whole post-editor is reduxified
		mockery.registerMock( 'react-redux', {
			connect: () => component => component
		} );
	} );

	afterEach( function() {
		sandbox.restore();
	} );

	describe( '#getPreviewLabel()', function() {
		it( 'should return View if the site is a Jetpack site and the post is published', function() {
			const tree = TestUtils.renderIntoDocument(
				<EditorGroundControl
					savedPost={ { status: 'publish' } }
					site={ { jetpack: true } }
				/>
			);

			expect( tree.getPreviewLabel() ).to.equal( 'View' );
		} );

		it( 'should return Preview if the post was not originally published', function() {
			const tree = TestUtils.renderIntoDocument(
				<EditorGroundControl
					savedPost={ { status: 'draft' } }
					post={ { status: 'publish' } }
					site={ MOCK_SITE }
				/>
			);

			expect( tree.getPreviewLabel() ).to.equal( 'Preview' );
		} );
	} );

	describe( '#isSaveEnabled()', function() {
		it( 'should return false if form is saving', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaving /> );

			expect( tree.isSaveEnabled() ).to.be.false;
		} );

		it( 'should return false if saving is blocked', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaveBlocked /> );

			expect( tree.isSaveEnabled() ).to.be.false;
		} );

		it( 'should return false if post does not exist', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaving={ false } hasContent isDirty /> );

			expect( tree.isSaveEnabled() ).to.be.false;
		} );

		it( 'should return true if dirty and post has content and post is not published', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaving={ false } post={ {} } hasContent isDirty /> );

			expect( tree.isSaveEnabled() ).to.be.true;
		} );

		it( 'should return false if dirty, but post has no content', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaving={ false } isDirty /> );

			expect( tree.isSaveEnabled() ).to.be.false;
		} );

		it( 'should return false if dirty and post is published', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaving={ false } post={ { status: 'publish' } } isDirty /> );

			expect( tree.isSaveEnabled() ).to.be.false;
		} );
	} );

	describe( '#isPreviewEnabled()', function() {
		it( 'should return true if post is not empty', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl post={ {} } isNew hasContent isDirty /> );

			expect( tree.isPreviewEnabled() ).to.be.true;
		} );

		it( 'should return false if saving is blocked', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl isSaveBlocked /> );

			expect( tree.isPreviewEnabled() ).to.be.false;
		} );

		it( 'should return true even if form is publishing', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl post={ {} } hasContent isPublishing /> );

			expect( tree.isPreviewEnabled() ).to.be.true;
		} );

		it( 'should return false if not dirty', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl post={ {} } isDirty={ false } isNew /> );

			expect( tree.isPreviewEnabled() ).to.be.false;
		} );

		it( 'should return false if post has no content', function() {
			const tree = TestUtils.renderIntoDocument( <EditorGroundControl post={ {} } hasContent={ false } /> );

			expect( tree.isPreviewEnabled() ).to.be.false;
		} );
	} );
} );
