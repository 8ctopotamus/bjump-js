import Carrot from '../game/Carrot.js'
import Phaser from '../lib/phaser.js'
// import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene 
{
  carrotsCollected = 0
  /** @type {Phaser.GameObjects.Text} */
  carrotsCollectedText
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

    this.physics.add.overlap(
      this.player,
      this.carrots,
      this.handleCollectCarrot,
      undefined,
      this
    )

    const style = { color: '#000', fontSize: 24 }
    this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style)
      .setScrollFactor(0)
      .setOrigin(0.5, 0)
  }

  update() {
    // recycle platforms
    this.platforms.children.iterate(platform => {
      const scrollY = this.cameras.main.scrollY
      if (platform.y >= scrollY + 700) {
        platform.y = scrollY - Phaser.Math.Between(50, 100)
        platform.body.updateFromGameObject()
        // create a carrot above the platform being reused
        this.addCarrotAbove(platform)
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

    // check for gameover
    const bottomPlatform = this.findBottomMostPlatform()
    if (this.player.y > bottomPlatform.y + 200) {
      console.log('Game over')
    }
  }

  /** 
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  horizontalWrap(sprite) {
    const halfWidth = sprite.displayWidth * 0.5
    const gameWidth = this.scale.width
    if (sprite.x < -halfWidth) {
      sprite.x = gameWidth + halfWidth
    } else if (sprite.x > gameWidth + halfWidth) {
      sprite.x = -halfWidth
    }
  }

  /**
   * @param {Phaser.GameObjects.Sprite} sprite
   */
  addCarrotAbove(sprite) {
    const y = sprite.y - sprite.displayHeight
    /** @type {Phaser.Phsyics.Arcade.Sprite} */
    const carrot = this.carrots.get(sprite.x, y, 'carrot')
    carrot.setActive(true)
    carrot.setVisible(true)
    this.add.existing(carrot)
    // update the phsyics body size
    carrot.body.setSize(carrot.width, carrot.height)
    // make sure body is enabled in the physics world
    this.physics.world.enable(carrot)
    return carrot
  }

  /**
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @param {Carrot} carrot
   */
  handleCollectCarrot(player, carrot) {
    // hide from display
    this.carrots.killAndHide(carrot)
    // disable from physics world
    this.physics.world.disableBody(carrot.body)
    // increment score
    this.carrotsCollected++
    // update the text
    this.carrotsCollectedText.text = `Carrots: ${this.carrotsCollected}`
  }

  findBottomMostPlatform() {
    const platforms = this.platforms.getChildren()
    let bottomPlatform = platforms[0]
    for (let i = 1; i < platforms.length; ++i) {
      const platform = platforms[i]
      // discard any platforms that are above the current
      if (platform.y < bottomPlatform.y) continue
      bottomPlatform = platform
    }
    return bottomPlatform
  }
}