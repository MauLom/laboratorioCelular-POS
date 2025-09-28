
'use server';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  setDoc,
  getDoc,
  Timestamp, 
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import type { ProductType, InventoryItem, LogEntry, UserRole, LogEntryDetails_ITEMS_TRANSFERRED } from '@/types/inventory';

// === ProductTypes ===
const PRODUCT_TYPES_COLLECTION = 'productTypes';

export const getProductTypesFromFirestore = async (): Promise<ProductType[]> => {
  try {
    const q = query(collection(db, PRODUCT_TYPES_COLLECTION), orderBy("brand"), orderBy("model"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductType));
  } catch (error) {
    console.error("Error fetching product types: ", error);
    throw error;
  }
};

export const addProductTypeToFirestore = async (productTypeData: Omit<ProductType, 'id'>): Promise<ProductType> => {
  try {
    // Use Firestore's auto-generated ID as the primary ID
    const docRef = await addDoc(collection(db, PRODUCT_TYPES_COLLECTION), {
      ...productTypeData, // Store brand and model
    });
    return { id: docRef.id, ...productTypeData };
  } catch (error) {
    console.error("Error adding product type: ", error);
    throw error;
  }
};

// === InventoryItems ===
const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';

export const getInventoryItemsFromFirestore = async (): Promise<InventoryItem[]> => {
  try {
    const q = query(collection(db, INVENTORY_ITEMS_COLLECTION), orderBy("imei"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();

      let purchaseInvoiceDateStr = data.purchaseInvoiceDate;
      if (data.purchaseInvoiceDate instanceof Timestamp) {
        purchaseInvoiceDateStr = data.purchaseInvoiceDate.toDate().toISOString().split('T')[0]; 
      } else if (data.purchaseInvoiceDate instanceof Date) { 
        purchaseInvoiceDateStr = data.purchaseInvoiceDate.toISOString().split('T')[0];
      } else if (typeof data.purchaseInvoiceDate !== 'string') {
        console.warn(`Inventory item ${doc.id} has invalid purchaseInvoiceDate type:`, data.purchaseInvoiceDate);
        purchaseInvoiceDateStr = new Date().toISOString().split('T')[0];
      }

      const item: InventoryItem = {
        imei: doc.id, 
        imei2: data.imei2,
        productTypeId: data.productTypeId,
        storeId: data.storeId,
        memory: data.memory,
        color: data.color, // Fetch color
        supplier: data.supplier,
        purchasePrice: Number(data.purchasePrice) || 0,
        purchaseInvoiceId: data.purchaseInvoiceId,
        purchaseInvoiceDate: purchaseInvoiceDateStr,
        status: data.status || "Nuevo", 
      };
      return item;
    });
  } catch (error) {
    console.error("Error fetching inventory items: ", error);
    throw error;
  }
};

export const addInventoryItemToFirestore = async (itemData: InventoryItem): Promise<InventoryItem> => {
  try {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemData.imei);
    
    if (itemData.purchaseInvoiceDate && typeof itemData.purchaseInvoiceDate !== 'string') {
        itemData.purchaseInvoiceDate = format(new Date(itemData.purchaseInvoiceDate as any), "yyyy-MM-dd");
    }
    // Ensure color is either a string or removed if undefined/null before saving
    const dataToSave = { ...itemData };
    if (dataToSave.color === undefined || dataToSave.color === null || dataToSave.color === '') {
      delete (dataToSave as any).color;
    }

    await setDoc(itemDocRef, dataToSave);
    return itemData; 
  } catch (error) {
    console.error("Error adding inventory item: ", error);
    throw error;
  }
};

export const addMultipleInventoryItemsToFirestore = async (itemsData: InventoryItem[]): Promise<InventoryItem[]> => {
  const batch = writeBatch(db);
  const processedItems: InventoryItem[] = [];

  itemsData.forEach(itemData => {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, itemData.imei);
    const processedItem = { ...itemData };
    if (processedItem.purchaseInvoiceDate && typeof processedItem.purchaseInvoiceDate !== 'string') {
      processedItem.purchaseInvoiceDate = format(new Date(processedItem.purchaseInvoiceDate as any), "yyyy-MM-dd");
    }
    // Ensure color is either a string or removed if undefined/null before saving
    if (processedItem.color === undefined || processedItem.color === null || processedItem.color === '') {
      delete (processedItem as any).color;
    }
    batch.set(itemDocRef, processedItem);
    processedItems.push(itemData); // Return original itemData
  });

  try {
    await batch.commit();
    return processedItems;
  } catch (error) {
    console.error("Error adding multiple inventory items: ", error);
    throw error;
  }
};


export const updateInventoryItemInFirestore = async (imei: string, updates: Partial<InventoryItem>): Promise<void> => {
  try {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, imei);
    const updatesToSave = { ...updates };
    if (updatesToSave.purchaseInvoiceDate && typeof updatesToSave.purchaseInvoiceDate !== 'string') {
        updatesToSave.purchaseInvoiceDate = format(new Date(updatesToSave.purchaseInvoiceDate as any), "yyyy-MM-dd");
    }
    // Ensure color is handled correctly for updates (can be set to a value or removed if empty string/null)
    if ('color' in updatesToSave) {
        if (updatesToSave.color === undefined || updatesToSave.color === null || updatesToSave.color === '') {
            (updatesToSave as any).color = null; // Or use delete updatesToSave.color; if you want to remove the field
        }
    }
    await updateDoc(itemDocRef, updatesToSave);
  } catch (error) {
    console.error(`Error updating inventory item ${imei}: `, error);
    throw error;
  }
};

export const deleteInventoryItemFromFirestore = async (imei: string): Promise<void> => {
  try {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, imei);
    await deleteDoc(itemDocRef);
  } catch (error) {
    console.error(`Error deleting inventory item ${imei}: `, error);
    throw error;
  }
};

export const bulkUpdateInventoryItemsInFirestore = async (imeis: string[], updates: Partial<InventoryItem>): Promise<void> => {
  const batch = writeBatch(db);
  const updatesToSave = { ...updates };
  
  if (updatesToSave.purchaseInvoiceDate && typeof updatesToSave.purchaseInvoiceDate !== 'string') {
      updatesToSave.purchaseInvoiceDate = format(new Date(updatesToSave.purchaseInvoiceDate as any), "yyyy-MM-dd");
  }
  if ('color' in updatesToSave) {
      if (updatesToSave.color === undefined || updatesToSave.color === null || updatesToSave.color === '') {
        (updatesToSave as any).color = null; 
      }
  }

  imeis.forEach(imei => {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, imei);
    batch.update(itemDocRef, updatesToSave);
  });
  try {
    await batch.commit();
  } catch (error) {
    console.error("Error in bulk update of inventory items: ", error);
    throw error;
  }
};

export const bulkDeleteInventoryItemsFromFirestore = async (imeis: string[]): Promise<void> => {
  const batch = writeBatch(db);
  imeis.forEach(imei => {
    const itemDocRef = doc(db, INVENTORY_ITEMS_COLLECTION, imei);
    batch.delete(itemDocRef);
  });
  try {
    await batch.commit();
  } catch (error) {
    console.error("Error in bulk delete of inventory items: ", error);
    throw error;
  }
}


const convertDetailTimestampsToString = (details: any): Record<string, any> => {
  if (!details || typeof details !== 'object') return details || {};
  const newDetails = { ...details }; 
  const timestampDetailFields = ['adminConfirmationTimestamp', 'consultasUserConfirmationTimestamp', 'completionTimestamp'];
  timestampDetailFields.forEach(field => {
    if (newDetails[field]) {
      if (newDetails[field] instanceof Timestamp) {
        newDetails[field] = newDetails[field].toDate().toISOString();
      } else if (newDetails[field] instanceof Date) {
        newDetails[field] = newDetails[field].toISOString();
      }
    }
  });
  return newDetails;
};


const ACTIVITY_LOGS_COLLECTION = 'activityLogs';

export const getActivityLogsFromFirestore = async (): Promise<LogEntry[]> => {
  try {
    const q = query(collection(db, ACTIVITY_LOGS_COLLECTION), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      let timestampStr = data.timestamp;
      if (data.timestamp instanceof Timestamp) {
        timestampStr = data.timestamp.toDate().toISOString();
      } else if (data.timestamp instanceof Date) { 
        timestampStr = data.timestamp.toISOString();
      } else if (typeof data.timestamp !== 'string') {
        console.warn(`Log entry ${docSnapshot.id} has invalid timestamp type:`, data.timestamp);
        timestampStr = new Date().toISOString();
      }
      const processedDetails = convertDetailTimestampsToString(data.details);
      const logEntry: LogEntry = {
        id: docSnapshot.id,
        action: data.action,
        user: data.user,
        userRole: data.userRole,
        details: processedDetails,
        timestamp: timestampStr,
      };
      return logEntry;
    });
  } catch (error) {
    console.error("Error fetching activity logs: ", error);
    throw error;
  }
};

export const addActivityLogToFirestore = async (logEntryData: LogEntry): Promise<LogEntry> => {
  try {
    const logDocRef = doc(db, ACTIVITY_LOGS_COLLECTION, logEntryData.id);
    if (typeof logEntryData.timestamp !== 'string') {
        logEntryData.timestamp = (logEntryData.timestamp as Date).toISOString();
    }
    logEntryData.details = convertDetailTimestampsToString(logEntryData.details);
    await setDoc(logDocRef, logEntryData);
    return logEntryData;
  } catch (error) {
    console.error("Error adding activity log: ", error);
    throw error;
  }
};

export const updateActivityLogInFirestore = async (logId: string, updates: Partial<LogEntry>): Promise<void> => {
  try {
    const logDocRef = doc(db, ACTIVITY_LOGS_COLLECTION, logId);
    if (updates.details) {
      updates.details = convertDetailTimestampsToString(updates.details);
    }
    if (updates.timestamp && typeof updates.timestamp !== 'string') {
        updates.timestamp = (updates.timestamp as Date).toISOString();
    }
    await updateDoc(logDocRef, updates as Record<string, any>); 
  } catch (error) {
    console.error(`Error updating activity log ${logId}: `, error);
    throw error;
  }
};

// Helper to format date consistently, used in Firestore service
const format = (date: Date, formatString: string): string => {
  // Basic YYYY-MM-DD for now, as date-fns format is client-side
  if (formatString === "yyyy-MM-dd") {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const day = (`0${d.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
  }
  // Fallback or extend for other formats if needed server-side
  return date.toISOString(); 
};

    
