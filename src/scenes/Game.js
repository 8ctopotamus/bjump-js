import Carrot from '../game/Carrot.js'
import Phaser from '../lib/phaser.js'
// import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene 
{
  /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
  cursors
  /** @type {Phaser.Physics.Arcade.Group} */
  carrots

  constructor() {
    super('game')
  }

  preload() {
    this.load.image('background', 'assets/bg_layer1.png')
    this.load.image('platform', 'assets/ground_grass.png')
    this.load.image('bunny-stand', 'assets/bunny1_stand.png')
    this.load.image('carrot', 'assets/carrot.png')
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  create() {
    this.add.image(240, 320, 'background')
      .setScrollFactor(1, 0)

    // platforms
    this.platforms = this.physics.add.staticGroup()

    for (let i = 0; i < 5; ++i) {
      const x = Phaser.Math.Between(80, 400)
      const y = 150 * i
      /** @type {Phaser.Physics.Arcade.Sprite} */
      const platform = this.platforms.create(x, y, 'platform')
      platform.scale = 0.5
      /** @type {Phaser.Physics.Arcade.StaticBody} */
      const body = platform.body
      body.updateFromGameObject()
    }

    // player
    this.player = this.physics.add.sprite(240, 320, 'bunny-stand').setScale(0.5)
    this.player.body.checkCollision.up = false
    this.player.body.checkCollision.left = false
    this.player.body.checkCollision.right = false

    this.cameras.main.startFollow(this.player)

    // set horizontal dead zone to 1.5x game width
    this.cameras.main.setDeadzone(this.scale.width * 1.5)

    this.physics.add.collider(this.platforms, this.player)

    // create a carrot
    this.carrots = this.physics.add.group({
      classType: Carrot
    })
    this.carrots.get(240, 320, 'carrot')
    
    this.physics.add.collider(this.platforms, this.carrots)
  }

  update() {
    // recycle platforms
    this.platforms.children.iterate(platform => {
      const scrollY = this.cameras.main.scrollY
      if (platform.y >= scrollY + 700) {
        platform.y = scrollY - Phaser.Math.Between(50, 100)
        platform.body.updateFromGameObject()
      }
    })

    // jump
    const touchingDown = this.player.body.touching.down
    if (touchingDown) {
      this.player.body.setVelocityY(-300)
    }

    // left/right
    if (this.cursors.left.isDown && !touchingDown) {
      this.player.setVelocityX(-200)
    } else if (this.cursors.right.isDown && !touchingDown) {
      this.player.setVelocityX(200)
    } else {
      this.player.setVelocityX(0)
    }

    this.horizontalWrap(this.player)
  }

  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5
    const gameWidth = this.scale.width

  }
}