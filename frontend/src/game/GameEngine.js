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
    this.gravity = 0.8;
    this.jumpPowerMultiplier = 0.3;
    this.maxJumpPower = 25;
    this.chargeSpeed = 3;
    this.moveSpeed = 6;
    this.airMoveSpeed = 4;
    this.acceleration = 1.2;
    this.friction = 0.85;
    
    // Camera
    this.camera = { x: 0, y: 0 };
    
    // World properties
    this.worldWidth = 1000;
    this.worldHeight = 5000; // Much taller tower
    
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
    
    // Ground platform (larger starting area)
    platforms.push({
      x: this.worldWidth / 2 - (platformWidth * 1.5) / 2,
      y: this.worldHeight - 100,
      width: platformWidth * 1.5,
      height: platformHeight,
      type: 'ground'
    });
    
    // Generate ascending platforms with more strategic placement
    let currentHeight = this.worldHeight - 200;
    
    // First section - easier jumps
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * (this.worldWidth - platformWidth);
      const y = currentHeight - (i * 80) + (Math.random() * 30 - 15);
      
      platforms.push({
        x: x,
        y: y,
        width: platformWidth,
        height: platformHeight,
        type: 'platform'
      });
    }
    
    // Second section - medium difficulty
    currentHeight -= 15 * 80;
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * (this.worldWidth - platformWidth);
      const y = currentHeight - (i * 100) + (Math.random() * 50 - 25);
      
      platforms.push({
        x: x,
        y: y,
        width: platformWidth - 20, // Smaller platforms
        height: platformHeight,
        type: 'platform'
      });
    }
    
    // Third section - harder jumps
    currentHeight -= 25 * 100;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * (this.worldWidth - platformWidth);
      const y = currentHeight - (i * 120) + (Math.random() * 60 - 30);
      
      platforms.push({
        x: x,
        y: y,
        width: platformWidth - 30, // Even smaller platforms
        height: platformHeight,
        type: 'platform'
      });
    }
    
    // Final section - expert level
    currentHeight -= 20 * 120;
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * (this.worldWidth - platformWidth);
      const y = currentHeight - (i * 150) + (Math.random() * 80 - 40);
      
      platforms.push({
        x: x,
        y: y,
        width: Math.max(60, platformWidth - 40), // Smallest platforms
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
      if (e.code === 'KeyW') {
        // W also charges jump (alternative to space)
        this.startJump();
      }
      if (e.code === 'KeyS') {
        // S can be used for fast descent (small downward force when in air)
        if (!this.player.onGround) {
          this.player.velocityY += 2;
        }
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
      if (e.code === 'KeyW') {
        this.releaseJump();
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
      const jumpPower = Math.max(8, (this.player.chargeLevel / this.player.maxChargeLevel) * this.maxJumpPower);
      
      // More predictable jump angle with slight horizontal bias based on movement
      let baseAngle = -Math.PI/2; // Straight up
      let horizontalBias = 0;
      
      // Add horizontal component if moving
      if (this.player.movingLeft) {
        horizontalBias = -0.3;
      } else if (this.player.movingRight) {
        horizontalBias = 0.3;
      }
      
      const angle = baseAngle + horizontalBias + (Math.random() * 0.2 - 0.1); // Less randomness
      
      // Preserve current horizontal momentum and add jump velocity
      const jumpVelX = Math.cos(angle) * jumpPower * 0.6;
      const jumpVelY = Math.sin(angle) * jumpPower;
      
      // Combine with existing horizontal velocity
      this.player.velocityX = (this.player.velocityX * 0.5) + jumpVelX;
      this.player.velocityY = jumpVelY;
      
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

    // Handle horizontal movement with better acceleration
    const currentMoveSpeed = this.player.onGround ? this.moveSpeed : this.airMoveSpeed;
    
    if (this.player.movingLeft) {
      this.player.velocityX = Math.max(this.player.velocityX - this.acceleration, -currentMoveSpeed);
    }
    if (this.player.movingRight) {
      this.player.velocityX = Math.min(this.player.velocityX + this.acceleration, currentMoveSpeed);
    }
    
    // Apply friction when not moving (improved stopping)
    if (!this.player.movingLeft && !this.player.movingRight) {
      if (this.player.onGround) {
        this.player.velocityX *= this.friction;
      } else {
        this.player.velocityX *= 0.95; // Less friction in air
      }
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

    // Update height stats (adjusted for new world height)
    this.currentHeight = Math.max(0, Math.floor((this.worldHeight - this.player.y) / 15));
    this.maxHeightReached = Math.max(this.maxHeightReached, this.currentHeight);

    // Check win condition
    if (this.checkRecyclingSymbolCollision() && !this.gameWon) {
      this.gameWon = true;
      if (this.onGameEnd) {
        this.onGameEnd(this.currentHeight, true);
      }
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
      // More reliable platform collision detection
      if (
        this.player.velocityY >= 0 && // Only when falling or at rest
        this.player.x + this.player.width > platform.x + 2 && // Small buffer for edge cases
        this.player.x < platform.x + platform.width - 2 &&
        this.player.y + this.player.height > platform.y &&
        this.player.y + this.player.height <= platform.y + platform.height + Math.abs(this.player.velocityY) + 5
      ) {
        // Snap to platform surface
        this.player.y = platform.y - this.player.height;
        this.player.velocityY = 0;
        this.player.onGround = true;
        
        // Apply platform friction to prevent sliding off edges
        if (Math.abs(this.player.velocityX) < 0.5) {
          this.player.velocityX = 0;
        }
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
    
    // Height progress (adjusted for new tower height)
    const progress = Math.min(this.currentHeight / 500, 1); // 500m is new max height
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