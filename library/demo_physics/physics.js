/**
 * @class demo_physics.physics
 * @singleton
 */

define(
	'demo_physics/physics',
    [
        'spell/Defines',
        'spell/math/util',
        'spell/shared/util/platform/PlatformKit',

        'spell/functions'
    ],
    function(
        Defines,
        mathUtil,
        PlatformKit,

        _
        ) {
        'use strict'


        //TODO: check if the boxtree can be removed, instead use our quadtree http://docs.turbulenz.com/jslibrary_api/broadphase_api.html#broadphase
        var Physics = PlatformKit.Physics
		
		/**
		 * Creates an instance of the system.
		 *
		 * @constructor
		 * @param {Object} [spell] The spell object.
		 */
		var physics = function( spell ) {
            this.entityCreatedHandler
            this.entityDestroyHandler
			this.world
            this.removedEntitiesQueue = []
		}

        var triggerContactEntityEvent = function( entityManager, eventId, entityIdA, shape, params ) {
            var entityIdB = shape.body.userData

            entityManager.triggerEvent( entityIdA, eventId, [ entityIdB ].concat( params ) )
            //TODO: check if we need to generate events for the other entity also
//            entityManager.triggerEvent( entityIdB, eventId, [ entityIdA ].join( params ) )
        }

        var createContactListener = function( entityManager, entityId, shape, contactTrigger ) {
            shape.addEventListener(
                'begin', function( arbiter, otherShape ) {
                    triggerContactEntityEvent( entityManager, 'onBeginContact', entityId, otherShape )

                    if( contactTrigger ) {
                        triggerContactEntityEvent( entityManager, contactTrigger.eventId, entityId, otherShape, contactTrigger.parameters.split(',') )
                    }
                }
            )

            shape.addEventListener(
                'end', function( arbiter, otherShape ) {
                    triggerContactEntityEvent( entityManager, 'onEndContact', entityId, otherShape )
                }
            )

            shape.addEventListener(
                'preSolve', function( arbiter, otherShape ) {
                    triggerContactEntityEvent( entityManager, 'preSolve', entityId, otherShape, [ arbiter ] )
                }
            )

            shape.addEventListener(
                'progress', function( arbiter, otherShape ) {
                    triggerContactEntityEvent( entityManager, 'progress', entityId, otherShape )
                }
            )
        }

        var createBody = function( entityManager, world, entityId, entity ) {
            var body               = entity[ Defines.PHYSICS_BODY_COMPONENT_ID ],
                fixture            = entity[ Defines.PHYSICS_FIXTURE_COMPONENT_ID ],
                boxShape           = entity[ Defines.PHYSICS_BOX_SHAPE_COMPONENT_ID ],
                circleShape        = entity[ Defines.PHYSICS_CIRCLE_SHAPE_COMPONENT_ID ],
                convexPolygonShape = entity[ Defines.PHYSICS_CONVEX_POLYGON_SHAPE_COMPONENT_ID ],
                transform          = entity[ Defines.TRANSFORM_COMPONENT_ID ],
                contactTrigger     = entity[ Defines.PHYSICS_CONTACT_TRIGGER_COMPONENT_ID ]

            if( !body || !fixture || !transform ||
                ( !boxShape && !circleShape && !convexPolygonShape ) ) {

                return
            }

            var shapeDef = {
                material : Physics.createMaterial({
//                elasticity : 0,
//                staticFriction : 6,
                    dynamicFriction : fixture.friction,
//                rollingFriction : 0.001,
                    density: fixture.density
                }),
                group: fixture.categoryBits,
                mask: fixture.maskBits,
                sensor: fixture.isSensor
            }

            if( circleShape ) {
                shapeDef.radius = circleShape.radius
                var shape = Physics.createCircleShape( shapeDef )

            } else {
                shapeDef.vertices = boxShape ? Physics.createBoxVertices(
                                        boxShape.dimensions[ 0 ],
                                        boxShape.dimensions[ 1 ]
                                    ): [ convexPolygonShape.vertices ]

                var shape = Physics.createPolygonShape( shapeDef )
            }

            createContactListener( entityManager, entityId, shape, contactTrigger )

            world.createBodyDef( entityId, body, [ shape ], transform )
        }


        var destroyBodies = function( world, entityIds ) {
            for( var i = 0, numEntityIds = entityIds.length; i < numEntityIds; i++ ) {
                world.destroyBody( entityIds[ i ] )
            }
        }

        var incrementState = function( entityManager, rigidBodies, bodies, transforms ) {
            var length = rigidBodies.length

            for( var i = 0; i < length; i++ ) {
                var body = rigidBodies[i]

                if( body.isStatic() || body.sleeping ) {
                    continue
                }

                var id = body.userData
                if( !id ) continue

                // transfering state to components
                var position  = body.getPosition(),
                    transform = transforms[ id ]

                if( !transform || ( !position[0] || !position[1] ) ) continue

                transform.translation[ 0 ] = position[0]
                transform.translation[ 1 ] = position[1]
                transform.rotation = body.getRotation()

                entityManager.updateWorldTransform( id )
            }
        }

		physics.prototype = {
			/**
		 	 * Gets called when the system is created.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			init: function( spell ) {
                this.world = spell.physicsWorlds.main

                if( !this.world ) {
                    var world = spell.physicsContext.createWorld( this.config.gravity, this.config.scale )

                    this.world = world
                    spell.physicsWorlds.main = world
                }

                this.entityCreatedHandler = _.bind( createBody, null, spell.entityManager, this.world )
                this.entityDestroyHandler = _.bind( this.removedEntitiesQueue.push, this.removedEntitiesQueue )

                var eventManager = spell.eventManager

                eventManager.subscribe( eventManager.EVENT.ENTITY_CREATED, this.entityCreatedHandler )
                eventManager.subscribe( eventManager.EVENT.ENTITY_REMOVED, this.entityDestroyHandler )
			},

			/**
		 	 * Gets called when the system is destroyed.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			destroy: function( spell ) {
                var eventManager = spell.eventManager

                eventManager.unsubscribe( eventManager.EVENT.ENTITY_CREATED, this.entityCreatedHandler )
                eventManager.unsubscribe( eventManager.EVENT.ENTITY_REMOVED, this.entityDestroyHandler )
			},
		
			/**
		 	 * Gets called when the system is activated.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			activate: function( spell ) {
				
			},
		
			/**
		 	 * Gets called when the system is deactivated.
		 	 *
		 	 * @param {Object} [spell] The spell object.
			 */
			deactivate: function( spell ) {
				
			},
		
			/**
		 	 * Gets called to trigger the processing of game state.
		 	 *
			 * @param {Object} [spell] The spell object.
			 * @param {Object} [timeInMs] The current time in ms.
			 * @param {Object} [deltaTimeInMs] The elapsed time in ms.
			 */
			process: function( spell, timeInMs, deltaTimeInMs ) {
                var world                = this.world,
                    transforms           = this.transforms,
                    removedEntitiesQueue = this.removedEntitiesQueue

                if( removedEntitiesQueue.length ) {
                    destroyBodies( world, removedEntitiesQueue )
                    removedEntitiesQueue.length = 0
                }

                world.step( deltaTimeInMs )

                incrementState( spell.entityManager, world.getAllBodies(), this.bodies, transforms )
			}
		}
		
		return physics
	}
)
