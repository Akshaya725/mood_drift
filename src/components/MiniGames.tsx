import React, { useRef, useEffect, useState } from 'react';
import { GameConfig } from '../types';

interface GameProps {
  config: GameConfig;
  onGameOver: (score: number) => void;
}

// --- CLICKER GAME (Canvas) ---
// High energy, reaction time.
export const ClickerGame: React.FC<GameProps> = ({ config, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const gameStateRef = useRef({
    entities: [] as { x: number; y: number; r: number; asset: string; life: number; maxLife: number; id: number }[],
    lastSpawn: 0,
    isRunning: true,
    score: 0,
  });

  const speedMultiplier = config.parameters.speed / 5; // Normalize roughly around 1

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 100; // Leave space for header
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    let spawnId = 0;

    const render = (time: number) => {
      if (!gameStateRef.current.isRunning) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      ctx.fillStyle = config.theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn Logic
      const spawnRate = Math.max(200, 1000 - (config.parameters.speed * 80));
      if (time - gameStateRef.current.lastSpawn > spawnRate) {
        gameStateRef.current.lastSpawn = time;
        const radius = Math.random() * 30 + 30;
        gameStateRef.current.entities.push({
          id: spawnId++,
          x: Math.random() * (canvas.width - radius * 2) + radius,
          y: Math.random() * (canvas.height - radius * 2) + radius,
          r: 0, // Animate in
          asset: config.assets[Math.floor(Math.random() * config.assets.length)],
          life: 100,
          maxLife: 100,
        });
      }

      // Update & Draw Entities
      gameStateRef.current.entities.forEach((ent, index) => {
        // Grow effect
        if (ent.r < 40) ent.r += 2 * speedMultiplier;

        // Decay life
        ent.life -= 1 * speedMultiplier;

        // Draw Circle
        ctx.beginPath();
        ctx.arc(ent.x, ent.y, ent.r, 0, Math.PI * 2);
        ctx.fillStyle = config.theme.secondary;
        ctx.fill();
        ctx.strokeStyle = config.theme.primary;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Draw Text
        ctx.font = `${ent.r}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.asset, ent.x, ent.y);

        // Remove dead entities
        if (ent.life <= 0) {
          gameStateRef.current.entities.splice(index, 1);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    // Timer
    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          gameStateRef.current.isRunning = false;
          clearInterval(timerInterval);
          onGameOver(gameStateRef.current.score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(timerInterval);
    };
  }, [config, onGameOver, speedMultiplier]);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStateRef.current.isRunning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    gameStateRef.current.entities.forEach((ent, index) => {
      const dist = Math.sqrt((x - ent.x) ** 2 + (y - ent.y) ** 2);
      if (dist < ent.r) {
        // Hit!
        gameStateRef.current.score += 10;
        setScore(gameStateRef.current.score);
        gameStateRef.current.entities.splice(index, 1);
        // Add visual feedback? (Simulated by removing immediately)
      }
    });
  };

  return (
    <div className="relative w-full h-full touch-none select-none">
      <div className="absolute top-4 left-4 z-10 text-2xl font-bold" style={{ color: config.theme.text }}>
        Score: {score}
      </div>
      <div className="absolute top-4 right-4 z-10 text-2xl font-bold" style={{ color: config.theme.text }}>
        Time: {timeLeft}s
      </div>
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onMouseDown={handleClick}
        onTouchStart={handleClick}
      />
    </div>
  );
};

// --- CATCHER GAME (Canvas) ---
// Focus, flow state.
export const CatcherGame: React.FC<GameProps> = ({ config, onGameOver }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(5);

    const gameStateRef = useRef({
      playerX: 0,
      items: [] as { x: number; y: number; speed: number; asset: string; id: number }[],
      score: 0,
      lives: 5,
      isRunning: true,
      lastSpawn: 0
    });

    const speedBase = config.parameters.speed;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 100;
            gameStateRef.current.playerX = canvas.width / 2;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        let animationFrameId: number;
        let spawnId = 0;

        const render = (time: number) => {
            if (!gameStateRef.current.isRunning) return;

            // Clear
            ctx.fillStyle = config.theme.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Player (Basket)
            const playerW = 100;
            const playerH = 20;
            const playerY = canvas.height - 50;
            
            // Constrain player
            if (gameStateRef.current.playerX < playerW/2) gameStateRef.current.playerX = playerW/2;
            if (gameStateRef.current.playerX > canvas.width - playerW/2) gameStateRef.current.playerX = canvas.width - playerW/2;

            ctx.fillStyle = config.theme.primary;
            if (ctx.roundRect) {
              ctx.roundRect(gameStateRef.current.playerX - playerW / 2, playerY, playerW, playerH, 10);
            } else {
              ctx.fillRect(gameStateRef.current.playerX - playerW / 2, playerY, playerW, playerH);
            }
            ctx.fill();

            // Spawn
            const spawnRate = Math.max(300, 1500 - (speedBase * 100));
            if (time - gameStateRef.current.lastSpawn > spawnRate) {
                gameStateRef.current.lastSpawn = time;
                gameStateRef.current.items.push({
                    id: spawnId++,
                    x: Math.random() * (canvas.width - 40) + 20,
                    y: -50,
                    speed: Math.random() * 2 + (speedBase * 0.5),
                    asset: config.assets[Math.floor(Math.random() * config.assets.length)],
                });
            }

            // Update Items
            for (let i = gameStateRef.current.items.length - 1; i >= 0; i--) {
                const item = gameStateRef.current.items[i];
                item.y += item.speed;

                // Draw Item
                ctx.font = "30px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(item.asset, item.x, item.y);

                // Collision with Player
                if (
                    item.y > playerY &&
                    item.y < playerY + playerH + 30 &&
                    item.x > gameStateRef.current.playerX - playerW / 2 &&
                    item.x < gameStateRef.current.playerX + playerW / 2
                ) {
                    gameStateRef.current.score += 1;
                    setScore(gameStateRef.current.score);
                    gameStateRef.current.items.splice(i, 1);
                    continue;
                }

                // Missed (Fell off screen)
                if (item.y > canvas.height) {
                    gameStateRef.current.items.splice(i, 1);
                    gameStateRef.current.lives -= 1;
                    setLives(gameStateRef.current.lives);
                    if (gameStateRef.current.lives <= 0) {
                        gameStateRef.current.isRunning = false;
                        onGameOver(gameStateRef.current.score);
                    }
                }
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [config, onGameOver, speedBase]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        gameStateRef.current.playerX = e.clientX - rect.left;
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        gameStateRef.current.playerX = e.touches[0].clientX - rect.left;
    };

    return (
        <div className="relative w-full h-full touch-none select-none">
            <div className="absolute top-4 left-4 z-10 text-2xl font-bold" style={{ color: config.theme.text }}>
                Score: {score}
            </div>
            <div className="absolute top-4 right-4 z-10 text-2xl font-bold" style={{ color: config.theme.text }}>
                Lives: {lives}
            </div>
            <canvas
                ref={canvasRef}
                className="block w-full h-full cursor-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            />
        </div>
    );
};


// --- MEMORY GAME (DOM) ---
// Calm, mindfulness.
export const MemoryGame: React.FC<GameProps> = ({ config, onGameOver }) => {
  interface Card {
    id: number;
    content: string;
    isFlipped: boolean;
    isMatched: boolean;
  }

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);

  // Initialize
  useEffect(() => {
    // Pick 8 items to duplicate
    const selection = config.assets.slice(0, 8); 
    const deck = [...selection, ...selection]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        content: item,
        isFlipped: false,
        isMatched: false
      }));
    setCards(deck);
  }, [config]);

  // Check Match
  useEffect(() => {
    if (flippedIds.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = flippedIds;
      const card1 = cards.find(c => c.id === first);
      const card2 = cards.find(c => c.id === second);

      if (card1 && card2 && card1.content === card2.content) {
        // Match
        setCards(prev => prev.map(c => 
          c.id === first || c.id === second ? { ...c, isMatched: true } : c
        ));
        setMatches(m => m + 1);
        setFlippedIds([]);
      } else {
        // No Match - Reset after delay
        const timer = setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, isFlipped: false } : c
          ));
          setFlippedIds([]);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIds, cards]);

  // Game Over Check
  useEffect(() => {
    if (cards.length > 0 && matches === cards.length / 2) {
        // Calculate "Score" based on moves (fewer moves = higher score)
        // Base score 1000 - (moves * 10)
        const finalScore = Math.max(0, 1000 - (moves * 20));
        setTimeout(() => onGameOver(finalScore), 1000);
    }
  }, [matches, cards.length, moves, onGameOver]);

  const handleCardClick = (id: number) => {
    if (flippedIds.length >= 2) return;
    if (flippedIds.includes(id)) return;
    const card = cards.find(c => c.id === id);
    if (card?.isMatched) return;

    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));
    setFlippedIds(prev => [...prev, id]);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-10" style={{ backgroundColor: config.theme.background }}>
      <div className="flex justify-between w-full max-w-2xl px-6 mb-8">
        <h2 className="text-2xl font-bold" style={{ color: config.theme.text }}>Matches: {matches}</h2>
        <h2 className="text-2xl font-bold" style={{ color: config.theme.text }}>Moves: {moves}</h2>
      </div>
      
      <div className="grid grid-cols-4 gap-4 max-w-2xl w-full px-4">
        {cards.map(card => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`aspect-square rounded-xl text-4xl flex items-center justify-center transition-all duration-300 transform ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}
            style={{
              backgroundColor: card.isFlipped || card.isMatched ? config.theme.background : config.theme.primary,
              border: `2px solid ${config.theme.secondary}`,
              color: config.theme.text,
              opacity: card.isMatched ? 0.5 : 1,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            {card.isFlipped || card.isMatched ? card.content : '?'}
          </button>
        ))}
      </div>
    </div>
  );
};