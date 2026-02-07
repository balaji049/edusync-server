const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  key: { type: String, required: true }, // unique short key e.g. "first-post"
  label: { type: String },               // human readable title
  description: { type: String },
  awardedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    default: "student",
  },

  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],

  // profile (optional)
  profile: {
    about: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    location: { type: String, default: "" },
    interests: [{ type: String }]
  },
  bio: { type: String, default: "" },
headline: { type: String, default: "" },



  // achievements and metrics
  achievements: [achievementSchema],
  points: { type: Number, default: 0 },

  // activity counters
  messageCount: { type: Number, default: 0 },
  aiQuestionsAsked: { type: Number, default: 0 },

  // retention / engagement
  streakDays: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },

  // general stats (optional grouped)
  stats: {
    posts: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    resourcesAdded: { type: Number, default: 0 }
  }
},
{
  timestamps: true
});

// useful indexes for leaderboard / presence queries
userSchema.index({ points: -1 });
userSchema.index({ lastActive: -1 });

module.exports = mongoose.model("User", userSchema);
