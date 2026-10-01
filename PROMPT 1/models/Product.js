const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    pid: {
      type: String,
      required: true,
      unique: true
    },
    pname: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Product", productSchema);