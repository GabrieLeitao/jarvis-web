const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5000;

app.use(express.json());

// Path to the JSON file
const dataFilePath = path.join(__dirname, "../data.json");

// Ensure the data file exists
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify({ events: [] }, null, 2), "utf8");
}

// Endpoint to get data (events and configurations)
app.get("/api/data", (req, res) => {
  fs.readFile(dataFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ error: "Failed to read data file" });
    }
    try {
      const parsedData = JSON.parse(data || "{}");
      if (!parsedData.events || !Array.isArray(parsedData.events)) {
        parsedData.events = []; // Ensure events is an array
      }
      res.json(parsedData);
    } catch (parseError) {
      console.error("Error parsing data file:", parseError);
      res.status(500).json({ error: "Failed to parse data file" });
    }
  });
});

// Endpoint to save data (events and configurations)
app.post("/api/data", (req, res) => {
  const data = req.body;
  if (!data.events || !Array.isArray(data.events)) {
    return res.status(400).json({ error: "Invalid data structure" });
  }
  fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Error saving data file:", err);
      return res.status(500).json({ error: "Failed to save data" });
    }
    res.status(200).json({ message: "Data saved successfully" });
  });
});

// Serve the frontend
app.use(express.static(path.join(__dirname, "../build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
