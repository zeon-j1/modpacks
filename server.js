const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

const MODPACKS_DIR =
    process.env.RENDER
        ? "/data/modpacks"
        : path.join(__dirname, "modpacks");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// Create modpacks directory if missing
if (!fs.existsSync(MODPACKS_DIR)) {
    fs.mkdirSync(MODPACKS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, MODPACKS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

/*
// Allow only .zip and .mrpack files
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === ".zip" || ext === ".mrpack") {
            cb(null, true);
        } else {
            cb(new Error("Only .zip and .mrpack files are allowed."));
        }
    }
});
*/

// Admin auth middleware
function requireAdmin(req, res, next) {
    if (!ADMIN_TOKEN) {
        console.error("ADMIN_TOKEN environment variable is not set.");
        return res.status(500).send("Server configuration error.");
    }

    if (req.query.token !== ADMIN_TOKEN) {
        return res.status(403).send("Forbidden");
    }

    next();
}

app.disable("x-powered-by");

app.use(express.static(__dirname));

// List modpacks
app.get("/api/modpacks", (req, res) => {
    fs.readdir(MODPACKS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({
                error: "Could not read directory."
            });
        }

        const fileData = files.map((file) => {
            const stats = fs.statSync(path.join(MODPACKS_DIR, file));

            return {
                name: file,
                size: stats.size
            };
        });

        res.json(fileData);
    });
});

// Download modpack
app.get("/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(MODPACKS_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found.");
    }

    res.set("Cache-Control", "public, max-age=3600");
    res.download(filePath);
});

// Serve upload page
app.get("/upload", requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, "upload.html"));
});

// Upload endpoint
app.post(
    "/upload",
    requireAdmin,
    upload.single("modpack"),
    (req, res) => {
        res.send("Upload successful.");
    }
);

// Error handler for Multer
app.use((err, req, res, next) => {
    console.error(err);

    if (err) {
        return res.status(400).send(err.message);
    }

    next();
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Modpacks directory: ${MODPACKS_DIR}`);
});
