// Broad, rounded turns share vertical tangents for a continuous ribbon of graphite.
const drawingPath = 'M350 64 C310 64 250 82 250 110 C250 148 430 126 430 172 C430 222 180 195 180 246 C180 284 350 271 365 313 C371 330 358 342 341 347';

export function drawingLoaderMarkup() {
  return `<svg class="drawing-loader" viewBox="0 0 610 400" fill="none" aria-hidden="true">
    <g class="drawing-loader-ink">
      <path class="drawing-loader-line" d="${drawingPath}" stroke="#858477" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="drawing-loader-pencil" transform="translate(350 64)">
        <g transform="rotate(35)">
          <path d="M-5-18V-86Q-5-90-1-90H1Q5-90 5-86V-18Z" fill="#89947b"/>
          <path d="M-5-18V-85H-1V-18Z" fill="#aab19b"/>
          <path d="M3-18V-85H5V-18Z" fill="#68765d"/>
          <path d="M-5-18 0 0 5-18Z" fill="#d5bb96"/>
          <path d="M-1.5-5 0 0 1.5-5Z" fill="#575b50"/>
          <path d="M-5-80H5V-74H-5Z" fill="#c7c5b6"/>
          <path d="M-3-78H3" stroke="#ede8da" stroke-width="1"/>
        </g>
      </g>
    </g>
  </svg><span class="drawing-loader-caption">正在落笔，稍候片刻</span>`;
}

export function createDrawingLoader(container) {
  const line = container.querySelector('.drawing-loader-line');
  const pencil = container.querySelector('.drawing-loader-pencil');
  const ink = container.querySelector('.drawing-loader-ink');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const length = line.getTotalLength();
  let frame = 0;
  let startedAt = null;
  let running = false;
  line.style.strokeDasharray = `${length} ${length}`;

  function draw(progress, opacity = 1) {
    const point = line.getPointAtLength(progress * length);
    line.style.strokeDashoffset = String(length * (1 - progress));
    pencil.setAttribute('transform', `translate(${point.x} ${point.y})`);
    ink.style.opacity = String(opacity);
  }
  function tick(time) {
    if (!running) return;
    if (startedAt === null) startedAt = time;
    // Draw for seven seconds, rest briefly, then fade before beginning again.
    const elapsed = (time - startedAt) % 9000;
    draw(Math.min(elapsed / 7000, 1), elapsed > 8000 ? 1 - (elapsed - 8000) / 1000 : 1);
    frame = requestAnimationFrame(tick);
  }
  function start() {
    cancelAnimationFrame(frame);
    running = true;
    startedAt = null;
    draw(reducedMotion.matches ? 1 : 0);
    if (!reducedMotion.matches) frame = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }
  reducedMotion.addEventListener('change', () => { if (running) start(); });
  return { start, stop };
}
