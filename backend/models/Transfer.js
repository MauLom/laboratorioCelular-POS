const mongoose = require("mongoose");
const { Schema } = mongoose;

const ScanInfoSchema = new Schema(
  {
    status: { type: String, enum: ["pendiente", "recibido", "no_recibido"], default: "pendiente" },
    observation: String,
    at: Date,
    by: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const TransferItemSchema = new Schema(
  {
    equipment: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    imei: { type: String, index: true, required: true },

    courier: { type: ScanInfoSchema, default: { status: "pendiente" } },
    store:   { type: ScanInfoSchema, default: { status: "pendiente" } },
  },
  { _id: true }
);

const TransferSchema = new Schema(
  {
    code: { type: String, index: true },
    fromBranch: { type: String, required: true },
    toBranch: { type: String, required: true },

    items: { type: [TransferItemSchema], default: [] },

    status: {
      type: String,
      enum: [
        "pendiente",

        "en_transito_parcial",
        "en_transito_completa",

        "incompleta",
        "completada",

        "fallida",
      ],
      default: "pendiente",
      index: true,
    },

    requestedBy: { type: Schema.Types.ObjectId, ref: "User" },

    assignedDeliveryUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    receivedBy: { type: Schema.Types.ObjectId, ref: "User" },

    reason: String,
  },
  { timestamps: true }
);

TransferSchema.methods.recomputeStatus = function () {
  const items = this.items;

  const courierPending = items.filter(i => i.courier?.status === "pendiente").length;
  const courierReceived = items.filter(i => i.courier?.status === "recibido").length;
  const courierRejected = items.filter(i => i.courier?.status === "no_recibido").length;

  const storePending = items.filter(i => i.store?.status === "pendiente").length;
  const storeReceived = items.filter(i => i.store?.status === "recibido").length;
  const storeRejected = items.filter(i => i.store?.status === "no_recibido").length;

  if (courierPending === 0) {
    if (courierReceived === items.length) {
      this.status = "en_transito_completa";
    } else if (courierReceived > 0) {
      this.status = "en_transito_parcial";
    } else if (courierRejected === items.length) {
      this.status = "fallida";
    }
  }

  if (storePending === 0) {
    if (storeReceived === items.length) {
      this.status = "completada";
    } else if (storeReceived > 0) {
      this.status = "incompleta";
    } else if (storeRejected === items.length) {
      this.status = "fallida";
    }
  }
};

module.exports = mongoose.model("Transfer", TransferSchema);