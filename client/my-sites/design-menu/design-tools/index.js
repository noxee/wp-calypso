/**
 * External dependencies
 */
import get from 'lodash/get';
import assign from 'lodash/assign';

/**
 * Internal dependencies
 */
import { translate } from 'lib/mixins/i18n';
import SiteTitleControl from 'my-sites/site-title';
import HeaderImageControl from 'my-sites/header-image';
import ControlList from './control-list';

const designToolsById = {

	default: {
		title: translate( 'Customizing' ),
		componentClass: ControlList,
	},

	siteTitle: {
		title: translate( 'Site Title, Tagline, and Logo' ),
		componentClass: SiteTitleControl,
		mapStateToProps: state => {
			if ( ! state.preview ) {
				return {};
			}
			const { ui, preview } = state;
			const siteId = ui.selectedSiteId;
			const selectedSite = state.sites.items[ siteId ] || {};
			if ( preview.customizations.siteTitle ) {
				return preview.customizations.siteTitle;
			}
			return { blogname: selectedSite.name, blogdescription: selectedSite.description };
		},
	},

	headerImage: {
		title: translate( 'Header Image' ),
		componentClass: HeaderImageControl,
		mapStateToProps: state => {
			if ( ! state.preview ) {
				return {};
			}
			const { ui, preview } = state;
			const siteId = ui.selectedSiteId;
			const selectedSite = state.sites.items[ siteId ] || {};
			if ( preview.customizations.headerImage ) {
				return assign( { site: selectedSite }, preview.customizations.headerImage );
			}
			const headerImagePostId = get( selectedSite, 'options.header_image.attachment_id' );
			const headerImageUrl = get( selectedSite, 'options.header_image.url' );
			const headerImageWidth = get( selectedSite, 'options.header_image.width' );
			const headerImageHeight = get( selectedSite, 'options.header_image.height' );
			return { site: selectedSite, headerImagePostId, headerImageUrl, headerImageWidth, headerImageHeight };
		},

	},
};

export default designToolsById;
