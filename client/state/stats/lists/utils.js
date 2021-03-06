/**
 * External dependencies
 */
import { sortBy, toPairs, camelCase, mapKeys, isNumber, get, filter, map, concat, flatten } from 'lodash';
import { moment, translate } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { PUBLICIZE_SERVICES_LABEL_ICON } from './constants';

/**
 * Returns an object with the startOf and endOf dates
 * for the given stats period and date
 *
 * @param  {String} period Stats query
 * @param  {String} date   Stats date
 * @return {Object}        Period range
 */
export function rangeOfPeriod( period, date ) {
	const momentDate = moment( date ).locale( 'en' );
	const startOf = momentDate.clone().startOf( period );
	const endOf = momentDate.clone().endOf( period );

	if ( 'week' === period ) {
		if ( '0' === momentDate.format( 'd' ) ) {
			startOf.subtract( 6, 'd' );
		} else {
			startOf.add( 1, 'd' );
			endOf.add( 1, 'd' );
		}
	}
	return {
		startOf: startOf.format( 'YYYY-MM-DD' ),
		endOf: endOf.format( 'YYYY-MM-DD' )
	};
}

/**
 * Parse the avatar URL
 * @param  {String} avatarUrl Raw avatar URL
 * @return {String}           Parsed URL
 */
function parseAvatar( avatarUrl ) {
	if ( ! avatarUrl ) {
		return null;
	}
	const [ avatarBaseUrl ] = avatarUrl.split( '?' );
	return avatarBaseUrl + '?d=mm';
}

/**
 * Builds data into escaped array for CSV export
 *
 * @param  {Object} data   Normalized stats data object
 * @param  {String} parent Label of parent
 * @return {Array}         CSV Row
 */
export function buildExportArray( data, parent = null ) {
	if ( ! data || ! data.label || ! data.value ) {
		return [];
	}
	const label = parent ? ( parent + ' > ' + data.label ) : data.label;
	const escapedLabel = label.replace( /\"/, '""' );
	let exportData = [ [ '"' + escapedLabel + '"', data.value ] ];

	if ( data.children ) {
		const childData = map( data.children, ( child ) => {
			return buildExportArray( child, label );
		} );

		exportData = concat( exportData, flatten( childData ) );
	}

	return exportData;
}

/**
 * Returns a serialized stats query, used as the key in the
 * `state.stats.lists.items` and `state.stats.lists.requesting` state objects.
 *
 * @param  {Object} query    Stats query
 * @return {String}          Serialized stats query
 */
export function getSerializedStatsQuery( query = {} ) {
	return JSON.stringify( sortBy( toPairs( query ), ( pair ) => pair[ 0 ] ) );
}

export const normalizers = {
	/**
	 * Returns a normalized payload from `/sites/{ site }/stats`
	 *
	 * @param  {Object} data    Stats data
	 * @return {Object?}        Normalized stats data
	 */
	stats( data ) {
		if ( ! data || ! data.stats ) {
			return null;
		}

		return mapKeys( data.stats, ( value, key ) => camelCase( key ) );
	},

	/**
	 * Returns a normalized payload from `/sites/{ site }/stats/insights`
	 *
	 * @param  {Object} data    Stats query
	 * @return {Object?}        Normalized stats data
	 */
	statsInsights: ( data ) => {
		if ( ! data || ! isNumber( data.highest_day_of_week ) ) {
			return {};
		}

		const {
			highest_hour,
			highest_day_percent,
			highest_day_of_week,
			highest_hour_percent
		} = data;

		// Adjust Day of Week from 0 = Monday to 0 = Sunday (for Moment)
		let dayOfWeek = highest_day_of_week + 1;
		if ( dayOfWeek > 6 ) {
			dayOfWeek = 0;
		}

		return {
			day: moment().day( dayOfWeek ).format( 'dddd' ),
			percent: Math.round( highest_day_percent ),
			hour: moment().hour( highest_hour ).startOf( 'hour' ).format( 'LT' ),
			hourPercent: Math.round( highest_hour_percent )
		};
	},

	/**
	 * Returns a normalized payload from `/sites/{ site }/stats/top-posts`
	 *
	 * @param  {Object} data    Stats data
	 * @param  {Object} query   Stats query
	 * @param  {Int}    siteId  Site ID
	 * @param  {Obejct} site    Site object
	 * @return {Object?}        Normalized stats data
	 */
	statsTopPosts: ( data, query, siteId, site ) => {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}

		const { startOf, endOf } = rangeOfPeriod( query.period, query.date );
		const dataPath = query.summarize ? [ 'summary', 'postviews' ] : [ 'days', startOf, 'postviews' ];
		const viewData = get( data, dataPath, [] );

		return map( viewData, ( item ) => {
			const detailPage = site ? `/stats/post/${ item.id }/${ site.slug }` : null;
			let inPeriod = false;

			// Archive and home pages do not have dates
			if ( item.date ) {
				const postDate = moment( item.date );
				// TODO: might be nice to update moment and use isSameOrAfter and isSameOrBefore
				if (
					( postDate.isAfter( startOf, 'day' ) || postDate.isSame( startOf, 'day' ) ) &&
					( postDate.isBefore( endOf, 'day' ) || postDate.isSame( endOf, 'day' ) )
				) {
					inPeriod = true;
				}
			}

			return {
				label: item.title,
				value: item.views,
				page: detailPage,
				actions: [ {
					type: 'link',
					data: item.href
				} ],
				labelIcon: null,
				children: null,
				className: inPeriod ? 'published' : null
			};
		} );
	},

	/**
	 * Returns a normalized payload from `/sites/{ site }/stats/country-views`
	 *
	 * @param  {Object} data    Stats data
	 * @param  {Object} query   Stats query
	 * @return {Object?}        Normalized stats data
	 */
	statsCountryViews: ( data, query = {} ) => {
		// parsing a country-views response requires a period and date
		if ( ! data || ! query.period || ! query.date ) {
			return null;
		}
		const { startOf } = rangeOfPeriod( query.period, query.date );
		const countryInfo = get( data, [ 'country-info' ], {} );

		// the API response object shape depends on if this is a summary request or not
		const dataPath = query.summarize ? [ 'summary', 'views' ] : [ 'days', startOf, 'views' ];

		// filter out country views that have no legitimate country data associated with them
		const countryData = filter( get( data, dataPath, [] ), ( viewData ) => {
			return countryInfo[ viewData.country_code ];
		} );

		return map( countryData, ( viewData ) => {
			const country = countryInfo[ viewData.country_code ];
			const icon = country.flat_flag_icon.match( /grey\.png/ ) ? null : country.flat_flag_icon;

			// ’ in country names causes google's geo viz to break
			return {
				label: country.country_full.replace( /’/, "'" ),
				value: viewData.views,
				region: country.map_region,
				icon: icon
			};
		} );
	},

	/**
	 * Returns a normalized statsPublicize array, ready for use in stats-module
	 *
	 * @param  {Object} data Stats data
	 * @return {Array}       Parsed publicize data array
	 */
	statsPublicize( data = {} ) {
		if ( ! data || ! data.services ) {
			return [];
		}

		return data.services.map( ( service ) => {
			const { label, icon } = PUBLICIZE_SERVICES_LABEL_ICON[ service.service ];
			return { label, icon, value: service.followers };
		} );
	},

	/**
	 * Returns a normalized statsVideoPlays array, ready for use in stats-module
	 *
	 * @param  {Object} data    Stats data
	 * @param  {Object} query   Stats query
	 * @param  {Int}    siteId  Site ID
	 * @param  {Obejct} site    Site object
	 * @return {Array}          Normalized stats data
	 */
	statsVideoPlays( data, query = {}, siteId, site ) {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}
		const { startOf } = rangeOfPeriod( query.period, query.date );
		const videoPlaysData = get( data, [ 'days', startOf, 'plays' ], [] );

		return videoPlaysData.map( ( item ) => {
			const detailPage = site ? `/stats/${ query.period }/videodetails/${ site.slug }?post=${ item.post_id }` : null;
			return {
				label: item.title,
				page: detailPage,
				value: item.plays,
				actions: [ {
					type: 'link',
					data: item.url
				} ]
			};
		} );
	},

	/**
	 * Returns a normalized statsVideo array, ready for use in stats-module
	 *
	 * @param  {Object} payload Stats response payload
	 * @return {Array}          Parsed data array
	 */
	statsVideo( payload ) {
		if ( ! payload || ! payload.data ) {
			return [];
		}

		return payload.data.map( item => {
			return { period: item[ 0 ], value: item[ 1 ] };
		} ).slice( Math.max( payload.data.length - 10, 1 ) );
	},

	/**
	 * Returns a normalized statsTopAuthors array, ready for use in stats-module
	 *
	 * @param  {Object} data   Stats data
	 * @param  {Object} query  Stats query
	 * @param  {Int}    siteId Site ID
	 * @param  {Object} site   Site Object
	 * @return {Array}       Normalized stats data
	 */
	statsTopAuthors( data, query = {}, siteId, site ) {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}
		const { startOf } = rangeOfPeriod( query.period, query.date );
		const authorsData = get( data, [ 'days', startOf, 'authors' ], [] );

		return authorsData.map( ( item ) => {
			const record = {
				label: item.name,
				iconClassName: 'avatar-user',
				icon: parseAvatar( item.avatar ),
				children: null,
				value: item.views,
				className: 'module-content-list-item-large'
			};

			if ( item.posts && item.posts.length > 0 ) {
				record.children = item.posts.map( ( child ) => {
					return {
						label: child.title,
						value: child.views,
						page: site ? '/stats/post/' + child.id + '/' + site.slug : null,
						actions: [ {
							type: 'link',
							data: child.url
						} ],
						children: null
					};
				} );
			}

			return record;
		} );
	},

	/**
	 * Returns a normalized statsTags array, ready for use in stats-module
	 *
	 * @param  {Object} data Stats data
	 * @return {Array}       Parsed data array
	 */
	statsTags( data ) {
		if ( ! data || ! data.tags ) {
			return [];
		}

		const getTagTypeIcon = ( type ) => {
			return type === 'category' ? 'folder' : type;
		};

		return data.tags.map( ( item ) => {
			let children;
			const hasChildren = item.tags.length > 1;
			const labels = item.tags.map( ( tagItem ) => {
				return {
					label: tagItem.name,
					labelIcon: getTagTypeIcon( tagItem.type ),
					link: hasChildren ? null : tagItem.link
				};
			} );

			if ( hasChildren ) {
				children = item.tags.map( ( tagItem ) => {
					return {
						label: tagItem.name,
						labelIcon: getTagTypeIcon( tagItem.type ),
						value: null,
						children: null,
						link: tagItem.link
					};
				} );
			}

			return {
				label: labels,
				link: labels.length > 1 ? null : labels[ 0 ].link,
				value: item.views,
				children: children
			};
		} );
	},

	/*
	 * Returns a normalized statsClicks array, ready for use in stats-module
	 *
	 * @param  {Object} data   Stats data
	 * @param  {Object} query  Stats query
	 * @return {Array}        Parsed data array
	 */
	statsClicks( data, query ) {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}

		const { startOf } = rangeOfPeriod( query.period, query.date );
		const statsData = get( data, [ 'days', startOf, 'clicks' ], [] );

		return statsData.map( ( item ) => {
			const hasChildren = item.children && item.children.length > 0;
			const newRecord = {
				label: item.name,
				value: item.views,
				children: null,
				link: item.url,
				icon: item.icon,
				labelIcon: hasChildren ? null : 'external'
			};

			if ( item.children ) {
				newRecord.children = item.children.map( ( child ) => {
					return {
						label: child.name,
						value: child.views,
						children: null,
						link: child.url,
						labelIcon: 'external'
					};
				} );
			}

			return newRecord;
		} );
	},

	/*
	 * Returns a normalized statsReferrers array, ready for use in stats-module
	 *
	 * @param  {Object} data   Stats data
	 * @param  {Object} query  Stats query
	 * @param  {Int}    siteId Site ID
	 * @return {Array}         Parsed data array
	 */
	statsReferrers( data, query, siteId ) {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}

		const { startOf } = rangeOfPeriod( query.period, query.date );
		const statsData = get( data, [ 'days', startOf, 'groups' ], [] );

		const parseItem = ( item ) => {
			let children;
			if ( item.children && item.children.length > 0 ) {
				children = item.children.map( parseItem );
			}

			const record = {
				label: item.name,
				value: item.views,
				link: item.url,
				labelIcon: children ? null : 'external',
				children
			};

			if ( item.icon ) {
				record.icon = item.icon;
			}

			return record;
		};

		return statsData.map( ( item ) => {
			let actions = [];
			if (
				( item.url && -1 !== item.url.indexOf( item.name ) ) ||
				( ! item.url && item.name === item.group && -1 !== item.name.indexOf( '.' ) )
			) {
				actions = [ {
					type: 'spam',
					data: {
						siteID: siteId,
						domain: item.name
					}
				} ];
			}

			return {
				...parseItem( { ...item, children: item.results, views: item.total } ),
				actions,
				actionMenu: actions.length
			};
		} );
	},

	/*
	 * Returns a normalized statsSearchTerms array, ready for use in stats-module
	 *
	 * @param  {Object} data   Stats data
	 * @param  {Object} query  Stats query
	 * @return {Array}         Parsed data array
	 */
	statsSearchTerms( data, query ) {
		if ( ! data || ! query.period || ! query.date ) {
			return [];
		}

		const { startOf } = rangeOfPeriod( query.period, query.date );
		const searchTerms = get( data, [ 'days', startOf, 'search_terms' ], [] );
		const encryptedSearchTerms = get( data, [ 'days', startOf, 'encrypted_search_terms' ], false );

		const result = searchTerms.map( ( day ) => {
			return {
				label: day.term,
				className: 'user-selectable',
				value: day.views
			};
		} );

		if ( encryptedSearchTerms ) {
			result.push( {
				label: translate( 'Unknown Search Terms' ),
				value: encryptedSearchTerms,
				link: 'http://en.support.wordpress.com/stats/#search-engine-terms',
				labelIcon: 'external'
			} );
		}

		return result;
	}
};
