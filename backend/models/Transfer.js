const mongoose = require("mongoose");
const { Schema } = mongoose;

const ScanInfoSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "received", "not_received"],
      default: "pending"
    },
    observation: String,
    at: Date,
    by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const TransferItemSchema = new Schema(
  {
    equipment: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true
    },
    imei: {
      type: String,
      index: true,
      required: true
    },

    courier: { type: ScanInfoSchema, default: { status: "pending" } },
    store:   { type: ScanInfoSchema, default: { status: "pending" } },
  },
  { _id: true }
);

const TransferSchema = new Schema(
  {
    code: { type: String, index: true },

    fromBranch: {
      type: String,
      required: true
    },

    toBranch: {
      type: String,
      required: true
    },

    items: {
      type: [TransferItemSchema],
      default: []
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_transit_partial",
        "in_transit_complete",
        "completed",
        "failed"
      ],
      default: "pending",
      index: true
    },

    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    assignedDeliveryUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    reason: String,
  },
  { timestamps: true }
);

TransferSchema.methods.recomputeStatus = function () {
  const items = this.items;

  if (!items.length) {
    this.status = "pending";
    return;
  }

  const courierPending  = items.filter(i => i.courier?.status === "pending").length;
  const courierReceived = items.filter(i => i.courier?.status === "received").length;
  const courierRejected = items.filter(i => i.courier?.status === "not_received").length;

  const storePending  = items.filter(i => i.store?.status === "pending").length;
  const storeReceived = items.filter(i => i.store?.status === "received").length;
  const storeRejected = items.filter(i => i.store?.status === "not_received").length;

  if (courierPending === 0) {
    if (courierReceived === items.length) {
      this.status = "in_transit_complete";
    } else if (courierReceived > 0) {
      this.status = "in_transit_partial";
    } else if (courierRejected === items.length) {
      this.status = "failed";
    }
  }

  if (storePending === 0) {
    if (storeReceived === items.length) {
      this.status = "completed";
    } else if (storeReceived > 0) {
      this.status = "in_transit_partial";
    } else if (storeRejected === items.length) {
      this.status = "failed";
    }
  }
};

module.exports = mongoose.model("Transfer", TransferSchema);