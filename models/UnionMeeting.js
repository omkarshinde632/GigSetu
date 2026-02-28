const mongoose = require("mongoose");

const unionMeetingSchema = new mongoose.Schema({

  title: String,
  description: String,
  meetingDate: Date,
  location: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]

}, { timestamps: true });

module.exports = mongoose.model("UnionMeeting", unionMeetingSchema);