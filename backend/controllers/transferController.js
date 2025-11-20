const Transfer = require("../models/Transfer");
const Equipment = require("../models/InventoryItem");
const User = require("../models/User");
const mongoose = require("mongoose");

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

      if (!user || user.role !== "Reparto") {
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
      courier: { status: "pendiente" },
      store: { status: "pendiente" },
    }));

    const transfer = await Transfer.create({
      code: "TR-" + Date.now(),
      fromBranch,
      toBranch: displayBranch(toBranch),
      items,
      requestedBy: userId,
      assignedDeliveryUser: deliveryUserId,
      reason: reason || "",
      status: "pendiente",
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

    const VALID_ITEM_STATUS = new Set(["pendiente", "recibido", "no_recibido"]);

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
        item.courier.status = "recibido";
        item.courier.observation = observation;
        item.courier.at = new Date();
        item.courier.by = req.user?.id;
      });
    }    

    if (allNotReceived) {
      transfer.items.forEach((item) => {
        item.courier = item.courier || {};
        item.courier.status = "no_recibido";
        item.courier.observation = observation;
        item.courier.at = new Date();
        item.courier.by = req.user?.id;
      });
    }

    if (receivedItemId) {
      transfer.items = transfer.items.map((item) => {
        if (item._id.toString() === receivedItemId) {
          item.courier = item.courier || {};
          item.courier.status = "recibido";
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
          item.courier.status = "no_recibido";
          item.courier.observation = observation;
          item.courier.at = new Date();
          item.courier.by = req.user?.id;
        }
        return item;
      });
    }

    const courierReceived = transfer.items.filter(
      (i) => (i.courier?.status || "pendiente") === "recibido"
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
        if (!["pendiente", "recibido", "no_recibido"].includes(desired)) return;

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
          status: "recibido",
          at: new Date(),
          by: req.user?.id,
        };
      });
    }

    if (allNotReceived) {
      transfer.items.forEach(item => {
        item.store = {
          status: "no_recibido",
          at: new Date(),
          by: req.user?.id,
        };
      });
    }

    if (receivedItemId) {
      transfer.items.forEach(item => {
        if (item._id.toString() === receivedItemId) {
          item.store = {
            status: "recibido",
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
            status: "no_recibido",
            at: new Date(),
            by: req.user?.id,
          };
        }
      });
    }

    transfer.storeReceived = transfer.items.filter(
      i => i.store?.status === "recibido"
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
          if (item.store?.status === "recibido") {

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

    if (req.user.role === "Reparto") {
      query = { assignedDeliveryUser: new mongoose.Types.ObjectId(req.user.id) };
    }  
    
    const transfers = await Transfer.find(query)
      .populate("requestedBy", "firstName lastName role")
      .populate("assignedDeliveryUser", "firstName lastName role")
      .populate("items.equipment", "brand model imei franchiseLocation")
      .sort({ createdAt: -1 });
    const shaped = transfers.map((t) => ({
      _id: t._id,
      code: t.code,
      fromBranch: displayBranch(t.fromBranch),
      toBranch: displayBranch(t.toBranch),
      status: t.status,
      totalItems: t.items.length,
      courierReceived: t.items.filter((i) => i.courier.status === "recibido").length,
      storeReceived: t.items.filter((i) => i.store.status === "recibido").length,
      createdAt: t.createdAt,
      assignedDeliveryUser: t.assignedDeliveryUser?._id?.toString() || null
    }));

    res.json(shaped);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTransferById = async (req, res) => {
  try {
    let query = { _id: req.params.id };

    if (req.user.role === "Reparto") {
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

    if (transfer.status.includes("entregada")) {
      return res.status(400).json({
        message: "No puedes eliminar una transferencia ya entregada.",
      });
    }

    await Transfer.findByIdAndDelete(id);

    res.json({ message: "Transferencia eliminada correctamente" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};