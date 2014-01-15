define(
	'spell/system/visibility',
	[
		'spell/client/util/createEffectiveCameraDimensions',
		'spell/Defines',
		'spell/math/vec2',

		'spell/functions'
	],
	function(
		createEffectiveCameraDimensions,
		Defines,
		vec2,

		_
	) {
		'use strict'


		var init = function( spell ) {
			var eventManager = this.eventManager

			this.screenResizeHandler = _.bind(
				function( size ) {
					this.screenSize = size
				},
				this
			)

			eventManager.subscribe( eventManager.EVENT.SCREEN_RESIZE, this.screenResizeHandler )


			this.cameraChangedHandler = _.bind(
				function( camera, entityId ) {
					this.currentCameraId = camera.active ? entityId : undefined
				},
				this
			)

			eventManager.subscribe( [ eventManager.EVENT.COMPONENT_CREATED, Defines.CAMERA_COMPONENT_ID ], this.cameraChangedHandler )
			eventManager.subscribe( [ eventManager.EVENT.COMPONENT_UPDATED, Defines.CAMERA_COMPONENT_ID ], this.cameraChangedHandler )


			this.visualObjectCreatedHandler = _.bind(
				function( entityId, entity ) {
					var visualObject = entity[ Defines.VISUAL_OBJECT_COMPONENT_ID ]

					if( !visualObject ||
						visualObject.pass === 'world' ) {

						return
					}

					var compositeComponent = entity[ Defines.COMPOSITE_COMPONENT_ID ]

					var entityInfo = {
						children : compositeComponent.childrenIds,
						layer : visualObject.layer,
						id : entityId,
						parent : compositeComponent.parentId
					}

					if( visualObject.pass === 'ui' ) {
						this.uiPassEntities[ entityId ] = entityInfo

					} else if( visualObject.pass === 'background' ) {
						this.backgroundPassEntities[ entityId ] = entityInfo
					}
				},
				this
			)

			eventManager.subscribe( [ eventManager.EVENT.ENTITY_CREATED, Defines.VISUAL_OBJECT_COMPONENT_ID ], this.visualObjectCreatedHandler )
		}

		var destroy = function( spell ) {
			var eventManager = this.eventManager

			eventManager.unsubscribe( eventManager.EVENT.SCREEN_RESIZE, this.screenResizeHandler )
			eventManager.unsubscribe( [ eventManager.EVENT.COMPONENT_CREATED, Defines.CAMERA_COMPONENT_ID ], this.cameraChangedHandler )
			eventManager.unsubscribe( [ eventManager.EVENT.COMPONENT_UPDATED, Defines.CAMERA_COMPONENT_ID ], this.cameraChangedHandler )
			eventManager.unsubscribe( [ eventManager.EVENT.ENTITY_CREATED, Defines.VISUAL_OBJECT_COMPONENT_ID ], this.visualObjectCreatedHandler )
		}


		var process = function( spell, timeInMs, deltaTimeInMs ) {
			var currentCameraId = this.currentCameraId,
				camera          = this.cameras[ currentCameraId ],
				transform       = this.transforms[ currentCameraId ]

			if( !camera || !transform ) {
				return
			}

			var screenSize                = this.screenSize,
				aspectRatio               = screenSize[ 0 ] / screenSize[ 1 ],
				effectiveCameraDimensions = createEffectiveCameraDimensions( camera.width, camera.height, transform.scale, aspectRatio )

			spell.worldPassEntities = spell.entityManager.getEntityIdsByRegion( transform.translation, effectiveCameraDimensions )
			spell.uiPassEntities = this.uiPassEntities
			spell.backgroundPassEntities = this.backgroundPassEntities
		}

		/**
		 * Determines which entities' bounds are currently intersected or contained by the view frustum defined by the
		 * currently active camera. The result of the computation is stored in the spell object in order to make it
		 * available as input for other systems.
		 *
		 * @param spell
		 * @constructor
		 */
		var Visibility = function( spell ) {
			this.configurationManager       = spell.configurationManager
			this.eventManager               = spell.eventManager
			this.screenSize                 = spell.configurationManager.getValue( 'currentScreenSize' )
			this.currentCameraId            = undefined
			this.screenResizeHandler        = undefined
			this.cameraChangedHandler       = undefined
			this.visualObjectCreatedHandler = undefined
			this.uiPassEntities             = {}
			this.backgroundPassEntities     = {}
		}

		Visibility.prototype = {
			init : init,
			destroy : destroy,
			activate : function( spell ) {},
			deactivate : function( spell ) {},
			process : process
		}

		return Visibility
	}
)
