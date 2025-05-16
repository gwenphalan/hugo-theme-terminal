document.addEventListener('DOMContentLoaded', function() {
  let initialSessionSeed;
  let seededRandomProvider; // This will be the function e.g. mulberry32(seed)

  // Mulberry32 algorithm (a simple, fast PRNG)
  function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }

  // Initialize the seed for the session
  const storedSeed = sessionStorage.getItem('starryNightSeed');
  if (storedSeed) {
    initialSessionSeed = parseInt(storedSeed, 10);
  } else {
    initialSessionSeed = Date.now(); // Use current time for the first load of the session
    sessionStorage.setItem('starryNightSeed', initialSessionSeed.toString());
  }

  const baseLayers = [
    { id: 'stars0', baseCount: 800, speed: 1.5, starSpread: 0, starOpacity: 0.5 }, // New: Slowest, smallest (faintest, dense)
    { id: 'stars', baseCount: 700, speed: 5.0, starSpread: 0, starOpacity: 0.7 },   // Existing: Adjusted opacity
    { id: 'stars2', baseCount: 200, speed: 10.0, starSpread: 0, starOpacity: 0.9 }, // Existing: Adjusted opacity
    { id: 'stars3', baseCount: 100, speed: 15.0, starSpread: 0, starOpacity: 1.0 },  // Existing: Full opacity
    { id: 'stars4', baseCount: 50, speed: 20.0, starSpread: 1, starOpacity: 1.0 }   // New: Fastest, largest (1px spread)
  ];

  const starsContainer = document.querySelector('.starfield-container');
  let currentWidth = window.innerWidth;
  let currentHeight = window.innerHeight;
  const initialArea = currentWidth * currentHeight; // Reference area

  let tiles = [];
  let resizeTimeout;

  function createStarTile(id, count, tileWidth, tileHeight, randomFunc, layerConfig) {
    const tile = document.createElement('div');
    tile.className = id;
    tile.id = id;
    let boxShadow = '';
    for (let i = 0; i < count; i++) {
      const x = randomFunc() * tileWidth;
      const y = randomFunc() * tileHeight;
      boxShadow += `${x}px ${y}px 0px ${layerConfig.starSpread}px rgba(255, 255, 255, ${layerConfig.starOpacity})`;
      if (i < count - 1) boxShadow += ', ';
    }
    tile.style.boxShadow = boxShadow;
    return tile;
  }

  function initializeStars() {
    seededRandomProvider = mulberry32(initialSessionSeed);
    tiles.forEach(({ tileA, tileB }) => {
      if (tileA && tileA.parentNode) tileA.parentNode.removeChild(tileA);
      if (tileB && tileB.parentNode) tileB.parentNode.removeChild(tileB);
    });
    tiles = [];
    if (starsContainer) {
      starsContainer.innerHTML = '';
    }

    currentWidth = window.innerWidth;
    currentHeight = window.innerHeight;
    const currentScreenArea = currentWidth * currentHeight;

    baseLayers.forEach((currentLayer) => {
      const scaledCount = Math.round(currentLayer.baseCount * (currentScreenArea / initialArea));
      const tileA = createStarTile(currentLayer.id + 'a', scaledCount, currentWidth, currentHeight, seededRandomProvider, currentLayer);
      const tileB = createStarTile(currentLayer.id + 'b', scaledCount, currentWidth, currentHeight, seededRandomProvider, currentLayer);
      
      tileA.style.left = '0px';
      tileB.style.left = currentWidth + 'px';

      starsContainer.appendChild(tileA);
      starsContainer.appendChild(tileB);

      tiles.push({ tileA, tileB, speed: currentLayer.speed });
    });
  }
  
  function animate() {
    tiles.forEach(({ tileA, tileB, speed }) => {
      [tileA, tileB].forEach(tile => {
        if (!tile) return; 
        let left = parseFloat(tile.style.left);
        left -= speed;

        if (left <= -currentWidth) {
          const other = tile === tileA ? tileB : tileA;
          if (other) { 
            left = parseFloat(other.style.left) + currentWidth;
          } else {
            left = currentWidth; 
          }
        }
        tile.style.left = left + 'px';
      });
    });
    requestAnimationFrame(animate);
  }

  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initializeStars, 250);
  }

  if (starsContainer) {
    initializeStars();
    window.addEventListener('resize', handleResize);
    animate();
  } else {
    console.error('.starfield-container not found');
  }
}); 