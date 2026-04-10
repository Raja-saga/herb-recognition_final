const path = require('path');
const fs = require('fs');
const { performExplainableGeoValidation } = require('./services/geoValidationService');

// Test configuration
const METADATA_PATH = path.join(__dirname, "../frontend/public/metadata");
const TEST_HERB = 'Acorus_calamus';
const USER_LAT = 13.0135;  // Chennai area
const USER_LON = 80.2384;
const VISUAL_CONFIDENCE = 85;

console.log('🧪 Testing Geo-Validation System\n');
console.log('Configuration:');
console.log(`  Metadata Path: ${METADATA_PATH}`);
console.log(`  Test Herb: ${TEST_HERB}`);
console.log(`  User Location: ${USER_LAT}, ${USER_LON}`);
console.log(`  Visual Confidence: ${VISUAL_CONFIDENCE}%\n`);

// Load metadata
const filePath = path.join(METADATA_PATH, `${TEST_HERB}.json`);
console.log(`📂 Loading: ${filePath}`);

if (!fs.existsSync(filePath)) {
  console.error('❌ ERROR: Metadata file not found!');
  process.exit(1);
}

const herbData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
console.log(`✅ Loaded ${herbData.locations.length} locations\n`);

// Perform validation
console.log('🌍 Running geo-validation...\n');
const result = performExplainableGeoValidation(
  USER_LAT,
  USER_LON,
  herbData,
  VISUAL_CONFIDENCE
);

// Display results
console.log('📊 RESULTS:');
console.log('─'.repeat(60));
console.log(`Visual Confidence:        ${result.visualConfidence.score}%`);
console.log(`Location Plausibility:    ${result.locationPlausibility.score} (${result.locationPlausibility.explanation})`);
console.log(`Nearest Distance:         ${result.locationPlausibility.nearestDistance?.toFixed(2)} km`);
console.log(`Geographical Validation:  ${result.geographicalValidation.score}`);
console.log(`Final Confidence:         ${result.finalConfidence.score}%`);
console.log('─'.repeat(60));

if (result.locationPlausibility.nearestDistance !== null) {
  console.log('\n✅ SUCCESS: Location validation working correctly!');
} else {
  console.log('\n❌ FAILED: Location validation returned null distance');
}
