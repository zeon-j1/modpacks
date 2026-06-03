const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODPACKS_DIR =
    process.env.RENDER
        ? "/data/modpacks"
        : path.join(__dirname, "modpacks");

if (!fs.existsSync(MODPACKS_DIR)) {
    fs.mkdirSync(MODPACKS_DIR, { recursive: true });
}

const multer = require("multer");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, MODPACKS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

function requireAdmin(req, res, next) {
    if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
        return res.status(403).send("Forbidden");
    }

    next();
}

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
    app.disable("x-powered-by");
    res.set("Cache-Control", "public, max-age=3600");
    
    res.download(filePath);
});

app.get("/upload", requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "upload.html"));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.post(
    "/upload",
    requireAdmin,
    upload.single("modpack"),
    (req, res) => {
        res.send("Upload successful");
    }
);
