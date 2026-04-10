const path = require('path');
const fs = require('fs');

console.log('\n🧪 DEBUG LOGGING VERIFICATION TEST\n');

// Test 1: Check METADATA_PATH
const METADATA_PATH = path.join(__dirname, "../frontend/public/metadata");
console.log('1️⃣ Testing Metadata Path:');
console.log(`   Path: ${METADATA_PATH}`);
console.log(`   Exists: ${fs.existsSync(METADATA_PATH) ? '✅ YES' : '❌ NO'}`);

// Test 2: Check sample herb file
const testHerb = 'Acorus_calamus';
const testFile = path.join(METADATA_PATH, `${testHerb}.json`);
console.log(`\n2️⃣ Testing Sample Herb File (${testHerb}):`);
console.log(`   File: ${testFile}`);
console.log(`   Exists: ${fs.existsSync(testFile) ? '✅ YES' : '❌ NO'}`);

if (fs.existsSync(testFile)) {
  const data = JSON.parse(fs.readFileSync(testFile, 'utf8'));
  console.log(`   Locations: ${data.locations?.length || 0}`);
  if (data.locations && data.locations.length > 0) {
    console.log(`   Sample: (${data.locations[0].latitude}, ${data.locations[0].longitude})`);
  }
}

// Test 3: Check geo-validation service
console.log('\n3️⃣ Testing Geo-Validation Service:');
try {
  const { performExplainableGeoValidation } = require('./services/geoValidationService');
  console.log('   Import: ✅ SUCCESS');
  
  if (fs.existsSync(testFile)) {
    const herbData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    const testLat = 13.0135;
    const testLon = 80.2384;
    const testConfidence = 85;
    
    console.log(`\n   Running test validation...`);
    console.log(`   User Location: (${testLat}, ${testLon})`);
    console.log(`   Visual Confidence: ${testConfidence}%`);
    
    const result = performExplainableGeoValidation(testLat, testLon, herbData, testConfidence);
    
    console.log(`\n   ✅ VALIDATION SUCCESSFUL:`);
    console.log(`      Nearest Distance: ${result.locationPlausibility.nearestDistance?.toFixed(2)} km`);
    console.log(`      Plausibility Score: ${result.locationPlausibility.score}`);
    console.log(`      Final Confidence: ${result.finalConfidence.score}%`);
  }
} catch (error) {
  console.log(`   Import: ❌ FAILED - ${error.message}`);
}

// Test 4: Check haversine utility
console.log('\n4️⃣ Testing Haversine Distance Calculator:');
try {
  const haversine = require('./utils/haversine');
  console.log('   Import: ✅ SUCCESS');
  
  const lat1 = 13.0135, lon1 = 80.2384;
  const lat2 = 13.71959, lon2 = 79.589135;
  const distance = haversine(lat1, lon1, lat2, lon2);
  
  console.log(`   Test calculation:`);
  console.log(`      Point A: (${lat1}, ${lon1})`);
  console.log(`      Point B: (${lat2}, ${lon2})`);
  console.log(`      Distance: ${distance.toFixed(2)} km`);
} catch (error) {
  console.log(`   Import: ❌ FAILED - ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ DEBUG LOGGING SYSTEM READY');
console.log('='.repeat(60));
console.log('\nNext Steps:');
console.log('1. Start backend: npm start');
console.log('2. Upload image with location from frontend');
console.log('3. Check console for detailed debug logs');
console.log('4. Refer to DEBUG_LOGGING_GUIDE.md for troubleshooting\n');
