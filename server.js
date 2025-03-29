const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;

app.use(express.json());

// Path to the JSON file
const dataFilePath = path.join(__dirname, "data.json");

// Endpoint to get data (events and configurations)
app.get("/api/data", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read data file" });
    }
    res.json(JSON.parse(data || "{}")); // Send the JSON data to the frontend
  });
});

// Endpoint to save data (events and configurations)
app.post("/api/data", (req, res) => {
  const data = req.body;
  fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save data" });
    }
    res.status(200).json({ message: "Data saved successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
