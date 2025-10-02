class GameEngine {
  constructor(canvas, setGameState, onGameEnd = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.setGameState = setGameState;
    this.onGameEnd = onGameEnd;
    
    // Game state
    this.running = false;
    this.animationId = null;
    
    // Player properties
    this.player = {
      x: 0,
      y: 0,
      width: 32,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      onGround: false,
      charging: false,
      chargeLevel: 0,
      maxChargeLevel: 100,
      movingLeft: false,
      movingRight: false
    };
    
    // Physics constants
    this.gravity = 0.6;
    this.jumpPowerMultiplier = 0.25;
    this.maxJumpPower = 20;
    this.chargeSpeed = 2;
    this.moveSpeed = 4;
    this.airMoveSpeed = 2;
    
    // Camera
    this.camera = { x: 0, y: 0 };
    
    // World properties
    this.worldWidth = 800;
    this.worldHeight = 3000; // Tall tower
    
    // Platforms (simplified level design)
    this.platforms = this.generatePlatforms();
    
    // Goal
    this.recyclingSymbol = {
      x: this.worldWidth / 2 - 32,
      y: 50,
      width: 64,
      height: 64
    };
    
    // Game stats
    this.currentHeight = 0;
    this.maxHeightReached = 0;
    this.gameWon = false;
    
    // Input handling
    this.keys = {};
    this.setupEventListeners();
    
    // Initialize canvas size
    this.handleResize();
    
    // Initialize player position
    this.resetPlayerPosition();
  }

  generatePlatforms() {
    const platforms = [];
    const platformWidth = 120;
    const platformHeight = 20;
    
    // Ground platform
    platforms.push({
      x: this.worldWidth / 2 - platformWidth / 2,
      y: this.worldHeight - 100,
      width: platformWidth,
      height: platformHeight,
      type: 'ground'
    });
    
    // Generate ascending platforms with gaps
    for (let i = 1; i < 30; i++) {
      const x = Math.random() * (this.worldWidth - platformWidth);
      const y = this.worldHeight - 200 - (i * 100) + (Math.random() * 40 - 20);
      
      platforms.push({
        x: x,
        y: y,
        width: platformWidth,
        height: platformHeight,
        type: 'platform'
      });
    }
    
    return platforms;
  }

  setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.startJump();
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.player.movingLeft = true;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.player.movingRight = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        e.preventDefault();
        this.releaseJump();
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.player.movingLeft = false;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.player.movingRight = false;
      }
    });
  }

  // Methods for mobile controls
  startMoveLeft() {
    this.player.movingLeft = true;
  }

  stopMoveLeft() {
    this.player.movingLeft = false;
  }

  startMoveRight() {
    this.player.movingRight = true;
  }

  stopMoveRight() {
    this.player.movingRight = false;
  }

  startJump() {
    if (this.player.onGround && !this.player.charging) {
      this.player.charging = true;
      this.player.chargeLevel = 0;
    }
  }

  releaseJump() {
    if (this.player.charging && this.player.onGround) {
      const jumpPower = (this.player.chargeLevel / this.player.maxChargeLevel) * this.maxJumpPower;
      
      // Calculate jump angle (slightly random for bag-like movement)
      const angle = -Math.PI/2 + (Math.random() * 0.4 - 0.2); // Mostly upward with slight variation
      
      this.player.velocityX = Math.cos(angle) * jumpPower * 0.7;
      this.player.velocityY = Math.sin(angle) * jumpPower;
      
      this.player.charging = false;
      this.player.chargeLevel = 0;
      this.player.onGround = false;
    }
  }

  resetPlayerPosition() {
    const groundPlatform = this.platforms.find(p => p.type === 'ground');
    this.player.x = groundPlatform.x + groundPlatform.width / 2 - this.player.width / 2;
    this.player.y = groundPlatform.y - this.player.height;
    this.player.velocityX = 0;
    this.player.velocityY = 0;
    this.player.onGround = true;
    this.player.charging = false;
    this.player.chargeLevel = 0;
    this.player.movingLeft = false;
    this.player.movingRight = false;
    this.gameWon = false;
  }

  handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    // Set pixel art rendering
    this.ctx.imageSmoothingEnabled = false;
  }

  update() {
    if (!this.running) return;

    // Update charge level
    if (this.player.charging && this.player.onGround) {
      this.player.chargeLevel = Math.min(
        this.player.chargeLevel + this.chargeSpeed,
        this.player.maxChargeLevel
      );
    }

    // Handle horizontal movement
    const currentMoveSpeed = this.player.onGround ? this.moveSpeed : this.airMoveSpeed;
    
    if (this.player.movingLeft) {
      this.player.velocityX = Math.max(this.player.velocityX - 0.5, -currentMoveSpeed);
    }
    if (this.player.movingRight) {
      this.player.velocityX = Math.min(this.player.velocityX + 0.5, currentMoveSpeed);
    }
    
    // Apply friction when not moving
    if (!this.player.movingLeft && !this.player.movingRight && this.player.onGround) {
      this.player.velocityX *= 0.8;
    }

    // Apply physics
    if (!this.player.onGround) {
      this.player.velocityY += this.gravity;
      // Air resistance for bag-like floating
      this.player.velocityX *= 0.99;
    }

    // Update position
    this.player.x += this.player.velocityX;
    this.player.y += this.player.velocityY;

    // Check platform collisions
    this.checkPlatformCollisions();

    // Check world boundaries
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x + this.player.width > this.worldWidth) {
      this.player.x = this.worldWidth - this.player.width;
    }

    // Check if fallen off the world (punitive fall)
    if (this.player.y > this.worldHeight) {
      this.resetPlayerPosition();
    }

    // Update camera
    this.updateCamera();

    // Update height stats
    this.currentHeight = Math.max(0, Math.floor((this.worldHeight - this.player.y) / 10));
    this.maxHeightReached = Math.max(this.maxHeightReached, this.currentHeight);

    // Check win condition
    if (this.checkRecyclingSymbolCollision()) {
      this.gameWon = true;
    }

    // Update game state
    this.setGameState({
      height: this.currentHeight,
      maxHeight: this.maxHeightReached,
      isCharging: this.player.charging,
      chargeLevel: this.player.chargeLevel,
      gameWon: this.gameWon
    });
  }

  checkPlatformCollisions() {
    this.player.onGround = false;

    for (const platform of this.platforms) {
      // Check if player is falling onto platform
      if (
        this.player.velocityY > 0 &&
        this.player.x + this.player.width > platform.x &&
        this.player.x < platform.x + platform.width &&
        this.player.y + this.player.height > platform.y &&
        this.player.y + this.player.height < platform.y + platform.height + 10
      ) {
        this.player.y = platform.y - this.player.height;
        this.player.velocityY = 0;
        this.player.onGround = true;
        break;
      }
    }
  }

  checkRecyclingSymbolCollision() {
    return (
      this.player.x + this.player.width > this.recyclingSymbol.x &&
      this.player.x < this.recyclingSymbol.x + this.recyclingSymbol.width &&
      this.player.y + this.player.height > this.recyclingSymbol.y &&
      this.player.y < this.recyclingSymbol.y + this.recyclingSymbol.height
    );
  }

  updateCamera() {
    // Follow player with smooth camera
    const targetCameraY = this.player.y - this.canvas.height / 2;
    this.camera.y += (targetCameraY - this.camera.y) * 0.1;
    
    // Keep camera within world bounds
    this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - this.canvas.height));
    
    // Center horizontally
    this.camera.x = (this.worldWidth - this.canvas.width) / 2;
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#1e293b'; // slate-800
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Save context for camera transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw background gradient effect
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
    gradient.addColorStop(0, '#065f46'); // emerald-800
    gradient.addColorStop(0.5, '#374151'); // gray-700
    gradient.addColorStop(1, '#1f2937'); // gray-800
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Draw platforms
    this.ctx.fillStyle = '#6b7280'; // gray-500
    for (const platform of this.platforms) {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Add platform border
      this.ctx.strokeStyle = '#9ca3af'; // gray-400
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Draw recycling symbol (goal)
    this.drawRecyclingSymbol();

    // Draw player (plastic bag)
    this.drawPlayer();

    // Restore context
    this.ctx.restore();

    // Draw UI overlay
    this.drawUI();
  }

  drawRecyclingSymbol() {
    const symbol = this.recyclingSymbol;
    
    // Draw glowing effect
    this.ctx.shadowColor = '#10b981'; // emerald-500
    this.ctx.shadowBlur = 20;
    
    // Draw recycling symbol as three curved arrows in a triangle
    this.ctx.strokeStyle = '#10b981'; // emerald-500
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    
    const centerX = symbol.x + symbol.width / 2;
    const centerY = symbol.y + symbol.height / 2;
    const radius = 24;
    
    // Draw three arrows
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const startAngle = angle - Math.PI / 6;
      const endAngle = angle + Math.PI / 6;
      
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.stroke();
      
      // Arrow head
      const headX = centerX + Math.cos(endAngle) * radius;
      const headY = centerY + Math.sin(endAngle) * radius;
      const headAngle = endAngle + Math.PI / 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(headX, headY);
      this.ctx.lineTo(
        headX + Math.cos(headAngle + 0.5) * 8,
        headY + Math.sin(headAngle + 0.5) * 8
      );
      this.ctx.moveTo(headX, headY);
      this.ctx.lineTo(
        headX + Math.cos(headAngle - 0.5) * 8,
        headY + Math.sin(headAngle - 0.5) * 8
      );
      this.ctx.stroke();
    }
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  drawPlayer() {
    const player = this.player;
    
    // Draw plastic bag with floating animation
    const floatOffset = Math.sin(Date.now() * 0.005) * 2;
    
    // Bag body (main shape)
    this.ctx.fillStyle = this.player.charging ? '#fbbf24' : '#e5e7eb'; // amber or gray
    this.ctx.strokeStyle = '#6b7280';
    this.ctx.lineWidth = 2;
    
    // Draw bag shape (slightly wavy)
    this.ctx.beginPath();
    this.ctx.moveTo(player.x + 8, player.y + floatOffset);
    this.ctx.lineTo(player.x + 24, player.y + floatOffset);
    this.ctx.lineTo(player.x + 28, player.y + 8 + floatOffset);
    this.ctx.lineTo(player.x + 26, player.y + 35 + floatOffset);
    this.ctx.lineTo(player.x + 6, player.y + 35 + floatOffset);
    this.ctx.lineTo(player.x + 4, player.y + 8 + floatOffset);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw handles
    this.ctx.beginPath();
    this.ctx.moveTo(player.x + 10, player.y + floatOffset);
    this.ctx.lineTo(player.x + 10, player.y - 5 + floatOffset);
    this.ctx.lineTo(player.x + 14, player.y - 5 + floatOffset);
    this.ctx.lineTo(player.x + 14, player.y + floatOffset);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(player.x + 18, player.y + floatOffset);
    this.ctx.lineTo(player.x + 18, player.y - 5 + floatOffset);
    this.ctx.lineTo(player.x + 22, player.y - 5 + floatOffset);
    this.ctx.lineTo(player.x + 22, player.y + floatOffset);
    this.ctx.stroke();
  }

  drawUI() {
    // Draw height indicator on the right
    this.ctx.fillStyle = '#1f2937';
    this.ctx.fillRect(this.canvas.width - 100, 20, 80, 200);
    this.ctx.strokeStyle = '#6b7280';
    this.ctx.strokeRect(this.canvas.width - 100, 20, 80, 200);
    
    // Height progress
    const progress = Math.min(this.currentHeight / 300, 1); // Assuming 300m is max height
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(this.canvas.width - 90, 210 - (progress * 180), 60, progress * 180);
    
    // Height text
    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.font = '12px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.currentHeight}m`, this.canvas.width - 60, 240);
  }

  start() {
    this.running = true;
    this.gameLoop();
  }

  gameLoop() {
    if (!this.running) return;
    
    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  reset() {
    this.resetPlayerPosition();
    this.maxHeightReached = 0;
    this.currentHeight = 0;
    this.gameWon = false;
  }

  destroy() {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

export default GameEngine;