const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../dataset/processed");

function loadStateData(herb) {
  const file = path.join(DATA_DIR, `${herb}_statewise.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

module.exports = { loadStateData };
