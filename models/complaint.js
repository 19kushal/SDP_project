const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
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
        required: false
      },
      link: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );
  
  module.exports = mongoose.model("Complaint", complaintSchema);
  