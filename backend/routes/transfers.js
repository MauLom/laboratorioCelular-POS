const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const FranchiseLocation = require("../models/FranchiseLocation");
const { ROLES } = require('../utils/roles');

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
  authorize([ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.MULTI_BRANCH_SUPERVISOR, ROLES.OFFICE_SUPERVISOR]),
  createTransfer
);

router.get(
  "/",
  authenticate,
  detectDeviceBranch,
  authorize([
    ROLES.MASTER_ADMIN,
    ROLES.ADMIN,
    ROLES.MULTI_BRANCH_SUPERVISOR,
    ROLES.OFFICE_SUPERVISOR,
    ROLES.DELIVERY,
    ROLES.SELLER,
    ROLES.CASHIER
  ]),
  getAllTransfers
);

router.get(
  "/:id",
  authenticate,
  detectDeviceBranch,
  authorize([
    ROLES.MASTER_ADMIN,
    ROLES.ADMIN,
    ROLES.MULTI_BRANCH_SUPERVISOR,
    ROLES.OFFICE_SUPERVISOR,
    ROLES.DELIVERY,
    ROLES.SELLER,
    ROLES.CASHIER
  ]),
  getTransferById
);

router.put(
  "/:id/courier/items",
  authenticate,
  authorize([ROLES.DELIVERY]),
  courierScan
);

router.put(
  "/:id/store/items",
  authenticate,
  authorize([ROLES.SELLER, ROLES.CASHIER]),
  storeScan
);

router.delete(
  "/:id",
  authenticate,
  authorize([ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.MULTI_BRANCH_SUPERVISOR, ROLES.OFFICE_SUPERVISOR]),
  deleteTransfer
);

module.exports = router;