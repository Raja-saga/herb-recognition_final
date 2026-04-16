const express = require("express");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const cors = require("cors");
const { performExplainableGeoValidation } = require("./services/geoValidationService");
const axios = require("axios");

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8000";

const app = express();
const PORT = 5000;

const METADATA_PATH = path.join(__dirname, "../frontend/public/metadata");

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3001",
  "http://31.97.239.242",
  "http://31.97.239.242:5173",
  "http://31.97.239.242:3001",
];

app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight for all routes
app.options("*", cors());
app.use(express.json());

const stateMapRoutes = require("./routes/stateMapRoutes");
app.use("/api", stateMapRoutes);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });


function runPythonPrediction(imagePath) {
  return new Promise((resolve) => {
    const script = path.join(__dirname, "../ml_service/predict.py");
    // const py = spawn("python", [script, imagePath]);
    const py = spawn(
      path.join(__dirname, "../ml_service/venv/bin/python"),
      [script, imagePath]
    );

    let output = "";

    py.stdout.on("data", (d) => (output += d.toString()));
    py.stderr.on("data", (e) => console.error(e.toString()));

    py.on("close", () => {
      try {
        resolve(JSON.parse(output.trim()));
      } catch {
        resolve({ success: false });
      }
    });
  });
}



function loadHerbMetadata(herbName) {
  const filePath = path.join(METADATA_PATH, `${herbName}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}



app.post("/api/predict", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const { latitude, longitude } = req.body;

  console.log('\n' + '='.repeat(80));
  console.log('🔍 NEW PREDICTION REQUEST');
  console.log('='.repeat(80));
  console.log(`📍 RECEIVED LOCATION:`);
  console.log(`   Latitude:  ${latitude}`);
  console.log(`   Longitude: ${longitude}`);

  // Parse location if provided
  const hasLocation = latitude && longitude;
  const userLat = hasLocation ? parseFloat(latitude) : null;
  const userLon = hasLocation ? parseFloat(longitude) : null;

  console.log(`\n✅ PARSED COORDINATES:`);
  console.log(`   User Lat: ${userLat}`);
  console.log(`   User Lon: ${userLon}`);
  console.log(`   Has Location: ${hasLocation}`);

  if (hasLocation && (isNaN(userLat) || isNaN(userLon))) {
    console.log(`\n❌ ERROR: Invalid coordinates detected`);
    fs.unlinkSync(imagePath);
    return res.status(400).json({ 
      error: "Invalid coordinates",
      message: "Latitude and longitude must be valid numbers" 
    });
  }

  console.log(`\n📸 Running ViT prediction on image...`);
  const mlResult = await runPythonPrediction(imagePath);
  fs.unlinkSync(imagePath);

  if (!mlResult.herb || !mlResult.confidence) {
    console.log(`\n❌ ML PREDICTION FAILED`);
    return res.status(500).json({ 
      error: "ML prediction failed",
      message: "Vision Transformer model could not process the image" 
    });
  }

  console.log(`\n✅ ViT PREDICTION RESULT:`);
  console.log(`   Herb: ${mlResult.herb}`);
  console.log(`   Visual Confidence: ${mlResult.confidence}%`);

  // If no location provided, return ML result only
  if (!hasLocation) {
    console.log(`\n⚠️  NO LOCATION PROVIDED - Skipping geo-validation`);
    console.log('='.repeat(80) + '\n');
    return res.json({
      success: true,
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "Prediction based on image only (no location validation)",
      validationResults: null
    });
  }

  // Load metadata for geo-validation
  console.log(`\n📂 LOADING HERB METADATA:`);
  console.log(`   Looking for: ${mlResult.herb}.json`);
  console.log(`   Path: ${METADATA_PATH}`);
  
  const herbMetadata = loadHerbMetadata(mlResult.herb);
  
  if (!herbMetadata) {
    console.log(`\n❌ METADATA FILE NOT FOUND`);
    console.log(`   File: ${mlResult.herb}.json does not exist`);
    console.log('='.repeat(80) + '\n');
    return res.json({
      success: true,
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "No geographical data available for validation",
      validationResults: null
    });
  }
  
  if (!herbMetadata.locations || herbMetadata.locations.length === 0) {
    console.log(`\n⚠️  METADATA LOADED BUT NO LOCATIONS FOUND`);
    console.log(`   Locations array: ${herbMetadata.locations ? 'empty' : 'missing'}`);
    console.log('='.repeat(80) + '\n');
    return res.json({
      success: true,
      herb: mlResult.herb,
      visualConfidence: mlResult.confidence,
      finalConfidence: mlResult.confidence,
      message: "No geographical data available for validation",
      validationResults: null
    });
  }

  console.log(`\n✅ METADATA LOADED SUCCESSFULLY:`);
  console.log(`   Herb exists in dataset: YES`);
  console.log(`   Numb er of location records: ${herbMetadata.locations.length}`);
  console.log(`   Sample location:`, herbMetadata.locations[0]);

  console.log(`\n🌍 RUNNING GEO-VALIDATION...`);
  const validationResults = performExplainableGeoValidation(
    userLat, 
    userLon, 
    herbMetadata, 
    mlResult.confidence
  );

  console.log(`\n📊 VALIDATION RESULTS:`);
  console.log(`   Nearest Distance: ${validationResults.locationPlausibility.nearestDistance?.toFixed(2)} km`);
  console.log(`   Location Plausibility Score: ${validationResults.locationPlausibility.score}`);
  console.log(`   Geographical Validation Score: ${validationResults.geographicalValidation.score}`);
  console.log(`   Final Confidence: ${validationResults.finalConfidence.score}%`);
  console.log('='.repeat(80) + '\n');

  res.json({
    success: true,
    herb: mlResult.herb,
    validationResults: validationResults,
    visualConfidence: mlResult.confidence,
    finalConfidence: validationResults.finalConfidence.score,
    locationPlausibilityScore: validationResults.locationPlausibility.score,
    geographicalValidationScore: validationResults.geographicalValidation.score,
    nearestDistanceKm: validationResults.locationPlausibility.nearestDistance
  });
});

app.get('/api/test-locations', (req, res) => {
  const testHerb = 'Acorus_calamus';
  const filePath = path.join(METADATA_PATH, `${testHerb}.json`);
  
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json({
      message: 'Dataset access working',
      herb: testHerb,
      locationCount: data.locations.length,
      sampleLocations: data.locations.slice(0, 3)
    });
  } else {
    res.json({ error: 'Dataset not found', path: filePath });
  }
});

app.get('/api/locations/:herbName', (req, res) => {
  const { herbName } = req.params;

  const filePath = path.join(METADATA_PATH, `${herbName}.json`);

  if (!fs.existsSync(filePath)) {
    return res.json({ herb: herbName, count: 0, locations: [] });
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const locations = raw.locations
    .map((loc) => ({
      lat: Number(loc.lat ?? loc.latitude),
      lng: Number(loc.lon ?? loc.lng ?? loc.longitude),
      name: `${loc.country}${loc.state ? ', ' + loc.state : ''}`,
    }))
    .filter((l) => !isNaN(l.lat) && !isNaN(l.lng));

  console.log(`Sending ${locations.length} valid locations for ${herbName}`);

  res.json({
    herb: herbName,
    count: locations.length,
    locations,
  });
});



// Herb-specific Q&A endpoint (RAG orchestration)
app.post("/api/ask", async (req, res) => {
  const { herbName, question } = req.body;

  if (!herbName || !question) {
    return res.status(400).json({ error: "herbName and question required" });
  }

  try {
    const ragResponse = await axios.post(
      `${RAG_SERVICE_URL}/query`,
      { question, herb_filter: herbName },
      { timeout: 15000 }
    );

    res.json({
      answer: ragResponse.data.answer,
      herb: herbName,
      sources: ragResponse.data.sources || []
    });
  } catch (error) {
    console.error("RAG service error:", error.message);
    res.status(503).json({
      error: "RAG service unavailable",
      answer: "Unable to answer question at this time. Please try again."
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const { herb, question, language } = req.body;

  if (!herb || !question) {
    return res.status(400).json({ error: "Herb and question required" });
  }

  try {
    const ragResponse = await axios.post(
      `${RAG_SERVICE_URL}/ask`,
      {
        question,
        herb_filter: herb,
        language: language || "en"
      },
      { timeout: 15000 }
    );
    res.json({ answer: ragResponse.data.answer });
  } catch (error) {
    console.error("Chat RAG error:", error.message);
    res.status(500).json({ error: "LLM service unavailable" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});







