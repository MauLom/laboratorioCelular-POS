const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const FranchiseLocation = require("../models/FranchiseLocation");

const {
  createTransfer,
  courierScan,
  storeScan,
  getAllTransfers,
  getTransferById,
  deleteTransfer,
} = require("../controllers/transferController");

const detectDeviceBranch = async (req, res, next) => {
  try {
    const guid = req.headers["x-device-guid"];

    if (!guid) {
      console.warn("No se envió X-Device-Guid en transferencias");
      return next();
    }

    const location = await FranchiseLocation.findOne({ guid });

    if (!location) {
      console.warn("GUID sin sucursal asociada en Transferencias");
      return next();
    }

    req.deviceBranch = location.name;
    req.deviceBranchId = location._id;

    next();
  } catch (error) {
    console.error("❌ Error detectando sucursal desde GUID:", error);
    next();
  }
};

router.post(
  "/",
  authenticate,
  authorize(["Master admin", "Administrador", "Supervisor"]),
  createTransfer
);

router.get(
  "/",
  authenticate,
  detectDeviceBranch,
  authorize([
    "Master admin",
    "Administrador",
    "Supervisor",
    "Reparto",
    "Vendedor",
    "Cajero"
  ]),
  getAllTransfers
);

router.get(
  "/:id",
  authenticate,
  detectDeviceBranch,
  authorize([
    "Master admin",
    "Administrador",
    "Supervisor",
    "Reparto",
    "Vendedor",
    "Cajero"
  ]),
  getTransferById
);

router.put(
  "/:id/courier/items",
  authenticate,
  authorize(["Reparto"]),
  courierScan
);

router.put(
  "/:id/store/items",
  authenticate,
  authorize(["Vendedor", "Cajero"]),
  storeScan
);

router.delete(
  "/:id",
  authenticate,
  authorize(["Master admin", "Administrador", "Supervisor"]),
  deleteTransfer
);

module.exports = router;