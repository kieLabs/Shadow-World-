(function(global) {
  'use strict';
  const SW = global.ShadowWorld = global.ShadowWorld || {};

  SW.CanvasUtils = {
    resizeCanvas: function(canvas) {
      if (!canvas) return { width: 960, height: 540, dpr: 1 };
      const dpr = Math.min(2, global.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { width: 960, height: 540 };
      const w = Math.max(320, Math.floor(rect.width || global.innerWidth || 960));
      const h = Math.max(240, Math.floor(rect.height || global.innerHeight || 540));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (ctx && ctx.setTransform) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      return { width: w, height: h, dpr: dpr };
    },
    generateFilmGrainDataURL: function(size) {
      if (typeof document === 'undefined') return '';
      const s = size || 128;
      const off = document.createElement('canvas');
      off.width = s;
      off.height = s;
      const ctx = off.getContext('2d');
      if (!ctx) return '';
      const img = ctx.createImageData(s, s);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = (Math.random() * 90 + 20) | 0;
      }
      ctx.putImageData(img, 0, 0);
      return off.toDataURL('image/png');
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
