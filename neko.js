(function() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;
  const NEKO_SIZE = 32;
  const SPEED = 3;
  const SPRITE_PATH = 'neko/';
  const WAKE_DELAY = 1000;

  const SPRITES = {
    idle:       ['awake'],
    up:         ['up1', 'up2'],
    down:       ['down1', 'down2'],
    left:       ['left1', 'left2'],
    right:      ['right1', 'right2'],
    upleft:     ['upleft1', 'upleft2'],
    upright:    ['upright1', 'upright2'],
    downleft:   ['downleft1', 'downleft2'],
    downright:  ['downright1', 'downright2'],
  };

  let nekoX = window.innerWidth / 2;
  let nekoY = window.innerHeight / 2;
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let frameIndex = 0;
  let frameTimer = 0;
  let currentSprite = 'idle';
  let following = false;
  let wakeTimeout = null;

  const neko = document.createElement('div');
  neko.id = 'neko-cursor';
  neko.style.cssText = `
    position: fixed;
    width: ${NEKO_SIZE}px;
    height: ${NEKO_SIZE}px;
    image-rendering: pixelated;
    pointer-events: none;
    z-index: 99999;
    background-size: cover;
    background-repeat: no-repeat;
    transform: translate(-50%, -50%);
    top: 0; left: 0;
    transition: none;
  `;
  document.body.appendChild(neko);

  function setSprite(name) {
    const frames = SPRITES[name] || SPRITES.idle;
    const frame = frames[frameIndex % frames.length];
    neko.style.backgroundImage = `url('${SPRITE_PATH}${frame}.png')`;
  }

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!following) {
      clearTimeout(wakeTimeout);
      wakeTimeout = setTimeout(() => {
        following = true;
      }, WAKE_DELAY);
    }
  });

  function getDirection(dx, dy) {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle > -22.5 && angle <= 22.5)    return 'right';
    if (angle > 22.5  && angle <= 67.5)    return 'downright';
    if (angle > 67.5  && angle <= 112.5)   return 'down';
    if (angle > 112.5 && angle <= 157.5)   return 'downleft';
    if (angle > 157.5 || angle <= -157.5)  return 'left';
    if (angle > -157.5 && angle <= -112.5) return 'upleft';
    if (angle > -112.5 && angle <= -67.5)  return 'up';
    if (angle > -67.5 && angle <= -22.5)   return 'upright';
    return 'right';
  }

  function tick() {
    frameTimer++;

    if (following) {
      const dx = mouseX - nekoX;
      const dy = mouseY - nekoY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > SPEED + 2) {
        const step = Math.min(SPEED, dist);
        nekoX += (dx / dist) * step;
        nekoY += (dy / dist) * step;
        currentSprite = getDirection(dx, dy);
        if (frameTimer % 6 === 0) frameIndex++;
      } else {
        currentSprite = 'idle';
        frameIndex = 0;
      }
    } else {
      currentSprite = 'idle';
      frameIndex = 0;
    }

    neko.style.left = nekoX + 'px';
    neko.style.top  = nekoY + 'px';
    setSprite(currentSprite);

    requestAnimationFrame(tick);
  }

  tick();
})();