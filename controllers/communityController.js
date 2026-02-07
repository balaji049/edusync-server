// controllers/communityController.js
const Community = require("../models/Community");
const User = require("../models/User");
const { getIO } = require("../socket");

/* ============================
   CREATE COMMUNITY
============================ */
exports.createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;

    const community = await Community.create({
      name,
      description,
      createdBy: req.user.userId,
      members: [{ user: req.user.userId }],
    });

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { communities: community._id },
    });

    res.status(201).json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   JOIN COMMUNITY (FIXED)
============================ */
exports.joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;

    await Community.findByIdAndUpdate(communityId, {
      $addToSet: { members: { user: req.user.userId } },
    });

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { communities: communityId },
    });

    // 🔥 FETCH UPDATED MEMBERS
    const community = await Community.findById(communityId)
      .populate("members.user", "name role");

    const members = community.members.map((m) => ({
      userId: m.user._id.toString(),
      name: m.user.name,
      role: m.user.role,
    }));

    // 🔥 BROADCAST FULL MEMBER LIST
    getIO()
      .to(communityId)
      .emit("community-members-update", members);

    res.json({ message: "Joined successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   GET USER COMMUNITIES
============================ */
exports.getCommunities = async (req, res) => {
  try {
    const communities = await Community.find({
      "members.user": req.user.userId,
    });

    res.json(communities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ============================
   GET COMMUNITY MEMBERS
============================ */
exports.getMembers = async (req, res) => {
  try {
    const { communityId } = req.params;

    const community = await Community.findById(communityId)
      .populate("members.user", "name role email");

    const members = community.members.map((m) => ({
      userId: m.user._id.toString(),
      name: m.user.name,
      role: m.user.role,
      email: m.user.email,
      joinedAt: m.joinedAt,
    }));

    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
