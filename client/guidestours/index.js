/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import Button from 'components/button';
import { getSelectedSite, getGuidesTourState } from 'state/ui/selectors';
import { nextGuidesTourStep } from 'state/ui/actions';

// Magic numbers make me sad
const BULLSEYE_RADIUS = 6;
const DIALOG_WIDTH = 400;
const DIALOG_PADDING = 10;
const MASTERBAR_HEIGHT = 48;

const query = selector =>
	[].slice.call( global.window.document.querySelectorAll( selector ) );

const posToCss = ( { x, y } ) => ( {
	top: y ? y + 'px' : undefined,
	left: x ? x + 'px' : undefined,
} );

const middle = ( a, b ) => Math.abs( b - a ) / 2;

const dialogPositioners = {
	below: ( { left, bottom } ) => ( { x: left + DIALOG_PADDING, y: bottom + DIALOG_PADDING } ),
	beside: ( { right, top } ) => ( { x: right + DIALOG_PADDING, y: top + DIALOG_PADDING } ),
	center: ( { left, right } ) => ( {
		x: middle( left, right ) - DIALOG_WIDTH / 2,
		y: MASTERBAR_HEIGHT / 2,
	} ),
};

const bullseyePositioners = {
	below: ( { left, right, bottom } ) => ( {
		x: left + middle( left, right ) - BULLSEYE_RADIUS,
		y: bottom - BULLSEYE_RADIUS * 1.5,
	} ),

	beside: ( { top, bottom, right } ) => ( {
		x: right - BULLSEYE_RADIUS * 1.5,
		y: top + middle( top, bottom ) - BULLSEYE_RADIUS,
	} ),

	center: () => ( {} ),
};

class GuidesStep extends Component {
	componentDidMount() {
		this.addTargetListener();
	}

	componentWillUnmount() {
		this.removeTargetListener();
	}

	componentWillUpdate() {
		this.removeTargetListener();
	}

	componentDidUpdate() {
		this.addTargetListener();
	}

	addTargetListener() {
		const { target = false, onNext, type } = this.props;
		if ( type === 'bullseye' && onNext && target.addEventListener ) {
			target.addEventListener( 'click', onNext );
		}
	}

	removeTargetListener() {
		const { target = false, onNext, type } = this.props;
		if ( type === 'bullseye' && onNext && target.removeEventListener ) {
			target.removeEventListener( 'click', onNext );
		}
	}

	render() {
		const { text, type, style, onNext, onQuit } = this.props;
		return (
			<Card className="guidestours__step" style={ style } >
				<p>{ text }</p>
				{ type !== 'bullseye' &&
					<Button onClick={ onNext } primary>Next</Button>
				}
				<Button onClick={ onQuit } secondary>Skip all</Button>
			</Card>
		);
	}
}

GuidesStep.propTypes = {
	target: PropTypes.object,
	type: PropTypes.string,
	text: PropTypes.string,
	placement: PropTypes.string,
	next: PropTypes.string,
	style: PropTypes.object,
	onNext: PropTypes.func.isRequired,
	onQuit: PropTypes.func.isRequired,
};

class GuidesPointer extends Component {
	render() {
		return (
			<div className="guidestours__pointer" style={ this.props.style }>
				<div className="guidestours__pointer__ring" />
				<div className="guidestours__pointer__center" />
			</div>
		);
	}
}

GuidesPointer.propTypes = {
	style: PropTypes.object.isRequired,
};

export default class GuidesTours extends Component {
	constructor() {
		super();
		this.bind( 'next', 'quit' );
	}

	bind( ...methods ) {
		methods.forEach( m => this[ m ] = this[ m ].bind( this ) );
	}

	componentDidMount() {
		const { stepConfig } = this.props.tourState;
		this.tipTargets = this.getTipTargets();
		this.updateTarget( stepConfig );
	}

	componentWillUpdate( nextProps ) {
		const { stepConfig } = nextProps.tourState;
		this.updateTarget( stepConfig );
	}

	updateTarget( step ) {
		this.currentTarget = step && step.target
			? this.tipTargets[ step.target ]
			: null;
	}

	getTipTargets() {
		const tipTargetDomNodes = query( '[data-tip-target]' );
		return tipTargetDomNodes.reduce( ( tipTargets, node ) => Object.assign( tipTargets, {
			[ node.getAttribute( 'data-tip-target' ) ]: node
		} ), {} );
	}

	getStepPositions() {
		let coords = { bullseye: {}, dialog: {} };

		const { stepConfig } = this.props.tourState;
		const { bullseye = true, placement = 'center' } = stepConfig;
		const rect = this.currentTarget
			? this.currentTarget.getBoundingClientRect()
			: global.window.document.body.getBoundingClientRect();

		if ( bullseye ) {
			coords.bullseye = bullseyePositioners[ placement ]( rect );
		}

		coords.dialog = dialogPositioners[ placement ]( rect )
		return coords;
	}

	next() {
		const nextStepName = this.props.tourState.stepConfig.next;
		this.props.nextGuidesTourStep( nextStepName );
	}

	quit() {
		this.props.nextGuidesTourStep( null );
	}

	render() {
		const { stepConfig } = this.props.tourState;

		if ( ! stepConfig ) {
			return null;
		}

		const { bullseye, dialog } = this.getStepPositions();
		const stepCoords = posToCss( dialog );
		const pointerCoords = posToCss( bullseye );

		return (
			<div className="guidestours">
				<GuidesStep
						{ ...stepConfig }
						key={ stepConfig.target }
						target={ this.currentTarget }
						style={ stepCoords }
						onNext={ this.next }
						onQuit={ this.quit } />
				{ stepConfig.type === 'bullseye' &&
					<GuidesPointer style={ pointerCoords } />
				}
			</div>
		);
	}
}

export default connect( ( state ) => ( {
	selectedSite: getSelectedSite( state ),
	tourState: getGuidesTourState( state ),
} ), {
	nextGuidesTourStep,
} )( GuidesTours );
