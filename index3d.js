// index3d.js (需放在根目錄或 public/js 中)
import { Application } from 'https://unpkg.com/@splinetool/runtime@0.9.482/build/runtime.js';

export function initSpline3D() {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

  const app = new Application(canvas);
  app.load('https://prod.spline.design/8Kujwbatk76bW3AM/scene.splinecode');

  canvas.addEventListener('wheel', (e) => {
    window.scrollBy({
      top: e.deltaY,
      behavior: 'smooth'
    });
  }, { passive: true });
}