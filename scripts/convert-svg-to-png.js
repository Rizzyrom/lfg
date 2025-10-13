#!/usr/bin/env node

/**
 * SVG to PNG Converter for iOS Icons
 * Converts SVG icons to PNG format for better iOS Safari compatibility
 */

const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const ICONS_DIR = '/Users/rom/lfg/public/icons';
const SOURCE_SVG = `${ICONS_DIR}/icon-192.svg`;

// Sizes to generate
const SIZES = [
  { width: 180, height: 180, name: 'icon-180.png' }, // iOS specific
  { width: 192, height: 192, name: 'icon-192.png' }, // Android
  { width: 512, height: 512, name: 'icon-512.png' }  // Large icon
];

async function checkInstallation() {
  try {
    await execPromise('which rsvg-convert');
    return 'rsvg';
  } catch {
    try {
      await execPromise('which convert');
      return 'imagemagick';
    } catch {
      return null;
    }
  }
}

async function convertWithRsvg(inputSvg, outputPng, width, height) {
  const cmd = `rsvg-convert -w ${width} -h ${height} "${inputSvg}" -o "${outputPng}"`;
  await execPromise(cmd);
}

async function convertWithImageMagick(inputSvg, outputPng, width, height) {
  const cmd = `convert -background none -density 300 -resize ${width}x${height} "${inputSvg}" "${outputPng}"`;
  await execPromise(cmd);
}

async function convertSvgToPng() {
  console.log('Starting SVG to PNG conversion...\n');

  // Check if source SVG exists
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error(`Error: Source SVG not found at ${SOURCE_SVG}`);
    process.exit(1);
  }

  // Check available conversion tools
  const tool = await checkInstallation();

  if (!tool) {
    console.error('Error: No SVG conversion tool found.');
    console.error('Please install one of the following:');
    console.error('  - librsvg: brew install librsvg');
    console.error('  - ImageMagick: brew install imagemagick');
    process.exit(1);
  }

  console.log(`Using ${tool === 'rsvg' ? 'rsvg-convert' : 'ImageMagick'} for conversion\n`);

  // Convert each size
  for (const size of SIZES) {
    const outputPath = `${ICONS_DIR}/${size.name}`;

    try {
      console.log(`Converting ${size.name} (${size.width}x${size.height})...`);

      if (tool === 'rsvg') {
        await convertWithRsvg(SOURCE_SVG, outputPath, size.width, size.height);
      } else {
        await convertWithImageMagick(SOURCE_SVG, outputPath, size.width, size.height);
      }

      // Verify the file was created
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`  ✓ Created ${outputPath} (${Math.round(stats.size / 1024)}KB)`);
      } else {
        console.log(`  ✗ Failed to create ${outputPath}`);
      }
    } catch (error) {
      console.error(`  ✗ Error converting ${size.name}:`, error.message);
    }
  }

  console.log('\n✅ Conversion complete!');
  console.log('\nGenerated files:');
  SIZES.forEach(size => {
    const outputPath = `${ICONS_DIR}/${size.name}`;
    if (fs.existsSync(outputPath)) {
      console.log(`  - ${outputPath}`);
    }
  });
}

// Run the conversion
convertSvgToPng().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
