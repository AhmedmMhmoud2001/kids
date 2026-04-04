const fs = require('fs');
const path = require('path');

// Read the JSON file
const jsonPath = path.join(__dirname, 'src', 'data', 'products.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Image sets for different categories - 6 images each
const imageSets = {
  girl: [
    '1515886657613-9f3515b0c78f',
    '1571945153237-4929e783af4a',
    '1595777457583-95e059d581b8',
    '1594633313593-bab3825d0caf',
    '1521223890158-f9f7c3d5d504',
    '1572804013309-59a5b8c3a8c1'
  ],
  boy: [
    '1521572163474-6864f9cf17ab',
    '1542272604-787c3835535d',
    '1556821840-3a63f95609a7',
    '1503454537195-1dcabb73ffb9',
    '1521572163474-6864f9cf17ab',
    '1542272604-787c3835535d'
  ],
  'baby-boy': [
    '1503454537195-1dcabb73ffb9',
    '1515886657613-9f3515b0c78f',
    '1571945153237-4929e783af4a',
    '1595777457583-95e059d581b8',
    '1594633313593-bab3825d0caf',
    '1521223890158-f9f7c3d5d504'
  ],
  'baby-girl': [
    '1515886657613-9f3515b0c78f',
    '1571945153237-4929e783af4a',
    '1595777457583-95e059d581b8',
    '1594633313593-bab3825d0caf',
    '1521223890158-f9f7c3d5d504',
    '1572804013309-59a5b8c3a8c1'
  ],
  accessories: [
    '1553062407-98eeb64c6a62',
    '1588850561407-ed78c282e89b',
    '1523275335684-37898b6baf30',
    '1572635196237-14b3f281503f',
    '1553062407-98eeb64c6a62',
    '1624222247344-550fb60583fd'
  ],
  footwear: [
    '1542291026-7eec264c27ff',
    '1542291026-7eec264c27ff',
    '1542291026-7eec264c27ff',
    '1542291026-7eec264c27ff',
    '1542291026-7eec264c27ff',
    '1542291026-7eec264c27ff'
  ]
};

// Add images array to each product
data.products.forEach((product) => {
  const category = product.category;
  const imageSet = imageSets[category] || imageSets.girl;
  
  // Generate 6 unique images for each product
  product.images = imageSet.map((imgId, index) => {
    const seed = product.id * 10 + index;
    return `https://images.unsplash.com/photo-${imgId}?w=400&h=400&fit=crop&sig=${seed}`;
  });
});

// Write back to file
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log('Added 6 images to all products!');


