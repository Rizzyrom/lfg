const fs = require('fs');
const path = require('path');

// Create HTML canvas-based PNG generator
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Icon Generator</title>
</head>
<body>
  <script>
    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    function generateIcon(size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Background - dark theme
      ctx.fillStyle = '#131722';
      ctx.fillRect(0, 0, size, size);

      // Gradient for "LFG" text
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#26A69A'); // Green
      gradient.addColorStop(1, '#2962FF'); // Blue

      // Draw "LFG" text
      ctx.fillStyle = gradient;
      ctx.font = \`bold \${size * 0.35}px Arial, sans-serif\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LFG', size / 2, size / 2);

      // Add subtle stroke
      ctx.strokeStyle = '#ffffff20';
      ctx.lineWidth = size * 0.01;
      ctx.strokeText('LFG', size / 2, size / 2);

      return canvas.toDataURL('image/png');
    }

    function generateMaskableIcon(size) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Background - solid dark with padding for maskable safe zone
      ctx.fillStyle = '#131722';
      ctx.fillRect(0, 0, size, size);

      // Gradient for "LFG" text (smaller for safe zone)
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#26A69A');
      gradient.addColorStop(1, '#2962FF');

      // Draw "LFG" text (80% size for maskable safe zone)
      ctx.fillStyle = gradient;
      ctx.font = \`bold \${size * 0.28}px Arial, sans-serif\`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LFG', size / 2, size / 2);

      return canvas.toDataURL('image/png');
    }

    // Generate all sizes
    sizes.forEach(size => {
      const dataUrl = generateIcon(size);
      console.log(\`ICON_\${size}=\${dataUrl}\`);
    });

    // Generate maskable
    const maskable = generateMaskableIcon(512);
    console.log(\`MASKABLE_512=\${maskable}\`);
  </script>
</body>
</html>
`;

// Write HTML file
const htmlPath = path.join(__dirname, '../public/icons/generator.html');
fs.writeFileSync(htmlPath, html);

console.log('Icon generator HTML created at: public/icons/generator.html');
console.log('');
console.log('To generate PNG icons:');
console.log('1. Open public/icons/generator.html in Chrome');
console.log('2. Open DevTools Console');
console.log('3. Copy each base64 data URL');
console.log('4. Use online tool to convert base64 to PNG');
console.log('');
console.log('Or use this Node.js approach with canvas package...');
console.log('');

// Simpler approach: Create base SVG that browsers will accept
const createBetterSVG = (size, isMaskable = false) => {
  const fontSize = isMaskable ? size * 0.28 : size * 0.35;
  const padding = isMaskable ? size * 0.2 : 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#26A69A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#2962FF;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#131722"/>

  <!-- LFG Text -->
  <text
    x="50%"
    y="50%"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="url(#textGrad)"
    text-anchor="middle"
    dominant-baseline="central"
    stroke="#ffffff20"
    stroke-width="${size * 0.01}"
  >LFG</text>
</svg>`;
};

// Generate improved SVG icons
const iconsDir = path.join(__dirname, '../public/icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  const svg = createBetterSVG(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
  console.log(`Created icon-${size}.svg`);
});

// Generate maskable
const maskableSVG = createBetterSVG(512, true);
fs.writeFileSync(path.join(iconsDir, 'maskable-512.svg'), maskableSVG);
console.log('Created maskable-512.svg');

console.log('');
console.log('✅ SVG icons with "LFG" text generated!');
console.log('');
console.log('For best compatibility on Android:');
console.log('1. Use an online SVG to PNG converter (like cloudconvert.com)');
console.log('2. Convert each icon-*.svg to icon-*.png');
console.log('3. Replace the old .png files');
console.log('');
console.log('Or commit these SVGs and update manifest.json to use .svg extension');
