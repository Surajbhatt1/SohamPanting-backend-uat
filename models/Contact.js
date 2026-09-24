const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    mobile: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    propertyType: {
      type: String,
      required: true,
      trim: true
    },

    area: {
      type: String,
      default: "",
      trim: true
    },

    service: {
      type: String,
      required: true,
      trim: true
    },

    requirements: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Contact ||
  mongoose.model(
    "Contact",
    contactSchema
  );