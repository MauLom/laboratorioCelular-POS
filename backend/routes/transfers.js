const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");

router.use((req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    let rawData = "";
    req.on("data", chunk => rawData += chunk);
    req.on("end", () => {
      try {
        req.body = JSON.parse(rawData);
      } catch {
      }
      next();
    });
  } else {
    next();
  }
});

const {
  createTransfer,
  courierScan,
  storeScan,
  getAllTransfers,
  getTransferById,
  deleteTransfer,
} = require("../controllers/transferController");

router.post(
  "/",
  authenticate,
  authorize(["Master admin", "Administrador", "Supervisor"]),
  (req, res, next) => {
    console.log("Body recibido (tras middleware):", req.body);
    next();
  },
  createTransfer
);

router.get(
  "/",
  authenticate,
  authorize(["Master admin", "Administrador", "Supervisor", "Reparto", "Vendedor", "Cajero"]),
  getAllTransfers
);

router.get(
  "/:id",
  authenticate,
  authorize([
    "Master admin",
    "Administrador",
    "Supervisor",
    "Reparto",
    "Vendedor",
    "Cajero",
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