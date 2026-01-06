const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure memory storage (keep files in RAM for Firebase upload)
const storage = multer.memoryStorage();

// File filter - accept images, videos, documents, and audio (including WebM)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
  const allowedDocTypes = /pdf|doc|docx/;
  const allowedAudioTypes = /mp3|wav|ogg|m4a|webm/;

  const extname = path.extname(file.originalname).toLowerCase().slice(1);
  const mimetype = file.mimetype.toLowerCase();

  // Allow these fields to accept generic media (images, docs, videos)
  const genericMediaFields = [
    "images",
    "planningDocs",
    "rejectionProofs",
    "resolutionProofs",
  ];

  if (genericMediaFields.includes(file.fieldname)) {
    const isValid =
      allowedImageTypes.test(extname) ||
      allowedVideoTypes.test(extname) ||
      allowedDocTypes.test(extname) ||
      mimetype.startsWith("image/") ||
      mimetype.startsWith("video/") ||
      mimetype.includes("pdf") ||
      mimetype.includes("document");

    if (isValid) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type for ${file.fieldname}. Only images, videos, and documents are allowed`
        )
      );
    }
  } else if (file.fieldname === "voice") {
    // Accept audio files - be lenient with WebM from browser
    const isAudio =
      allowedAudioTypes.test(extname) ||
      mimetype.startsWith("audio/") ||
      mimetype.includes("webm") || // WebM can be audio or video
      file.originalname.includes("voice"); // Trust our own naming

    if (isAudio) {
      console.log("✅ Accepting voice file:", file.originalname, mimetype);
      cb(null, true);
    } else {
      console.log("❌ Rejected voice file:", {
        filename: file.originalname,
        mimetype: file.mimetype,
        extname,
      });
      cb(new Error("Only audio files are allowed for voice field"));
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 6, // Max 5 images + 1 voice file
  },
  fileFilter: fileFilter,
});

// Middleware for issue submission
const uploadIssueFiles = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "voice", maxCount: 1 },
]);

module.exports = {
  uploadIssueFiles,
  upload,
};
