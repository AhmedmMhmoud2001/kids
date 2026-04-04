import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, '../src/assets');

const imageExtensions = ['.png', '.jpg', '.jpeg'];

async function convertToWebP() {
  console.log('Starting conversion...\n');
  
  const files = fs.readdirSync(assetsDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext);
  });

  console.log(`Found ${imageFiles.length} images\n`);

  let totalOriginal = 0;
  let totalNew = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(assetsDir, file);
    const outputFileName = path.parse(file).name + '.webp';
    const outputPath = path.join(assetsDir, outputFileName);

    try {
      const originalSize = fs.statSync(inputPath).size;
      totalOriginal += originalSize;

      await sharp(inputPath)
        .webp({ quality: 80 })
        .toFile(outputPath);

      const newSize = fs.statSync(outputPath).size;
      totalNew += newSize;

      const saved = ((originalSize - newSize) / originalSize * 100).toFixed(1);
      console.log(`${file} -> ${outputFileName} (saved ${saved}%)`);

    } catch (error) {
      console.log(`Error: ${file} - ${error.message}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`WebP: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved: ${((totalOriginal - totalNew) / 1024 / 1024).toFixed(2)} MB`);
}

convertToWebP();
