const express = require("express");
const { loadStateData } = require("../services/stateDataService");

const router = express.Router();

router.get("/state-map/:herb", (req, res) => {
  const data = loadStateData(req.params.herb);
  if (!data) {
    return res.status(404).json({ error: "No state data found" });
  }
  res.json(data);
});

module.exports = router;
