// controllers/resourceController.js
const Resource = require("../models/Resource");
const Message = require("../models/Message");
const { getIO } = require("../socket");

/* ============================
   ADD RESOURCE (LEGACY)
   Roles: teacher, admin
============================ */
exports.addResource = async (req, res) => {
  try {
    const { title, description, type, link, communityId } = req.body;

    if (req.user.role === "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const fileUrl = req.file
      ? `/uploads/resources/${req.file.filename}`
      : link;

    const resource = await Resource.create({
      community: communityId,
      addedBy: req.user.userId,
      title,
      description,
      type,
      url: fileUrl,
    });

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   GET COMMUNITY RESOURCES
============================ */
exports.getResources = async (req, res) => {
  try {
    const { communityId } = req.params;

    const resources = await Resource.find({ community: communityId })
      .populate("addedBy", "name role")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   UPDATE RESOURCE
============================ */
exports.updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { title, description } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner = resource.addedBy.toString() === req.user.userId;
    const isPrivileged = ["teacher", "admin"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (title) resource.title = title;
    if (description) resource.description = description;

    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   DELETE RESOURCE
============================ */
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner = resource.addedBy.toString() === req.user.userId;
    const isPrivileged = ["teacher", "admin"].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Access denied" });
    }

    await resource.deleteOne();
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   🔴 STEP 3 — FILE UPLOAD → RESOURCE → MESSAGE
   (PRIMARY PIPELINE)
===================================================== */
exports.uploadResourceMessage = async (req, res) => {
  try {
    const { communityId, channelId = "resources" } = req.body;
    const userId = req.user.userId;

    if (!communityId || !req.file) {
      return res.status(400).json({ message: "Invalid upload request" });
    }

    /* 1️⃣ Create Resource */
    const resource = await Resource.create({
      community: communityId,
      addedBy: userId,
      title: req.file.originalname,
      type: req.file.mimetype.startsWith("image")
        ? "image"
        : "file",
      url: `/uploads/resources/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    /* 2️⃣ Create Message (REFERENCE ONLY) */
    const message = await Message.create({
      sender: userId,
      community: communityId,
      channel: channelId,
      type: resource.type,
      text: resource.title,
      resource: resource._id,
      role: "user",
    });

    const populated = await message.populate(
      "sender",
      "name role"
    );

    /* 3️⃣ Emit to CHANNEL ROOM */
    const room = `${communityId}:${channelId}`;

    getIO().to(room).emit("message-received", {
      _id: populated._id.toString(),
      type: populated.type,
      text: populated.text,
      channel: populated.channel,
      timestamp: populated.timestamp,

      resource: {
        _id: resource._id.toString(),
        title: resource.title,
        type: resource.type,
        url: resource.url,
        size: resource.size,
        mimeType: resource.mimeType,
      },

      senderId: populated.sender._id.toString(),
      senderName: populated.sender.name,
      senderRole: populated.sender.role,
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Upload resource error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

/* ============================
   📊 RESOURCE ANALYTICS
============================ */

/* 👁 Increment View */
exports.incrementView = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $inc: { views: 1 } },
      { new: true }
    );

    getIO()
      .to(resource.community.toString())
      .emit("resource-updated", {
        resourceId,
        views: resource.views,
        downloads: resource.downloads,
      });

    res.json({ message: "View recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ⬇️ Increment Download */
exports.incrementDownload = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { $inc: { downloads: 1 } },
      { new: true }
    );

    getIO()
      .to(resource.community.toString())
      .emit("resource-updated", {
        resourceId,
        views: resource.views,
        downloads: resource.downloads,
      });

    res.json({ message: "Download recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
