const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true
      },
      content: {
        type: String,
        required: true,
      },
      image: {
        type: String,
      },
      link: {
        type: String,
      },
  
    },
    {
      timestamps: true,
    }
  );
  
  module.exports = mongoose.model("Announcement", announcementSchema);
  