// backend/controllers/syncController.js
const SyncQueue = require('../models/SyncQueue');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

exports.syncData = async (req, res) => {
  try {
    const { offlineData, type } = req.body;
    
    const syncItem = new SyncQueue({
      businessId: req.user.businessId,
      operation: type,
      data: offlineData,
      status: 'pending'
    });
    
    await syncItem.save();
    
    // Process sync immediately if possible
    processSyncItem(syncItem);
    
    res.json({ message: 'Data queued for sync', syncId: syncItem._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sync failed' });
  }
};

exports.getPendingSyncItems = async (req, res) => {
  try {
    const pendingItems = await SyncQueue.find({
      businessId: req.user.businessId,
      status: { $in: ['pending', 'failed'] }
    }).sort({ createdAt: 1 });
    
    res.json(pendingItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resolveConflict = async (req, res) => {
  try {
    const { syncId, resolution, resolvedData } = req.body;
    
    const syncItem = await SyncQueue.findById(syncId);
    
    if (!syncItem) {
      return res.status(404).json({ message: 'Sync item not found' });
    }
    
    if (resolution === 'server') {
      // Keep server data, discard client data
      syncItem.status = 'resolved';
      await syncItem.save();
    } else if (resolution === 'client') {
      // Override server with client data
      await processSyncItemWithData(syncItem, resolvedData);
    } else if (resolution === 'merge') {
      // Merge both versions
      await mergeData(syncItem.data, resolvedData);
    }
    
    res.json({ message: 'Conflict resolved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forceSync = async (req, res) => {
  try {
    const pendingItems = await SyncQueue.find({
      businessId: req.user.businessId,
      status: 'pending'
    });
    
    for (const item of pendingItems) {
      await processSyncItem(item);
    }
    
    res.json({ message: 'Force sync completed', processed: pendingItems.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sync failed' });
  }
};

exports.getSyncStatus = async (req, res) => {
  try {
    const stats = await SyncQueue.aggregate([
      { $match: { businessId: req.user.businessId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

async function processSyncItem(syncItem) {
  try {
    syncItem.status = 'processing';
    await syncItem.save();
    
    let result;
    switch (syncItem.operation) {
      case 'create_sale':
        const sale = new Sale(syncItem.data);
        result = await sale.save();
        break;
      case 'update_product':
        result = await Product.findByIdAndUpdate(
          syncItem.data._id,
          syncItem.data,
          { new: true }
        );
        break;
    }
    
    syncItem.status = 'completed';
    syncItem.processedAt = new Date();
    await syncItem.save();
    
    return result;
  } catch (error) {
    syncItem.status = 'failed';
    syncItem.error = error.message;
    syncItem.retryCount += 1;
    await syncItem.save();
    throw error;
  }
}

async function processSyncItemWithData(syncItem, newData) {
  // Override with new data
  syncItem.data = newData;
  await processSyncItem(syncItem);
}

async function mergeData(clientData, serverData) {
  // Implement merge logic based on data type
  const merged = { ...serverData, ...clientData };
  return merged;
}