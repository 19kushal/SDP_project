const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
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
        required: true
      },
      link: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );
  
  module.exports = mongoose.model("Notice", noticeSchema);
  