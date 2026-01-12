const Transfer = require("../models/Transfer");
const Equipment = require("../models/InventoryItem");
const User = require("../models/User");
const mongoose = require("mongoose");
const FranchiseLocation = require("../models/FranchiseLocation");
const { ROLES } = require("../utils/roles");

const normalize = (x = "") => x.toString().trim().toLowerCase();

const BRANCH_NAMES = {
  hidalgo: "Hidalgo",
  maus: "Maus",
  "maus home": "Maus Home",
};

const displayBranch = (x = "") => {
  const key = normalize(x);
  return BRANCH_NAMES[key] || x;
};

exports.createTransfer = async (req, res) => {
  try {
    const { equipmentIds = [], toBranch, reason, assignedDeliveryUser } = req.body;
    const userId = req.user.id;

    let deliveryUserId = null; 

    if (assignedDeliveryUser) {
      const user = await User.findById(assignedDeliveryUser);

      if (!user || user.role !== ROLES.DELIVERY) {
        return res.status(400).json({
          message: "El usuario asignado no es un repartidor valido"
        });
      }
      deliveryUserId = user._id;
    } else {
      console.warn("No se envió repartidor asignado o llegó vacío:", assignedDeliveryUser);
    }  

    if (!Array.isArray(equipmentIds) || equipmentIds.length === 0) {
      return res.status(400).json({ message: "Debes enviar al menos 1 equipmentId" });
    }

    const equipments = await Equipment.find({
      _id: { $in: equipmentIds }
    }).populate("franchiseLocation", "name");

    if (equipments.length !== equipmentIds.length) {
      return res.status(404).json({ message: "Uno o más equipos no existen" });
    }

    const rawOrigin = equipments[0].franchiseLocation?.name || "";
    const originNorm = normalize(rawOrigin);

    const sameOrigin = equipments.every(
      (e) => normalize(e.franchiseLocation?.name || "") === originNorm
    );

    if (!sameOrigin) {
      return res.status(400).json({
        message: "Todos los equipos deben pertenecer a la misma sucursal de origen",
        branches: equipments.map((e) => e.franchiseLocation),
      });
    }

    const fromBranch = displayBranch(rawOrigin);

    const items = equipments.map((e) => ({
      equipment: e._id,
      imei: e.imei,
      courier: { status: "pending" },
      store: { status: "pending" },
    }));

    const transfer = await Transfer.create({
      code: "TR-" + Date.now(),
      fromBranch,
      toBranch: displayBranch(toBranch),
      items,
      requestedBy: userId,
      assignedDeliveryUser: deliveryUserId,
      reason: reason || "",
      status: "pending",
    });

    res.status(201).json({ message: "Transferencia creada", transfer });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.courierScan = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      actions = [],
      receivedItemId,
      notReceivedItemId,
      allReceived,
      allNotReceived,
      observation = "",
    } = req.body || {};

    const VALID_ITEM_STATUS = new Set(["pending", "received", "not_received"]);

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ message: "Transferencia no encontrada" });
    }

    if (Array.isArray(actions) && actions.length > 0) {
      actions.forEach((a) => {
        const item = transfer.items.find((i) => i.imei === a.imei);
        if (!item) return;

        const desired = (a.status || "").toLowerCase();
        if (!VALID_ITEM_STATUS.has(desired)) return;

        item.courier = item.courier || {};
        item.courier.status = desired;
        item.courier.observation = a.observation || "";
        item.courier.at = new Date();
        item.courier.by = req.user?.id;
      });
    }    

    if (allReceived) {
      transfer.items.forEach((item) => {
        item.courier = item.courier || {};
        item.courier.status = "received";
        item.courier.observation = observation;
        item.courier.at = new Date();
        item.courier.by = req.user?.id;
      });
    }    

    if (allNotReceived) {
      transfer.items.forEach((item) => {
        item.courier = item.courier || {};
        item.courier.status = "not_received";
        item.courier.observation = observation;
        item.courier.at = new Date();
        item.courier.by = req.user?.id;
      });
    }

    if (receivedItemId) {
      transfer.items = transfer.items.map((item) => {
        if (item._id.toString() === receivedItemId) {
          item.courier = item.courier || {};
          item.courier.status = "received";
          item.courier.observation = observation;
          item.courier.at = new Date();
          item.courier.by = req.user?.id;
        }
        return item;
      });
    }

    if (notReceivedItemId) {
      transfer.items = transfer.items.map((item) => {
        if (item._id.toString() === notReceivedItemId) {
          item.courier = item.courier || {};
          item.courier.status = "not_received";
          item.courier.observation = observation;
          item.courier.at = new Date();
          item.courier.by = req.user?.id;
        }
        return item;
      });
    }

    const courierReceived = transfer.items.filter(
      (i) => (i.courier?.status || "pending") === "received"
    ).length;
    transfer.courierReceived = courierReceived;

    if (typeof transfer.recomputeStatus === "function") {
      transfer.recomputeStatus();
    }  

    await transfer.save();

    res.json({
      message:
        allNotReceived
          ? "Todos los equipos marcados como no recibidos"
          : allReceived
          ? "Todos los equipos marcados como recibidos"
          : receivedItemId
          ? "Equipo marcado como recibido"
          : "Equipo marcado como no recibido",
      transfer,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar transferencia", error });
  }
};  
         

exports.storeScan = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      actions = [],
      receivedItemId,
      notReceivedItemId,
      allReceived,
      allNotReceived,
      observation = "",
    } = req.body || {};

    const transfer = await Transfer.findById(id).populate("items.equipment");
    if (!transfer) {
      return res.status(404).json({ message: "Transferencia no encontrada" });
    }

    if (Array.isArray(actions) && actions.length > 0) {
      actions.forEach(a => {
        const item = transfer.items.find(i => i.imei === a.imei);
        if (!item) return;

        const desired = (a.status || "").toLowerCase();
        if (!["pending", "received", "not_received"].includes(desired)) return;

        item.store = item.store || {};
        item.store.status = desired;
        item.store.observation = a.observation || "";
        item.store.at = new Date();
        item.store.by = req.user?.id;
      });
    }

    if (allReceived) {
      transfer.items.forEach(item => {
        item.store = {
          status: "received",
          at: new Date(),
          by: req.user?.id,
        };
      });
    }

    if (allNotReceived) {
      transfer.items.forEach(item => {
        item.store = {
          status: "not_received",
          at: new Date(),
          by: req.user?.id,
        };
      });
    }

    if (receivedItemId) {
      transfer.items.forEach(item => {
        if (item._id.toString() === receivedItemId) {
          item.store = {
            status: "received",
            at: new Date(),
            by: req.user?.id,
          };
        }
      });
    }

    if (notReceivedItemId) {
      transfer.items.forEach(item => {
        if (item._id.toString() === notReceivedItemId) {
          item.store = {
            status: "not_received",
            at: new Date(),
            by: req.user?.id,
          };
        }
      });
    }

    transfer.storeReceived = transfer.items.filter(
      i => i.store?.status === "received"
    ).length;

    if (typeof transfer.recomputeStatus === "function") {
      transfer.recomputeStatus();
    }

    try {
      const FranchiseLocation = mongoose.model("FranchiseLocation");

      const targetBranch = await FranchiseLocation.findOne({
        name: transfer.toBranch
      });

      if (targetBranch) {
        for (const item of transfer.items) {
          if (item.store?.status === "received") {

            const originalState = item.equipment.state;

            await Equipment.findByIdAndUpdate(item.equipment._id, {
              franchiseLocation: targetBranch._id,
              state: originalState
            });
          }
        }
      }
    } catch (err) {
      console.error("Error actualizando inventario:", err);
    }

    await transfer.save();

    res.json({
      message: "Actualizado correctamente",
      transfer,
    });

  } catch (error) {
    console.error("Error en storeScan:", error);
    res.status(500).json({
      message: "Error al actualizar recepción en sucursal",
      error,
    });
  }
};

exports.getAllTransfers = async (req, res) => {
  try {
    let query = {};
    const role = req.user.role;

    const {
      imei,
      fromBranch,
      toBranch,
      date,
      startDate,
      endDate
    } = req.query;  

    if (role === ROLES.DELIVERY) {
      query.assignedDeliveryUser = req.user.id;
    }

    else if ([ROLES.SELLER, ROLES.CASHIER].includes(role)) {

      const branchId = req.headers["x-branch-id"];

      if (!branchId) {
        console.warn("No se envió x-branch-id en transferencias");
        return res.json([]);
      }

      const location = await FranchiseLocation.findById(branchId);

      if (!location) {
        console.warn("Sucursal inválida para ese branchId");
        return res.json([]);
      }

      const deviceBranch = location.name;

      query = {
        $or: [
          { fromBranch: deviceBranch },
          { toBranch: deviceBranch, status: { $ne: "pending" } }
        ]
      };
    }

    if (
      [ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.SUPERVISOR].includes(role)
    ) {

      if (imei) {
        query["items.imei"] = imei.trim();
      }

      if (fromBranch) {
        query.fromBranch = displayBranch(fromBranch);
      }

      if (toBranch) {
        query.toBranch = displayBranch(toBranch);
      }

      if (date) {
        const d = new Date(date);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);

        query.createdAt = { $gte: start, $lte: end };
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
    }

    const hasFilters =
      imei || fromBranch || toBranch || date || startDate || endDate;

    const q = Transfer.find(query)
      .populate("requestedBy", "firstName lastName role")
      .populate("assignedDeliveryUser", "firstName lastName role")
      .populate("items.equipment", "brand model imei franchiseLocation")
      .sort({ createdAt: -1 });

      if (!hasFilters) {
        q.limit(10);
      }
      
    const transfers = await q;  

    res.json(transfers.map(t => ({
      _id: t._id,
      code: t.code,
      fromBranch: t.fromBranch,
      toBranch: t.toBranch,
      status: t.status,
      totalItems: t.items.length,
      courierReceived: t.items.filter(i => i.courier.status === "received").length,
      storeReceived: t.items.filter(i => i.store.status === "received").length,
      assignedDeliveryUser: t.assignedDeliveryUser?._id?.toString() || null
    })));

  } catch (error) {
    console.error("Error getAllTransfers:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTransferById = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    if (req.user.role === ROLES.DELIVERY) {
      query.assignedDeliveryUser = req.user.id;
    }

    const t = await Transfer.findOne(query)
      .populate("requestedBy", "firstName lastName email role")
      .populate("assignedDeliveryUser", "firstName lastName email role")
      .populate("receivedBy", "firstName lastName email role")
      .populate("items.equipment", "brand model imei state franchiseLocation")
      .populate("items.courier.by", "firstName lastName email role")
      .populate("items.store.by", "firstName lastName email role");

    if (!t)
      return res
        .status(404)
        .json({ message: "Transferencia no encontrada" });

    const out = t.toObject();

    out.fromBranch = displayBranch(out.fromBranch);
    out.toBranch = displayBranch(out.toBranch);

    res.json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ message: "Transferencia no encontrada" });
    }

    if (
      ["in_transit_complete", "completed"].includes(transfer.status) &&
      req.user.role !== ROLES.MASTER_ADMIN
    ) {
      return res.status(400).json({
        message: "No puedes eliminar una transferencia ya completada.",
      });
    } 

    await Transfer.findByIdAndDelete(id);

    res.json({ message: "Transferencia eliminada correctamente" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};