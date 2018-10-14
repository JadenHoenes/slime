/**
 * Player Entity
 */
game.PlayerEntity = me.Entity.extend({

    /**
     * constructor
     */
    init:function (x, y, settings) {
        // call the constructor
        this._super(me.Entity, 'init', [x, y , settings]);
        this.body.setVelocity(3,19);
        me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
        this.alwaysUpdate = true;
        this.renderable.addAnimation("walk", [0,1,2,3,4,5,6,7]);
        this.renderable.addAnimation("stand", [0]);
        this.renderable.setCurrentAnimation("stand");
    },

    /**
     * update the entity
     */
    update : function (dt) {
        if(me.input.isKeyPressed('left'))
        {
            this.renderable.flipX(true);
            this.body.vel.x -= this.body.accel.x*me.timer.tick;
            if(!this.renderable.isCurrentAnimation("walk"))
            {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else if(me.input.isKeyPressed('right'))
        {
            this.renderable.flipX(false);
            this.body.vel.x += this.body.accel.x*me.timer.tick;
            if(!this.renderable.isCurrentAnimation("walk"))
            {
                this.renderable.setCurrentAnimation("walk");
            }
        }
        else
        {
            this.body.vel.x = 0;
            this.renderable.setCurrentAnimation("stand");
        }
        
        if(me.input.isKeyPressed('jump'))
        {
            if(!this.body.jumping && !this.body.falling)
            {
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;
                this.body.jumping = true;
                me.audio.play('jump');
            }
        }
        
        // apply physics to the body (this moves the entity)
        this.body.update(dt);

        // handle collisions against other shapes
        me.collision.check(this);

        // return true if we moved or if the renderable was updated
        return (this._super(me.Entity, 'update', [dt]) || this.body.vel.x !== 0 || this.body.vel.y !== 0);
    },

   /**
     * colision handler
     * (called when colliding with other objects)
     */
    onCollision : function (response, other) {
        switch (response.b.body.collisionType) {
            case me.collision.types.WORLD_SHAPE:
              // Simulate a platform object
              if (other.type === "platform") {
                if (this.body.falling &&
                  !me.input.isKeyPressed('down') &&

                  // Shortest overlap would move the player upward
                  (response.overlapV.y > 0) &&

                  // The velocity is reasonably fast enough to have penetrated to the overlap depth
                  (~~this.body.vel.y >= ~~response.overlapV.y)
                ) {
                  // Disable collision on the x axis
                  response.overlapV.x = 0;

                  // Repond to the platform (it is solid)
                  return true;
                }

                // Do not respond to the platform (pass through)
                return false;
              }
              break;

            case me.collision.types.ENEMY_OBJECT:
              if ((response.overlapV.y>0) && !this.body.jumping) {
                // bounce (force jump)
                this.body.falling = false;
                this.body.vel.y = -this.body.maxVel.y * me.timer.tick;

                // set the jumping flag
                this.body.jumping = true;
                  
                me.audio.play('stomp');
              }
              else {
                // let's flicker in case we touched an enemy
                this.renderable.flicker(750);
              }

              // Fall through

            default:
              // Do not respond to other objects (e.g. coins)
              return false;
          }

          // Make the object solid
          return true;
        }
    
});

/**
 * Coin Entity
 */
game.CoinEntity = me.CollectableEntity.extend({
    
    init : function (x,y,settings) {
        this._super(me.CollectableEntity, 'init', [x,y,settings]);
    },
    
    onCollision : function (response, other) {
        me.audio.play('cling');
        game.data.score += 250;
        this.body.setCollisionMask(me.collision.types.NO_OBJECT);
        me.game.world.removeChild(this);
        
        return false;
    }
});

/**
 * Enemy Entity
 */
game.EnemyEntity = me.Entity.extend ({
    init:function(x,y,settings)
    {
        settings.image="wheelie_right";
        var width = settings.width;
        var height = settings.height;
        
        settings.framewidth = settings.width = 64;
        settings.frameheight = settings.height = 64;
        
        settings.shapes[0] = new me.Rect(0,0,settings.framewidth,settings.frameheight);
        
        this._super(me.Entity, 'init', [x,y,settings]);
        
        x= this.pos.x;
        this.startX = x;
        this.endX = x+width-settings.framewidth;
        this.pos.x = x+width-settings.framewidth;
        
        this.walkLeft = false;
        this.body.setVelocity(4,6);
    },
    
    update : function (dt)
    {
        if (this.alive) {
            if(this.walkLeft && this.pos.x <= this.startX) {
                this.walkLeft = false;
            }
            else if(!this.walkLeft && this.pos.x >= this.endX) {
                this.walkLeft = true;
            }
            this.renderable.flipX(this.walkLeft);
            this.body.vel.x += (this.walkLeft) ? -this.body.accel.x*me.timer.tick : this.body.accel.x*me.timer.tick;
        }
        else {
            this.body.vel.x = 0;
        }
        
        this.body.update(dt);
        
        me.collision.check(this);
        
        return (this._super(me.Entity, 'update', [dt])||this.body.vel.x!==0||this.body.vel.y!==0);
            
    },
    
    onCollision : function (response, other) {
        if(response.b.body.collisionType !== me.collision.types.WORLD_SHAPE) {
            if(this.alive && (response.overlapV.y > 0) && response.a.body.falling) {
                this.renderable.flicker(750);
            }
            return false;
        }
        return true;
    }
});