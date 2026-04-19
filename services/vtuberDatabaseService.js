import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { realtimeDb } from './firebaseConfig';

const VTUBERS_PATH = 'vtubers';
const VTUBER_SELECTIONS_PATH = 'vtuberSelections';

// VTuber data functions
export const syncVtubersToDatabase = async (vtubers) => {
  try {
    const dbRef = ref(realtimeDb, VTUBERS_PATH);
    const data = {};
    vtubers.forEach(vtuber => {
      data[vtuber.id] = vtuber;
    });
    await set(dbRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error syncing vtubers:', error);
    return { success: false, error: error.message };
  }
};

export const fetchVtubersFromDatabase = async () => {
  try {
    const dbRef = ref(realtimeDb, VTUBERS_PATH);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error('Error fetching vtubers:', error);
    return [];
  }
};

export const addVtuber = async (vtuber) => {
  try {
    const dbRef = ref(realtimeDb, `${VTUBERS_PATH}/${vtuber.id}`);
    await set(dbRef, vtuber);
    return { success: true };
  } catch (error) {
    console.error('Error adding vtuber:', error);
    return { success: false, error: error.message };
  }
};

export const updateVtuber = async (id, updates) => {
  try {
    const dbRef = ref(realtimeDb, `${VTUBERS_PATH}/${id}`);
    await update(dbRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating vtuber:', error);
    return { success: false, error: error.message };
  }
};

export const deleteVtuber = async (id) => {
  try {
    const dbRef = ref(realtimeDb, `${VTUBERS_PATH}/${id}`);
    await remove(dbRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting vtuber:', error);
    return { success: false, error: error.message };
  }
};

// Real-time listener for vtubers
export const subscribeToVtubers = (callback) => {
  const dbRef = ref(realtimeDb, VTUBERS_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const vtubers = Object.values(data);
      callback(vtubers);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to vtubers:', error);
  });

  return () => off(dbRef, 'value', listener);
};

// VTuber selections functions
export const syncVtuberSelectionsToDatabase = async (selections) => {
  try {
    const dbRef = ref(realtimeDb, VTUBER_SELECTIONS_PATH);
    const data = {};
    selections.forEach(selection => {
      data[selection.vtuberDataid] = selection;
    });
    await set(dbRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error syncing vtuber selections:', error);
    return { success: false, error: error.message };
  }
};

export const fetchVtuberSelectionsFromDatabase = async () => {
  try {
    const dbRef = ref(realtimeDb, VTUBER_SELECTIONS_PATH);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  } catch (error) {
    console.error('Error fetching vtuber selections:', error);
    return [];
  }
};

export const updateVtuberSelection = async (vtuberDataid, selectedIds) => {
  try {
    const dbRef = ref(realtimeDb, `${VTUBER_SELECTIONS_PATH}/${vtuberDataid}`);
    await update(dbRef, { selectedvtuberDataids: selectedIds });
    return { success: true };
  } catch (error) {
    console.error('Error updating vtuber selection:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe to vtuber selections changes
export const subscribeToVtuberSelections = (callback) => {
  const dbRef = ref(realtimeDb, VTUBER_SELECTIONS_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const selections = Object.values(data);
      callback(selections);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to vtuber selections:', error);
  });

  return () => off(dbRef, 'value', listener);
};

// VTuber In Use Functions (ติดตามตัวละครที่กำลังใช้งาน)
const VTUBER_IN_USE_PATH = 'vtubersInUse';

export const addCharacterInUse = async (characterId) => {
  try {
    console.log('🔒 Adding character in use:', characterId);
    const dbRef = ref(realtimeDb, `${VTUBER_IN_USE_PATH}/${characterId}`);
    await set(dbRef, {
      characterId,
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Character added to vtubersInUse:', characterId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error adding character in use:', error);
    return { success: false, error: error.message };
  }
};

export const removeCharacterInUse = async (characterId) => {
  try {
    const dbRef = ref(realtimeDb, `${VTUBER_IN_USE_PATH}/${characterId}`);
    await remove(dbRef);
    return { success: true };
  } catch (error) {
    console.error('Error removing character in use:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToVtubersInUse = (callback) => {
  const dbRef = ref(realtimeDb, VTUBER_IN_USE_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const inUseIds = Object.keys(data);
      console.log('👁️ Characters in use:', inUseIds);
      callback(inUseIds);
    } else {
      console.log('👁️ No characters in use');
      callback([]);
    }
  }, (error) => {
    console.error('❌ Error subscribing to vtubers in use:', error);
  });

  return () => off(dbRef, 'value', listener);
};

export const deleteAllVtubersInUse = async () => {
  try {
    console.log('🧹 Deleting all vtubersInUse...');
    const dbRef = ref(realtimeDb, VTUBER_IN_USE_PATH);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      await remove(dbRef);
      console.log('✅ All vtubersInUse deleted');
      return { success: true };
    } else {
      console.log('ℹ️ No vtubersInUse to delete');
      return { success: true };
    }
  } catch (error) {
    console.error('❌ Error deleting all vtubersInUse:', error);
    return { success: false, error: error.message };
  }
};

// User Selection Functions (ใครเลือกใคร)
const USER_SELECTIONS_PATH = 'userSelections';

// Save user selection (ใครเลือกใคร)
export const saveUserSelection = async (selectionData) => {
  try {
    const selectionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dbRef = ref(realtimeDb, `${USER_SELECTIONS_PATH}/${selectionId}`);
    const dataToSave = {
      ...selectionData,
      timestamp: new Date().toISOString(),
      selectionId,
    };
    await set(dbRef, dataToSave);
    return { success: true, selectionId };
  } catch (error) {
    console.error('Error saving user selection:', error);
    return { success: false, error: error.message };
  }
};

// Fetch all user selections
export const fetchUserSelections = async () => {
  try {
    const dbRef = ref(realtimeDb, USER_SELECTIONS_PATH);
    const snapshot = await get(dbRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const selections = Object.entries(data).map(([id, selection]) => ({ id, ...selection }));
      // Sort by timestamp descending (newest first)
      selections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return selections;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user selections:', error);
    return [];
  }
};

// Subscribe to user selections real-time updates
export const subscribeToUserSelections = (callback) => {
  const dbRef = ref(realtimeDb, USER_SELECTIONS_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const selections = Object.entries(data).map(([id, selection]) => ({ id, ...selection }));
      // Sort by timestamp descending
      selections.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      callback(selections);
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to user selections:', error);
  });

  return () => off(dbRef, 'value', listener);
};

// Delete all user selections (ทำให้สะอาดสำหรับรอบใหม่)
export const deleteAllUserSelections = async () => {
  try {
    console.log('Starting delete all user selections...');
    const dbRef = ref(realtimeDb, USER_SELECTIONS_PATH);

    // First, try to fetch to confirm path exists
    const snapshot = await get(dbRef);
    console.log('Current data exists:', snapshot.exists());

    if (snapshot.exists()) {
      console.log('Data found, attempting to delete...');
      // Delete the entire path
      await remove(dbRef);
      console.log('Delete successful');
      return { success: true };
    } else {
      console.log('No data to delete, but returning success');
      return { success: true };
    }
  } catch (error) {
    console.error('Error deleting user selections:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    return { success: false, error: error.message };
  }
};

// Active Preview Functions (สำหรับคุมหน้าจอ Lowerthird)
const ACTIVE_PREVIEW_PATH = 'activePreview';

export const setActivePreview = async (selectionData) => {
  try {
    const dbRef = ref(realtimeDb, ACTIVE_PREVIEW_PATH);
    await set(dbRef, {
      ...selectionData,
      status: 'active',
      triggerTime: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error setting active preview:', error);
    return { success: false, error: error.message };
  }
};

export const clearActivePreview = async () => {
  try {
    const dbRef = ref(realtimeDb, ACTIVE_PREVIEW_PATH);
    await remove(dbRef);
    return { success: true };
  } catch (error) {
    console.error('Error clearing active preview:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToActivePreview = (callback) => {
  const dbRef = ref(realtimeDb, ACTIVE_PREVIEW_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error subscribing to active preview:', error);
  });

  return () => off(dbRef, 'value', listener);
};

// Text Boxes Functions (กล่องข้อความแสดงบนหน้าจอ)
const TEXT_BOXES_PATH = 'textBoxes';

export const saveTextBoxes = async (textBoxes) => {
  try {
    const dbRef = ref(realtimeDb, TEXT_BOXES_PATH);
    await set(dbRef, textBoxes);
    return { success: true };
  } catch (error) {
    console.error('Error saving text boxes:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToTextBoxes = (callback) => {
  const dbRef = ref(realtimeDb, TEXT_BOXES_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  }, (error) => {
    console.error('Error subscribing to text boxes:', error);
  });

  return () => off(dbRef, 'value', listener);
};

// Text Boxes Config (ตำแหน่งและการตั้งค่า)
const TEXT_BOXES_CONFIG_PATH = 'textBoxesConfig';

export const saveTextBoxesConfig = async (config) => {
  try {
    const dbRef = ref(realtimeDb, TEXT_BOXES_CONFIG_PATH);
    await set(dbRef, config);
    return { success: true };
  } catch (error) {
    console.error('Error saving text boxes config:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToTextBoxesConfig = (callback) => {
  const dbRef = ref(realtimeDb, TEXT_BOXES_CONFIG_PATH);
  const listener = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({ bottom: 40, left: 50 });
    }
  }, (error) => {
    console.error('Error subscribing to text boxes config:', error);
  });

  return () => off(dbRef, 'value', listener);
};
