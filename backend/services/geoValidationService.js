const haversine = require("../utils/haversine");

const VALIDATION_CONFIG = {
  
  DISTANCE_THRESHOLDS: {
    EXCELLENT: 10,    
    GOOD: 50,         
    FAIR: 200,        
    POOR: 500,        
    VERY_POOR: 1000   
  },
  
  FUSION_WEIGHTS: {
    VISUAL: 0.7,     
    GEOGRAPHICAL: 0.3 
  }
};

/**
 * STEP 1: Calculate Location Plausibility Score
 * Finds nearest herb occurrence and converts distance to normalized score
 * 
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude  
 * @param {Array} locations - Array of known herb locations
 * @returns {Object} {nearestDistance, plausibilityScore, explanation}
 */
function calculateLocationPlausibility(userLat, userLon, locations) {
  console.log(`\n   📍 CALCULATING LOCATION PLAUSIBILITY:`);
  console.log(`      User coordinates: (${userLat}, ${userLon})`);
  console.log(`      Total herb locations to check: ${locations.length}`);
  
  let nearestDistance = Infinity;
  let nearestLocation = null;
  
  locations.forEach((location, index) => {
    const distance = haversine(
      userLat, userLon,
      location.latitude, location.longitude
    );
    
    if (index < 3) {
      console.log(`      Location ${index + 1}: (${location.latitude}, ${location.longitude}) - Distance: ${distance.toFixed(2)} km`);
    }
    
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLocation = location;
    }
  });
  
  console.log(`\n      ✅ NEAREST LOCATION FOUND:`);
  console.log(`         Distance: ${nearestDistance.toFixed(2)} km`);
  console.log(`         Coordinates: (${nearestLocation?.latitude}, ${nearestLocation?.longitude})`);
  console.log(`         State: ${nearestLocation?.state || 'N/A'}`);
  
  let plausibilityScore = 0.1; 
  let explanation = "Very unlikely location";
  
  if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.EXCELLENT) {
    plausibilityScore = 1.0;
    explanation = "Excellent - Very close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.GOOD) {
    plausibilityScore = 0.8;
    explanation = "Good - Close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.FAIR) {
    plausibilityScore = 0.6;
    explanation = "Fair - Moderately close to known occurrence";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.POOR) {
    plausibilityScore = 0.4;
    explanation = "Poor - Far from known occurrences";
  } else if (nearestDistance <= VALIDATION_CONFIG.DISTANCE_THRESHOLDS.VERY_POOR) {
    plausibilityScore = 0.2;
    explanation = "Very poor - Very far from known occurrences";
  }
  
  console.log(`\n      📊 PLAUSIBILITY SCORE:`);
  console.log(`         Score: ${plausibilityScore}`);
  console.log(`         Explanation: ${explanation}`);
  
  return {
    nearestDistance: nearestDistance === Infinity ? null : nearestDistance,
    plausibilityScore,
    explanation
  };
}

/**
 * @param {Object} plausibilityResult - Result from calculateLocationPlausibility
 * @returns {Object} {validationScore, explanation}
 */
function calculateGeographicalValidation(plausibilityResult) {
  return {
    validationScore: plausibilityResult.plausibilityScore,
    explanation: `Geographical validation based on distance: ${plausibilityResult.explanation}`
  };
}

/**

 * @param {number} visualConfidence - ViT model confidence (0-100)
 * @param {number} geoValidationScore - Geographical validation score (0-1)
 * @returns {Object} {finalConfidence, explanation, weights}
 */
function calculateFinalConfidence(visualConfidence, geoValidationScore) {
  console.log(`\n   🧮 CALCULATING FINAL CONFIDENCE:`);
  console.log(`      Visual Confidence: ${visualConfidence}%`);
  console.log(`      Geo Validation Score: ${geoValidationScore}`);
  console.log(`      Weights: Visual=${VALIDATION_CONFIG.FUSION_WEIGHTS.VISUAL}, Geo=${VALIDATION_CONFIG.FUSION_WEIGHTS.GEOGRAPHICAL}`);
  
  const finalConfidence = Math.round(
    (visualConfidence * VALIDATION_CONFIG.FUSION_WEIGHTS.VISUAL) +
    (geoValidationScore * 100 * VALIDATION_CONFIG.FUSION_WEIGHTS.GEOGRAPHICAL)
  );
  
  console.log(`      Final Confidence: ${finalConfidence}%`);
  
  return {
    finalConfidence,
    explanation: `Weighted combination: ${VALIDATION_CONFIG.FUSION_WEIGHTS.VISUAL * 100}% visual + ${VALIDATION_CONFIG.FUSION_WEIGHTS.GEOGRAPHICAL * 100}% geographical`,
    weights: VALIDATION_CONFIG.FUSION_WEIGHTS
  };
}

/**
 
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {Object} herbData - Herb metadata with locations array
 * @param {number} visualConfidence - ViT model confidence score
 * @returns {Object} Complete validation results with all intermediate scores
 */
function performExplainableGeoValidation(userLat, userLon, herbData, visualConfidence) {
  const plausibilityResult = calculateLocationPlausibility(userLat, userLon, herbData.locations);
  
  const geoValidationResult = calculateGeographicalValidation(plausibilityResult);
  
  const finalConfidenceResult = calculateFinalConfidence(visualConfidence, geoValidationResult.validationScore);
  
  return {
    // Input data
    userLocation: { latitude: userLat, longitude: userLon },
    herbName: herbData.herb || herbData.scientific_name,
    
    // Step-by-step results
    visualConfidence: {
      score: visualConfidence,
      explanation: "Confidence from Vision Transformer (ViT) model"
    },
    
    locationPlausibility: {
      score: plausibilityResult.plausibilityScore,
      nearestDistance: plausibilityResult.nearestDistance,
      explanation: plausibilityResult.explanation
    },
    
    geographicalValidation: {
      score: geoValidationResult.validationScore,
      explanation: geoValidationResult.explanation
    },
    
    finalConfidence: {
      score: finalConfidenceResult.finalConfidence,
      explanation: finalConfidenceResult.explanation,
      weights: finalConfidenceResult.weights
    },
    
    // Configuration used
    config: VALIDATION_CONFIG
  };
}

module.exports = {
  performExplainableGeoValidation,
  VALIDATION_CONFIG
};
