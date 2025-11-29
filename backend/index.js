const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend çalışıyor!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
