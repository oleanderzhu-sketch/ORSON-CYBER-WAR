import React, { useEffect, useRef, useState } from 'react';
import { 
  GameStatus, 
  Rocket, 
  Missile, 
  Explosion, 
  Battery, 
  City, 
  Point,
  Difficulty
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  BATTERY_CONFIGS, 
  CITY_CONFIGS, 
  EXPLOSION_MAX_RADIUS, 
  EXPLOSION_GROWTH_RATE, 
  MISSILE_SPEED, 
  ROCKET_BASE_SPEED,
  WIN_SCORE,
  DIFFICULTY_CONFIGS
} from '../constants';

interface GameCanvasProps {
  status: GameStatus;
  difficulty: Difficulty;
  onScoreChange: (score: number) => void;
  onStatusChange: (status: GameStatus) => void;
  onAmmoChange: (ammo: number[]) => void;
  onLevelChange: (level: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  status, 
  difficulty,
  onScoreChange, 
  onStatusChange,
  onAmmoChange,
  onLevelChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs
  const gameState = useRef({
    score: 0,
    level: 1,
    rockets: [] as Rocket[],
    missiles: [] as Missile[],
    explosions: [] as Explosion[],
    batteries: BATTERY_CONFIGS.map((config, index) => ({
      ...config,
      id: Math.random().toString(),
      ammo: config.maxAmmo,
      active: true,
      destroyed: false,
      shieldActive: index === 2
    })) as Battery[],
    cities: CITY_CONFIGS.map(config => ({
      ...config,
      id: Math.random().toString(),
      active: true,
      destroyed: false,
      canRecover: true
    })) as City[],
    lastRocketTime: 0,
    rocketsSpawned: 0,
    rocketsPerLevel: 10,
    levelInProgress: false,
  });

  const startLevel = () => {
    const state = gameState.current;
    state.levelInProgress = true;
    state.rocketsSpawned = 0;
    
    const diffConfig = DIFFICULTY_CONFIGS[difficulty];
    state.rocketsPerLevel = diffConfig.rockets;
    
    // Refill Ammo
    state.batteries.forEach(b => {
      if (!b.destroyed) b.ammo = b.maxAmmo;
    });
    
    // Recover Cities
    state.cities.forEach(c => {
      if (c.destroyed && c.canRecover) {
        c.destroyed = false;
        c.canRecover = false;
      }
    });
    
    onAmmoChange(state.batteries.map(b => b.ammo));
  };

  const endLevel = () => {
    const state = gameState.current;
    state.levelInProgress = false;
    
    // Ammo Bonus
    let ammoBonus = 0;
    state.batteries.forEach(b => {
      if (!b.destroyed) ammoBonus += b.ammo * 5;
    });
    
    state.score += ammoBonus;
    onScoreChange(state.score);
    
    if (state.score >= WIN_SCORE) {
      onStatusChange(GameStatus.WON);
      return;
    }
    
    state.level++;
    onLevelChange(state.level);
    // Small delay before next level
    setTimeout(() => {
      if (status === GameStatus.PLAYING) {
        startLevel();
      }
    }, 2000);
  };

  const resetGame = () => {
    gameState.current = {
      score: 0,
      level: 1,
      rockets: [],
      missiles: [],
      explosions: [],
      batteries: BATTERY_CONFIGS.map((config, index) => ({
        ...config,
        id: Math.random().toString(),
        ammo: config.maxAmmo,
        active: true,
        destroyed: false,
        shieldActive: index === 2
      })),
      cities: CITY_CONFIGS.map(config => ({
        ...config,
        id: Math.random().toString(),
        active: true,
        destroyed: false,
        canRecover: true
      })),
      lastRocketTime: 0,
      rocketsSpawned: 0,
      rocketsPerLevel: 10,
      levelInProgress: false,
    };
    onScoreChange(0);
    onAmmoChange(gameState.current.batteries.map(b => b.ammo));
    onLevelChange(1);
    startLevel();
  };

  useEffect(() => {
    if (status === GameStatus.START) {
      resetGame();
    }
  }, [status]);

  const spawnRocket = (time: number) => {
    const state = gameState.current;
    if (!state.levelInProgress) return;
    if (state.rocketsSpawned >= state.rocketsPerLevel) return;

    const actualInterval = Math.max(400, 2000 - (state.level * 150));
    
    if (time - state.lastRocketTime > actualInterval) {
      const startX = Math.random() * CANVAS_WIDTH;
      const targets = [
        ...state.cities.filter(c => !c.destroyed),
        ...state.batteries.filter(b => !b.destroyed)
      ];
      
      if (targets.length === 0) return;
      
      const target = targets[Math.floor(Math.random() * targets.length)];
      
      const diffConfig = DIFFICULTY_CONFIGS[difficulty];
      
      const newRocket: Rocket = {
        id: Math.random().toString(),
        x: startX,
        y: 0,
        targetX: target.x,
        targetY: target.y,
        speed: (ROCKET_BASE_SPEED + (state.level * 0.075)) * diffConfig.speedMultiplier,
        active: true,
        color: '#ff4444'
      };
      
      state.rockets.push(newRocket);
      state.lastRocketTime = time;
      state.rocketsSpawned++;
    }
  };

  const update = (time: number) => {
    if (status !== GameStatus.PLAYING) return;

    spawnRocket(time);

    const state = gameState.current;

    // Check level end
    if (state.levelInProgress && 
        state.rocketsSpawned >= state.rocketsPerLevel && 
        state.rockets.length === 0 && 
        state.explosions.length === 0) {
      endLevel();
    }

    // Update Rockets
    gameState.current.rockets.forEach(rocket => {
      const dx = rocket.targetX - rocket.x;
      const dy = rocket.targetY - rocket.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < rocket.speed) {
        rocket.active = false;
        // Impact!
        checkImpact(rocket.targetX, rocket.targetY);
      } else {
        rocket.x += (dx / distance) * rocket.speed;
        rocket.y += (dy / distance) * rocket.speed;
      }
    });

    // Update Missiles
    gameState.current.missiles.forEach(missile => {
      // Heat Tracking
      if (missile.targetRocketId) {
        const targetRocket = gameState.current.rockets.find(r => r.id === missile.targetRocketId && r.active);
        if (targetRocket) {
          missile.targetX = targetRocket.x;
          missile.targetY = targetRocket.y;
        }
      }

      const dx = missile.targetX - missile.startX;
      const dy = missile.targetY - missile.startY;
      const totalDist = Math.sqrt(dx * dx + dy * dy);
      
      missile.progress += MISSILE_SPEED / totalDist;
      
      if (missile.progress >= 1) {
        missile.active = false;
        // Create Explosion
        gameState.current.explosions.push({
          id: Math.random().toString(),
          x: missile.targetX,
          y: missile.targetY,
          radius: 0,
          maxRadius: EXPLOSION_MAX_RADIUS,
          growthRate: EXPLOSION_GROWTH_RATE,
          shrinking: false,
          active: true
        });
      } else {
        missile.x = missile.startX + dx * missile.progress;
        missile.y = missile.startY + dy * missile.progress;
      }
    });

    // Update Explosions
    gameState.current.explosions.forEach(exp => {
      if (!exp.shrinking) {
        exp.radius += exp.growthRate;
        if (exp.radius >= exp.maxRadius) {
          exp.shrinking = true;
        }
      } else {
        exp.radius -= exp.growthRate;
        if (exp.radius <= 0) {
          exp.active = false;
        }
      }

      // Check collision with rockets
      gameState.current.rockets.forEach(rocket => {
        if (rocket.active) {
          const dx = rocket.x - exp.x;
          const dy = rocket.y - exp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < exp.radius) {
            rocket.active = false;
            gameState.current.score += 20;
            onScoreChange(gameState.current.score);
            
            // Check win condition
            if (gameState.current.score >= WIN_SCORE) {
              onStatusChange(GameStatus.WON);
            }
          }
        }
      });
    });

    // Cleanup
    gameState.current.rockets = gameState.current.rockets.filter(r => r.active);
    gameState.current.missiles = gameState.current.missiles.filter(m => m.active);
    gameState.current.explosions = gameState.current.explosions.filter(e => e.active);

    // Check Loss Condition
    const destroyedBatteries = state.batteries.filter(b => b.destroyed);
    if (destroyedBatteries.length >= 3) {
      onStatusChange(GameStatus.LOST);
    }
  };

  const checkImpact = (x: number, y: number) => {
    // Check if a city or battery was hit
    gameState.current.cities.forEach(city => {
      if (!city.destroyed && Math.abs(city.x - x) < 20 && Math.abs(city.y - y) < 20) {
        city.destroyed = true;
        // If it can recover, it will be handled at level end (though this game is continuous score based)
        // For this specific request, let's say they recover once if destroyed.
        if (city.canRecover) {
           // We'll simulate recovery by just setting it to false once? 
           // Actually, the prompt says "once destroyed it only recovers once".
           // Let's just mark it as destroyed for now.
        }
      }
    });

    gameState.current.batteries.forEach(battery => {
      if (!battery.destroyed && Math.abs(battery.x - x) < 20 && Math.abs(battery.y - y) < 20) {
        if (battery.shieldActive) {
          battery.shieldActive = false;
        } else {
          battery.destroyed = true;
        }
        onAmmoChange(gameState.current.batteries.map(b => b.ammo));
      }
    });
  };

  const drawSolarSystem = (ctx: CanvasRenderingContext2D, time: number) => {
    // Space background
    ctx.fillStyle = '#000005';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * CANVAS_WIDTH;
      const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * CANVAS_HEIGHT;
      const size = (Math.sin(time / 1000 + i) * 0.5 + 0.5) * 2;
      ctx.fillRect(x, y, size, size);
    }

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    // Sun
    const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
    sunGradient.addColorStop(0, '#fff700');
    sunGradient.addColorStop(0.2, '#ffaa00');
    sunGradient.addColorStop(1, 'rgba(255, 68, 0, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
    ctx.fill();

    // Planets
    const planets = [
      { dist: 100, size: 8, color: '#aaaaaa', speed: 0.001 },
      { dist: 150, size: 12, color: '#e3bb76', speed: 0.0007 },
      { dist: 220, size: 14, color: '#2271b3', speed: 0.0005 },
      { dist: 300, size: 10, color: '#e27b58', speed: 0.0004 },
    ];

    planets.forEach((p, i) => {
      // Orbit
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, p.dist, 0, Math.PI * 2);
      ctx.stroke();

      // Planet
      const angle = time * p.speed + i;
      const px = centerX + Math.cos(angle) * p.dist;
      const py = centerY + Math.sin(angle) * p.dist;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2);
      pg.addColorStop(0, p.color + '44');
      pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const draw = (ctx: CanvasRenderingContext2D, time: number) => {
    if (!ctx) return;

    if (status === GameStatus.START) {
      drawSolarSystem(ctx, time);
      return;
    }

    // --- City Skyline Background ---
    // Night sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#020205');
    skyGradient.addColorStop(1, '#050515');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Stars (faint)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i * 456.78) * 0.5 + 0.5) * CANVAS_WIDTH;
      const y = (Math.cos(i * 123.45) * 0.5 + 0.5) * (CANVAS_HEIGHT - 100);
      ctx.fillRect(x, y, 1, 1);
    }

    // City Layers (Parallax feel)
    const drawCityLayer = (count: number, color: string, heightRange: [number, number], widthRange: [number, number]) => {
      ctx.fillStyle = color;
      for (let i = 0; i < count; i++) {
        const w = widthRange[0] + (Math.sin(i * 789) * 0.5 + 0.5) * (widthRange[1] - widthRange[0]);
        const h = heightRange[0] + (Math.cos(i * 456) * 0.5 + 0.5) * (heightRange[1] - heightRange[0]);
        const x = (i / count) * CANVAS_WIDTH;
        ctx.fillRect(x, CANVAS_HEIGHT - 40 - h, w, h);
        
        // Windows for the front layer
        if (color === '#1a1a1a') {
          ctx.fillStyle = 'rgba(255, 255, 100, 0.1)';
          for (let wy = CANVAS_HEIGHT - 40 - h + 10; wy < CANVAS_HEIGHT - 40; wy += 15) {
            for (let wx = x + 5; wx < x + w - 5; wx += 10) {
              if (Math.sin(wx + wy) > 0) ctx.fillRect(wx, wy, 3, 3);
            }
          }
          ctx.fillStyle = color;
        }
      }
    };

    drawCityLayer(15, '#0a0a0a', [50, 150], [40, 80]); // Back layer
    drawCityLayer(10, '#1a1a1a', [100, 250], [60, 100]); // Front layer

    // --- Ground ---
    // Pavement
    const groundGradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - 40, 0, CANVAS_HEIGHT);
    groundGradient.addColorStop(0, '#111');
    groundGradient.addColorStop(1, '#222');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);

    // Street lights/glow
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - 40);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT - 40);
    ctx.stroke();

    // Draw Cities
    gameState.current.cities.forEach(city => {
      if (!city.destroyed) {
        ctx.fillStyle = '#00ccff';
        ctx.fillRect(city.x - 15, city.y - 10, 30, 20);
        // Windows
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(city.x - 10, city.y - 5, 4, 4);
        ctx.fillRect(city.x + 6, city.y - 5, 4, 4);
      } else {
        ctx.fillStyle = '#333';
        ctx.fillRect(city.x - 15, city.y + 5, 30, 5);
      }
    });

    // Draw Batteries
    gameState.current.batteries.forEach(battery => {
      if (!battery.destroyed) {
        // Shield
        if (battery.shieldActive) {
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 2]); // Dashed shield for 2D look
          ctx.beginPath();
          ctx.arc(battery.x, battery.y - 5, 32, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]); // Reset dash
          
          ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
          ctx.fill();

          // Shield Status Indicator
          ctx.fillStyle = '#00ffff';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SHIELD ACTIVE', battery.x, battery.y - 40);
        }

        // 2D Turret Effect
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 2;

        // Base
        ctx.beginPath();
        ctx.roundRect(battery.x - 20, battery.y, 40, 10, 2);
        ctx.fill();
        ctx.stroke();

        // Turret Body
        ctx.beginPath();
        ctx.arc(battery.x, battery.y, 12, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Barrel
        ctx.fillRect(battery.x - 4, battery.y - 25, 8, 15);
        ctx.strokeRect(battery.x - 4, battery.y - 25, 8, 15);
        
        // Ammo text
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(battery.ammo.toString(), battery.x, battery.y + 25);
      } else {
        // Destroyed 2D look
        ctx.fillStyle = '#333';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(battery.x - 15, battery.y + 5, 30, 5, 1);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw Rockets
    gameState.current.rockets.forEach(rocket => {
      ctx.strokeStyle = rocket.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rocket.x, rocket.y);
      // Trail
      const dx = rocket.targetX - rocket.x;
      const dy = rocket.targetY - rocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      ctx.lineTo(rocket.x - (dx/dist)*50, rocket.y - (dy/dist)*50);
      ctx.stroke();
      
      // Head
      ctx.fillStyle = '#fff';
      ctx.fillRect(rocket.x - 1, rocket.y - 1, 2, 2);
    });

    // Draw Missiles
    gameState.current.missiles.forEach(missile => {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(missile.startX, missile.startY);
      ctx.lineTo(missile.x, missile.y);
      ctx.stroke();
      
      // Target X
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(missile.targetX - 5, missile.targetY - 5);
      ctx.lineTo(missile.targetX + 5, missile.targetY + 5);
      ctx.moveTo(missile.targetX + 5, missile.targetY - 5);
      ctx.lineTo(missile.targetX - 5, missile.targetY + 5);
      ctx.stroke();
    });

    // Draw Explosions
    gameState.current.explosions.forEach(exp => {
      const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(0.4, '#ffff00');
      gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Level Text
    if (!gameState.current.levelInProgress && status === GameStatus.PLAYING) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`LEVEL ${gameState.current.level}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  };

  const loop = (time: number) => {
    update(time);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, time);
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [status]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (status !== GameStatus.PLAYING) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest battery with ammo
    let closestBattery: Battery | null = null;
    let minDist = Infinity;

    gameState.current.batteries.forEach(battery => {
      if (!battery.destroyed && battery.ammo > 0) {
        const dist = Math.abs(battery.x - x);
        if (dist < minDist) {
          minDist = dist;
          closestBattery = battery;
        }
      }
    });

    if (closestBattery) {
      const batteryIndex = gameState.current.batteries.indexOf(closestBattery);
      const isMiddle = batteryIndex === 2;
      
      // Side batteries (0, 1, 3, 4) fire 2, Middle (2) fires 3
      const shots = isMiddle ? 3 : 2;
      
      if (closestBattery.ammo >= shots) {
        closestBattery.ammo -= shots;
        onAmmoChange(gameState.current.batteries.map(b => b.ammo));
        
        // Find nearest rocket for heat tracking
        let nearestRocketId: string | undefined;
        let minRocketDist = Infinity;
        gameState.current.rockets.forEach(rocket => {
          if (rocket.active) {
            const rdx = rocket.x - x;
            const rdy = rocket.y - y;
            const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
            if (rdist < minRocketDist && rdist < 150) { // Only track if reasonably close to click
              minRocketDist = rdist;
              nearestRocketId = rocket.id;
            }
          }
        });

        for (let i = 0; i < shots; i++) {
          let tx = x;
          let ty = y;
          
          if (isMiddle && i === 1) tx -= 40;
          if (isMiddle && i === 2) tx += 40;
          
          if (!isMiddle && i === 1) tx += 20; // Offset for double shot

          gameState.current.missiles.push({
            id: Math.random().toString(),
            startX: closestBattery.x,
            startY: closestBattery.y,
            x: closestBattery.x,
            y: closestBattery.y,
            targetX: tx,
            targetY: ty,
            speed: MISSILE_SPEED,
            progress: 0,
            active: true,
            targetRocketId: nearestRocketId
          });
        }
      }
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        className="max-w-full max-h-full cursor-crosshair border border-white/10 shadow-2xl"
      />
    </div>
  );
};

export default GameCanvas;
