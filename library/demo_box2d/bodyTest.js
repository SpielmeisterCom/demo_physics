/**
 * @class demo_box2d.bodyTest
 * @singleton
 */

define(
	'demo_box2d/bodyTest',
	[
		'spell/functions'
	],
	function(
		_
	) {
		'use strict'


		var removeCrate = function( entityManager ) {
			var components = entityManager.getComponentMapById( 'spell.component.physics.body' )

			if( _.size( components ) === 0 ) return

			var id = _.find(
				_.keys( components ),
				function( id ) {
					var entityMetaData = entityManager.getComponentById( id, 'spell.component.entityMetaData' )

					return entityMetaData.name === ''
				}
			)

			if( !id ) return

			entityManager.removeEntity( id )
		}

		/**
		 * Creates an instance of the system.
		 *
		 * @constructor
		 * @param {Object} [spell] The spell object.
		 */
		var BodyTest = function( spell ) {}

		BodyTest.prototype = {
			/**
		 	 * Gets called when the system is created.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			init: function( spell ) {

			},

			/**
		 	 * Gets called when the system is destroyed.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			destroy: function( spell ) {

			},

			/**
		 	 * Gets called when the system is activated.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			activate: function( spell ) {
				// registering for specific input events with inputManager.addListener
				var processKeyDown = this.processKeyDown = function( event ) {
					var keyCode = event.keyCode
					
					if( keyCode === spell.inputManager.KEY.RIGHT_ARROW ) {
						removeCrate( spell.entityManager )
						
					} else if( keyCode === spell.inputManager.KEY.V ) {
						spell.audioContext.play( spell.assetManager.get( 'sound:demo_box2d.voiceSample' ).resource )
					}
				}

				spell.inputManager.addListener( 'keyDown', processKeyDown )


				var processPointerDown = this.processPointerDown = function( event ) {
					var worldPosition = spell.renderingContext.transformScreenToWorld( event.position )

					spell.entityManager.createEntity( {
						entityTemplateId : 'demo_box2d.smallCrate',
						config : {
							"spell.component.2d.transform" : {
								translation : worldPosition
							}
						}
					} )
				}

				spell.inputManager.addListener( 'pointerDown', processPointerDown )
			},

			/**
		 	 * Gets called when the system is deactivated.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			deactivate: function( spell ) {
				spell.inputManager.removeListener( 'keyDown', this.processKeyDown )
				spell.inputManager.removeListener( 'pointerDown', this.processPointerDown )
			},

			/**
		 	 * Gets called to trigger the processing of game state.
		 	 *
			 * @param {Object} [spell] The spell object.
			 * @param {Object} [timeInMs] The current time in ms.
			 * @param {Object} [deltaTimeInMs] The elapsed time in ms.
			 */
			process: function( spell, timeInMs, deltaTimeInMs ) {
				var inputManager = spell.inputManager

				// polling for a UP_ARROW key down on every process call
				if( inputManager.isKeyPressed( inputManager.KEY.UP_ARROW ) ) {
					var id = spell.entityManager.getEntityIdsByName( 'player' )[ 0 ]

					if( id ) {
						spell.physicsManager.applyImpulse( id, [ 0, 250 ] )
					}
				}
			}
		}

		return BodyTest
	}
)
