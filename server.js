const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const MODPACKS_DIR = path.join(__dirname, "modpacks");

app.use(express.static(__dirname));

// API: list files
app.get("/api/modpacks", (req, res) => {
    fs.readdir(MODPACKS_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: "Could not read directory." });

        const fileData = files.map((file) => {
            const stats = fs.statSync(path.join(MODPACKS_DIR, file));
            return { name: file, size: stats.size };
        });

        res.json(fileData);
    });
});

// Download a file
app.get("/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename); // sanitize
    const filePath = path.join(MODPACKS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found.");
    res.download(filePath);
});

app.listen(3000, () => console.log("Running at http://localhost:3000"));