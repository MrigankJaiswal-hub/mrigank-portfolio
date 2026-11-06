const slider = document.querySelector('#steer');
const angle = document.querySelector('#angle');
const pattern = document.querySelector('#pattern');
const direction = document.querySelector('#direction');
const reveal = document.querySelector('#reveal');

function renderBeam() {
  const degrees = Number(slider.value);
  const steering = degrees * Math.PI / 180;
  const points = [];

  for (let sample = -90; sample <= 90; sample += 1) {
    const theta = sample * Math.PI / 180;
    const phase = Math.PI * (Math.sin(theta) - Math.sin(steering));
    let real = 0;
    let imaginary = 0;

    for (let element = 0; element < 4; element += 1) {
      real += Math.cos(element * phase);
      imaginary += Math.sin(element * phase);
    }

    const radius = 160 * Math.hypot(real, imaginary) / 4;
    points.push((200 + radius * Math.sin(theta)).toFixed(2) + ',' +
      (204 - radius * Math.cos(theta)).toFixed(2));
  }

  pattern.setAttribute('d', 'M200,204 L' + points.join(' ') + ' Z');
  direction.setAttribute('x2', 200 + 160 * Math.sin(steering));
  direction.setAttribute('y2', 204 - 160 * Math.cos(steering));
  angle.value = (degrees > 0 ? '+' : '') + degrees + '°';
}

slider.addEventListener('input', () => {
  renderBeam();
  reveal.hidden = false;
});

document.querySelector('#reset').addEventListener('click', () => {
  slider.value = 0;
  renderBeam();
  slider.focus();
});

renderBeam();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('scroll-arrival');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const item of document.querySelectorAll('.about > div, .skills article, .project-card, .beam-figure')) {
    observer.observe(item);
  }
}

const portrait = document.querySelector('#portrait');
const caption = portrait.querySelector('.portrait-caption');
const hasPortraitPair = Boolean(portrait.querySelector('.portrait-photo--real') &&
  portrait.querySelector('.portrait-photo--illustrated'));
const burst = document.createElement('span');
burst.className = 'portrait-burst';
burst.setAttribute('aria-hidden', 'true');
portrait.append(burst);
let palette = 0;

if (hasPortraitPair) {
  portrait.dataset.portrait = 'illustrated';
  portrait.setAttribute('aria-label', 'Show real portrait');
  caption.firstChild.textContent = 'SHOW REAL PORTRAIT ';
}

portrait.addEventListener('click', () => {
  palette = (palette + 1) % 4;
  portrait.dataset.palette = palette;

  if (hasPortraitPair) {
    const showReal = portrait.dataset.portrait === 'illustrated';
    portrait.dataset.portrait = showReal ? 'real' : 'illustrated';
    const next = showReal ? 'Show illustrated portrait' : 'Show real portrait';
    portrait.setAttribute('aria-label', next);
    caption.firstChild.textContent = next.toUpperCase() + ' ';
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !burst.animate) return;
  burst.getAnimations().forEach(animation => animation.cancel());
  burst.animate([
    { transform: 'translateY(-50%) scale(.2)', opacity: 0.9 },
    { transform: 'translateY(-50%) scale(1.85)', opacity: 0 },
  ], { duration: 650, easing: 'ease-out' });
});

const filters = document.querySelector('#project-filters');
const filterButtons = [...filters.querySelectorAll('button')];
const projects = [...document.querySelectorAll('.project-card')];
const projectCount = document.querySelector('#project-count');

function filterProjects(filter) {
  let shown = 0;
  for (const project of projects) {
    project.hidden = filter !== 'all' && !project.dataset.category.split(' ').includes(filter);
    if (!project.hidden) shown += 1;
  }
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  }
  projectCount.textContent = shown + (shown === 1 ? ' project shown' : ' projects shown');
}

for (const button of filterButtons) {
  button.addEventListener('click', () => filterProjects(button.dataset.filter));
}
filterProjects('all');
filters.hidden = false;
projectCount.hidden = false;

for (const card of document.querySelectorAll('.flip-card')) {
  const front = card.querySelector('.flip-front');
  const back = card.querySelector('.flip-back');
  const frontButton = front.querySelector('[data-flip]');
  const backButton = back.querySelector('[data-flip]');
  frontButton.hidden = false;
  backButton.hidden = false;
  back.inert = true;
  card.dataset.ready = '';

  function flip(face, incoming, outgoing, focusTarget) {
    card.dataset.face = face;
    incoming.inert = false;
    focusTarget.focus({ preventScroll: true });
    outgoing.inert = true;
  }

  frontButton.addEventListener('click', () => flip('back', back, front, backButton));
  backButton.addEventListener('click', () => flip('front', front, back, frontButton));
}

const glow = document.createElement('div');
glow.className = 'cursor-glow';
glow.setAttribute('aria-hidden', 'true');
document.body.append(glow);
const glowAllowed = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
let glowFrame = 0;

document.addEventListener('pointermove', event => {
  if (!glowAllowed.matches || event.pointerType !== 'mouse') return;
  cancelAnimationFrame(glowFrame);
  glowFrame = requestAnimationFrame(() => {
    glow.style.setProperty('--glow-x', event.clientX + 'px');
    glow.style.setProperty('--glow-y', event.clientY + 'px');
    glow.style.setProperty('--glow-hue', String((event.clientX + event.clientY) % 360));
    glow.dataset.active = '';
  });
}, { passive: true });

document.documentElement.addEventListener('pointerleave', () => {
  cancelAnimationFrame(glowFrame);
  delete glow.dataset.active;
});

const dial = document.querySelector('#tune');
const frequency = document.querySelector('#frequency');
const strength = document.querySelector('#strength');
const tuneStatus = document.querySelector('#tune-status');
let signal = 987;

function randomDifferent(min, max, previous) {
  const candidate = min + Math.floor(Math.random() * (max - min));
  return candidate >= previous ? candidate + 1 : candidate;
}

function tune() {
  const value = Number(dial.value);
  const distance = Math.abs(value - signal);
  frequency.value = (value / 10).toFixed(1) + ' MHz';
  strength.value = Math.max(0, 100 - distance * 2);
  tuneStatus.textContent = distance <= 1 ? 'Signal locked!' :
    distance < 12 ? 'Strong signal. Fine-tune the dial.' :
    distance < 32 ? 'A signal is coming through.' : 'Weak signal. Keep tuning.';
}
dial.addEventListener('input', tune);
document.querySelector('#new-frequency').addEventListener('click', () => {
  signal = randomDifferent(915, 1050, signal);
  dial.value = dial.min;
  tune();
});

const bits = [...document.querySelectorAll('[data-bit]')];
const bitTarget = document.querySelector('#bit-target');
const bitTotal = document.querySelector('#bit-total');
const bitStatus = document.querySelector('#bit-status');
let target = 10;

function updateBits() {
  const total = bits.reduce((sum, bit) =>
    sum + (bit.getAttribute('aria-pressed') === 'true' ? Number(bit.dataset.bit) : 0), 0);
  bitTotal.textContent = total;
  bitStatus.textContent = total === target ? 'Match! You built the target in binary.' :
    total < target ? 'Your total is below the target.' : 'Your total is above the target.';
}

function setBit(button, on) {
  button.setAttribute('aria-pressed', String(on));
  button.querySelector('b').textContent = on ? '1' : '0';
}

for (const bit of bits) {
  bit.addEventListener('click', () => {
    setBit(bit, bit.getAttribute('aria-pressed') !== 'true');
    updateBits();
  });
}
document.querySelector('#new-bits').addEventListener('click', () => {
  target = randomDifferent(1, 15, target);
  bitTarget.textContent = target;
  bits.forEach(bit => setBit(bit, false));
  updateBits();
});

const drive = document.querySelector('.night-drive');
const scene = document.querySelector('#drive-scene');
const car = document.querySelector('#drive-car');
const driveMotion = document.querySelector('#drive-motion');
const driveToggle = document.querySelector('#drive-toggle');
const reducedDriveMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (typeof driveMotion.beginElement === 'function' && typeof scene.pauseAnimations === 'function') {
  let started = false;
  let userPaused = false;
  let onScreen = !('IntersectionObserver' in window);

  function syncDrive() {
    const canRun = !reducedDriveMotion.matches && !userPaused;
    const running = canRun && onScreen;
    if (running && !started) {
      car.removeAttribute('transform');
      driveMotion.beginElement();
      started = true;
    }
    if (started) {
      if (running) scene.unpauseAnimations();
      else scene.pauseAnimations();
    }
    drive.toggleAttribute('data-running', running);
    driveToggle.hidden = reducedDriveMotion.matches;
    driveToggle.textContent = userPaused ? 'Resume animation' : 'Pause animation';
  }

  driveToggle.addEventListener('click', () => {
    userPaused = !userPaused;
    syncDrive();
  });

  reducedDriveMotion.addEventListener('change', syncDrive);
  if ('IntersectionObserver' in window) {
    const driveObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncDrive();
    });
    driveObserver.observe(scene);
  }
  syncDrive();
}
