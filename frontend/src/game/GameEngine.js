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
    
    // Initialize screen shake
    this.screenShake = 0;
    
    // Initialize particle system
    this.pollutionParticles = this.generatePollutionParticles();
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
    // Always try to jump when button is released, even with minimal charge
    if (this.player.charging) {
      // Minimum jump power even if barely charged
      const minJumpPower = 12;
      const jumpPower = Math.max(minJumpPower, (this.player.chargeLevel / this.player.maxChargeLevel) * this.maxJumpPower);
      
      // More predictable jump angle with horizontal bias
      let horizontalBias = 0;
      
      // Add horizontal component based on movement direction
      if (this.player.movingLeft) {
        horizontalBias = -0.4;
      } else if (this.player.movingRight) {
        horizontalBias = 0.4;
      }
      
      const baseAngle = -Math.PI/2; // Straight up
      const angle = baseAngle + horizontalBias;
      
      // Calculate jump velocities
      const jumpVelX = Math.cos(angle) * jumpPower * 0.8;
      const jumpVelY = Math.sin(angle) * jumpPower;
      
      // Apply jump immediately
      this.player.velocityX = (this.player.velocityX * 0.3) + jumpVelX;
      this.player.velocityY = jumpVelY;
      
      // Reset jump state
      this.player.charging = false;
      this.player.chargeLevel = 0;
      this.player.onGround = false;
      
      // Add slight screen shake effect for feedback
      this.screenShake = 5;
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
    this.updateCamera(); {
      const focusY = this.canvas.height * 0.8;
      this.cameraY = -(this.player.y - focusY); 
      if (this.cameraY > 0); {
        this.cameraY = 0;
      }
      

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
    // Clear canvas with deep space blue
    this.ctx.fillStyle = '#0f172a'; // slate-900
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake if active
    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
      this.screenShake *= 0.8; // Decay shake
    }

    // Save context for camera transform
    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // Draw atmospheric background with pollution layers
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.worldHeight);
    gradient.addColorStop(0, '#065f46'); // emerald-800 (clean air at top)
    gradient.addColorStop(0.3, '#1f2937'); // gray-800 (pollution layer)
    gradient.addColorStop(0.7, '#451a03'); // amber-900 (heavy pollution)
    gradient.addColorStop(1, '#1c1917'); // stone-900 (toxic bottom)
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

    // Add floating pollution particles
    this.drawPollutionParticles();

    // Draw platforms with waste textures
    for (const platform of this.platforms) {
      this.drawPlatform(platform);
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
    const centerX = symbol.x + symbol.width / 2;
    const centerY = symbol.y + symbol.height / 2;
    
    // Animated pulsing glow
    const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    
    // Multiple glow layers for dramatic effect
    this.ctx.shadowColor = '#10b981';
    this.ctx.shadowBlur = 30 * pulse;
    
    // Outer glow ring
    this.ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 * pulse})`;
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 35, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Main symbol with enhanced visuals
    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const radius = 20;
    
    // Draw three arrows with smooth curves
    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3 + (Date.now() * 0.002); // Slow rotation
      const startAngle = angle - Math.PI / 4;
      const endAngle = angle + Math.PI / 4;
      
      // Arrow arc
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      this.ctx.stroke();
      
      // Enhanced arrow head
      const headX = centerX + Math.cos(endAngle) * radius;
      const headY = centerY + Math.sin(endAngle) * radius;
      const headAngle = endAngle + Math.PI / 2;
      
      this.ctx.beginPath();
      this.ctx.moveTo(headX, headY);
      this.ctx.lineTo(
        headX + Math.cos(headAngle + 0.6) * 10,
        headY + Math.sin(headAngle + 0.6) * 10
      );
      this.ctx.lineTo(
        headX + Math.cos(headAngle) * 6,
        headY + Math.sin(headAngle) * 6
      );
      this.ctx.lineTo(
        headX + Math.cos(headAngle - 0.6) * 10,
        headY + Math.sin(headAngle - 0.6) * 10
      );
      this.ctx.lineTo(headX, headY);
      this.ctx.fill();
    }
    
    // Center highlight
    this.ctx.fillStyle = '#34d399'; // emerald-400
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Reset effects
    this.ctx.shadowBlur = 0;
    
    // Add floating text
    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('META', centerX, centerY - 45);
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = '#6ee7b7'; // emerald-300
    this.ctx.fillText('RECICLAGEM', centerX, centerY + 55);
  }

  drawPlayer() {
    const player = this.player;
    
    // Enhanced floating animation with multiple sine waves
    const time = Date.now() * 0.005;
    const floatOffset = Math.sin(time) * 3 + Math.sin(time * 1.5) * 1;
    
    // Add subtle rotation based on movement
    const rotationAngle = this.player.velocityX * 0.05;
    
    this.ctx.save();
    this.ctx.translate(player.x + player.width/2, player.y + player.height/2 + floatOffset);
    this.ctx.rotate(rotationAngle);
    
    // Draw shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, player.height/2 + 5, player.width/2 + 2, 4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Bag body with gradient and glow effect
    const bagGradient = this.ctx.createRadialGradient(0, -5, 0, 0, -5, 25);
    if (this.player.charging) {
      // Glowing effect when charging
      bagGradient.addColorStop(0, '#fcd34d'); // yellow-300
      bagGradient.addColorStop(0.7, '#f59e0b'); // amber-500
      bagGradient.addColorStop(1, '#d97706'); // amber-600
      
      // Add glow
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.shadowBlur = 15;
    } else {
      bagGradient.addColorStop(0, '#f3f4f6'); // gray-100
      bagGradient.addColorStop(0.7, '#d1d5db'); // gray-300
      bagGradient.addColorStop(1, '#9ca3af'); // gray-400
    }
    
    this.ctx.fillStyle = bagGradient;
    this.ctx.strokeStyle = this.player.charging ? '#92400e' : '#6b7280';
    this.ctx.lineWidth = 2;
    
    // Draw enhanced bag shape with curves
    this.ctx.beginPath();
    this.ctx.moveTo(-8, -player.height/2 + 8);
    this.ctx.quadraticCurveTo(8, -player.height/2, 8, -player.height/2 + 8);
    this.ctx.quadraticCurveTo(12, 0, 10, player.height/2 - 5);
    this.ctx.quadraticCurveTo(0, player.height/2 + 2, -10, player.height/2 - 5);
    this.ctx.quadraticCurveTo(-12, 0, -8, -player.height/2 + 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Draw handles with better styling
    this.ctx.strokeStyle = this.player.charging ? '#92400e' : '#4b5563';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    
    // Left handle
    this.ctx.beginPath();
    this.ctx.moveTo(-6, -player.height/2 + 8);
    this.ctx.quadraticCurveTo(-6, -player.height/2 - 3, -2, -player.height/2 - 3);
    this.ctx.quadraticCurveTo(2, -player.height/2 - 3, 2, -player.height/2 + 8);
    this.ctx.stroke();
    
    // Right handle  
    this.ctx.beginPath();
    this.ctx.moveTo(2, -player.height/2 + 8);
    this.ctx.quadraticCurveTo(2, -player.height/2 - 3, 6, -player.height/2 - 3);
    this.ctx.quadraticCurveTo(10, -player.height/2 - 3, 10, -player.height/2 + 8);
    this.ctx.stroke();
    
    // Add recycling symbol when charging
    if (this.player.charging) {
      this.ctx.fillStyle = '#065f46'; // emerald-800
      this.ctx.font = 'bold 8px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('♻️', 0, 2);
    }
    
    this.ctx.restore();
  }

  // New methods for enhanced visuals
  generatePollutionParticles() {
    const particles = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? '#78716c' : '#a8a29e' // stone colors
      });
    }
    return particles;
  }

  drawPollutionParticles() {
    for (const particle of this.pollutionParticles) {
      this.ctx.globalAlpha = particle.opacity;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Update particle position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Wrap around screen
      if (particle.y > this.worldHeight) particle.y = 0;
      if (particle.x > this.worldWidth) particle.x = 0;
      if (particle.x < 0) particle.x = this.worldWidth;
    }
    this.ctx.globalAlpha = 1;
  }

  drawPlatform(platform) {
    // Platform base with waste texture
    const gradient = this.ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height);
    gradient.addColorStop(0, '#6b7280'); // gray-500
    gradient.addColorStop(0.5, '#4b5563'); // gray-600  
    gradient.addColorStop(1, '#374151'); // gray-700
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    
    // Add waste items on platform
    this.ctx.strokeStyle = '#9ca3af'; // gray-400
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    
    // Add some trash details
    this.ctx.fillStyle = '#ef4444'; // red-500 (plastic waste)
    for (let i = 0; i < 3; i++) {
      const x = platform.x + (i + 1) * (platform.width / 4);
      const y = platform.y - 2;
      this.ctx.fillRect(x - 2, y, 4, 2);
    }
    
    // Add bottles and cans
    this.ctx.fillStyle = '#06b6d4'; // cyan-500 (bottles)
    const bottleX = platform.x + platform.width * 0.7;
    this.ctx.fillRect(bottleX - 1, platform.y - 6, 2, 6);
    
    // Add shine effect on platform edge
    this.ctx.strokeStyle = '#d1d5db'; // gray-300
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(platform.x, platform.y);
    this.ctx.lineTo(platform.x + platform.width, platform.y);
    this.ctx.stroke();
  }

  drawUI() {
    // Enhanced height indicator with Brazilian Portuguese
    const uiX = this.canvas.width - 120;
    const uiY = 20;
    const uiWidth = 100;
    const uiHeight = 220;
    
    // Background with gradient
    const gradient = this.ctx.createLinearGradient(uiX, uiY, uiX, uiY + uiHeight);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.9)'); // slate-900
    gradient.addColorStop(1, 'rgba(30, 41, 59, 0.9)'); // slate-800
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(uiX, uiY, uiWidth, uiHeight);
    
    // Border with emerald glow
    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(uiX, uiY, uiWidth, uiHeight);
    
    // Height progress bar
    const progress = Math.min(this.currentHeight / 500, 1);
    const barHeight = (uiHeight - 40) * progress;
    
    // Progress gradient
    const progressGradient = this.ctx.createLinearGradient(0, uiY + uiHeight - 20, 0, uiY + 20);
    progressGradient.addColorStop(0, '#ef4444'); // red-500 (bottom - dangerous)
    progressGradient.addColorStop(0.5, '#eab308'); // yellow-500 (middle)
    progressGradient.addColorStop(1, '#10b981'); // emerald-500 (top - clean)
    
    this.ctx.fillStyle = progressGradient;
    this.ctx.fillRect(uiX + 10, uiY + uiHeight - 20 - barHeight, uiWidth - 20, barHeight);
    
    // Height text with better styling
    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${this.currentHeight}m`, uiX + uiWidth/2, uiY + uiHeight + 15);
    
    // Label
    this.ctx.fillStyle = '#94a3b8'; // slate-400
    this.ctx.font = '10px Arial';
    this.ctx.fillText('ALTITUDE', uiX + uiWidth/2, uiY + uiHeight + 30);
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
