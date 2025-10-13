// Simple icon generator using Canvas (Node.js)
const fs = require('fs');
const path = require('path');

// SVG template for LFG logo (upward trending chart)
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#26A69A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2962FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#131722"/>
  <path d="M ${size * 0.15} ${size * 0.85} L ${size * 0.35} ${size * 0.65} L ${size * 0.5} ${size * 0.75} L ${size * 0.85} ${size * 0.15} M ${size * 0.85} ${size * 0.15} L ${size * 0.65} ${size * 0.15} M ${size * 0.85} ${size * 0.15} L ${size * 0.85} ${size * 0.35}"
        stroke="url(#grad)"
        stroke-width="${size * 0.08}"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"/>
</svg>
`;

// Create maskable icon (with safe zone)
const createMaskableSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#26A69A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2962FF;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#131722"/>
  <path d="M ${size * 0.25} ${size * 0.75} L ${size * 0.4} ${size * 0.6} L ${size * 0.5} ${size * 0.65} L ${size * 0.75} ${size * 0.25} M ${size * 0.75} ${size * 0.25} L ${size * 0.6} ${size * 0.25} M ${size * 0.75} ${size * 0.25} L ${size * 0.75} ${size * 0.4}"
        stroke="url(#grad)"
        stroke-width="${size * 0.06}"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"/>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate regular icons
sizes.forEach(size => {
  const svg = createSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png.svg`), svg);
  console.log(`Created icon-${size}.png.svg`);
});

// Generate maskable icon
const maskableSVG = createMaskableSVG(512);
fs.writeFileSync(path.join(iconsDir, 'maskable-512.png.svg'), maskableSVG);
console.log('Created maskable-512.png.svg');

console.log('\n✅ SVG icons generated!');
console.log('Note: Rename .png.svg files to .png for production, or use an SVG-to-PNG converter.');
console.log('For now, these SVG files will work as placeholders.\n');
