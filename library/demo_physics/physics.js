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
        var Physics2DDevice = PlatformKit.Physics,
            phys2D          = Physics2DDevice.create()
		
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

        var createBody = function( spell, world, entityId, entity ) {
            var body               = entity[ Defines.PHYSICS_BODY_COMPONENT_ID ],
                fixture            = entity[ Defines.PHYSICS_FIXTURE_COMPONENT_ID ],
                boxShape           = entity[ Defines.PHYSICS_BOX_SHAPE_COMPONENT_ID ],
                circleShape        = entity[ Defines.PHYSICS_CIRCLE_SHAPE_COMPONENT_ID ],
                convexPolygonShape = entity[ Defines.PHYSICS_CONVEX_POLYGON_SHAPE_COMPONENT_ID ],
                transform          = entity[ Defines.TRANSFORM_COMPONENT_ID ]

            if( !body || !fixture || !transform ||
                ( !boxShape && !circleShape && !convexPolygonShape ) ) {

                return
            }

            var translation = transform.translation

            var material = phys2D.createMaterial({
                elasticity : 0.9,
                staticFriction : 6,
                dynamicFriction : 4,
                rollingFriction : 0.001
            })

            if( boxShape ) {
                var shape = phys2D.createPolygonShape({
                    vertices : phys2D.createBoxVertices(
                        boxShape.dimensions[ 0 ],
                        boxShape.dimensions[ 1 ]
                    ),
                    material : material
                })

            } else if( circleShape ) {
                var shape = phys2D.createCircleShape({
                    radius: circleShape.radius,
                    material: material
                })

            } else if( convexPolygonShape ) {
                var shape = phys2D.createPolygonShape({
                    vertices : [ convexPolygonShape.vertices ],
                    material : material
                })
            }

            var physicsBody = phys2D.createRigidBody({
                type: body.type,
                velocity: body.velocity,
                shapes : [ shape.clone() ],
                position: [
                    translation[ 0 ],
                    translation[ 1 ]
                ],
                rotation: transform.rotation,
                userData: entityId
            })

            world.addRigidBody( physicsBody )
        }

        var incrementState = function( entityManager, rigidBodies, bodies, transforms ) {
            var length = rigidBodies.length,
                i      = 0

            for( i = 0; i < length; i++ ) {
                var body = rigidBodies[i]

                if( body.isStatic() ) {

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
//                transform.rotation = body.GetAngle() * 1

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
                this.world = phys2D.createWorld( {
                    gravity : this.config.gravity
                });

                this.entityCreatedHandler = _.bind( createBody, null, spell, this.world )
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
                    transforms           = this.transforms

                world.step( deltaTimeInMs / 1000 )

                incrementState( spell.entityManager, world.rigidBodies, this.bodies, transforms )
                //TODO: clear all removed entites from the physik world
			}
		}
		
		return physics
	}
)
