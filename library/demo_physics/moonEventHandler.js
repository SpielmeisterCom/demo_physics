define(
	'demo_physics/moonEventHandler',
	[
		'spell/functions'
	],
	function(
		_
	) {
		'use strict'
		
		
		return {
            onBeginContact: function() {
//                console.log( "Moon onBeginContact" )
            },
            onEndContact: function() {
//                console.log( "Moon onEndContact" )
            },
            preSolve: function( spell, entityId, otherEntityId, arbiter ) {

                //arbiter.setAcceptedState( false )
            },
            progress: function() {
//                console.log("Moon progress")
            },
            moonHit: function() {
//                console.log( "User defined event moonHit on contact" )
            }
        }
	}
)
