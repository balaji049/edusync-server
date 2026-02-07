// routes/resourceRoutes.js
const express = require("express");
const auth = require("../middleware/authMiddleware");

const {
  addResource,
  getResources,
  deleteResource,
  updateResource,
  incrementView,
  incrementDownload,
  uploadResourceMessage,
} = require("../controllers/resourceController");

// ✅ FIX: correct import
const { uploadResource } = require("../middleware/upload");

const router = express.Router();

/* ===============================
   LEGACY RESOURCE CRUD
================================ */
router.post(
  "/",
  auth,
  uploadResource.single("file"),
  addResource
);

router.get("/:communityId", auth, getResources);
router.put("/:resourceId", auth, updateResource);
router.delete("/:resourceId", auth, deleteResource);
router.post("/:resourceId/view", auth, incrementView);
router.post("/:resourceId/download", auth, incrementDownload);

/* ===============================
   🔴 CHAT FILE → RESOURCE → MESSAGE
================================ */
router.post(
  "/upload-message",
  auth,
  uploadResource.single("file"),
  uploadResourceMessage
);

module.exports = router;
