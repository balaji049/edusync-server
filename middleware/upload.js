// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ===============================
   Ensure upload directories exist
================================ */
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir("uploads/resources");
ensureDir("uploads/profile");

/* ===============================
   RESOURCE STORAGE (CHAT FILES)
================================ */
const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resources/");
  },
  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

/* ===============================
   PROFILE IMAGE STORAGE
================================ */
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      "profile-" +
        Date.now() +
        path.extname(file.originalname)
    );
  },
});

/* ===============================
   FILE FILTERS (STRICT)
================================ */
const resourceFileFilter = (req, file, cb) => {
  const allowedExt = [
    ".pdf",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".png",
    ".jpg",
    ".jpeg",
  ];

  const allowedMime = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExt.includes(ext)) {
    return cb(
      new Error("Unsupported resource file extension")
    );
  }

  if (!allowedMime.includes(file.mimetype)) {
    return cb(
      new Error("Unsupported resource file type")
    );
  }

  cb(null, true);
};

const profileFileFilter = (req, file, cb) => {
  const allowedMime = ["image/png", "image/jpeg"];

  if (!allowedMime.includes(file.mimetype)) {
    return cb(
      new Error("Only PNG/JPEG images are allowed")
    );
  }

  cb(null, true);
};

/* ===============================
   MULTER UPLOADERS
================================ */
const uploadResource = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: profileFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

/* ===============================
   EXPORTS (EXPLICIT & SAFE)
================================ */
module.exports = {
  uploadResource,
  uploadProfile,
};
