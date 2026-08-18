import fs from 'fs';
import { PNG } from 'pngjs';

function createIconPNG(size, filename) {
  const png = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Dark Navy Background (#0b0f19)
      let r = 11;
      let g = 15;
      let b = 25;
      let a = 255;

      // Cyan accent circle/glow in the center
      const dx = x - size / 2;
      const dy = y - size / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < size * 0.35) {
        // Cyan pulse (#00f2fe)
        const factor = 1 - (dist / (size * 0.35));
        r = Math.round(11 + (0 - 11) * factor);
        g = Math.round(15 + (242 - 15) * factor);
        b = Math.round(25 + (254 - 25) * factor);
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename} (${size}x${size})`);
}

createIconPNG(192, 'public/pwa-192x192.png');
createIconPNG(512, 'public/pwa-512x512.png');
createIconPNG(180, 'public/apple-touch-icon.png');
