const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

let notificationQueue = null;

const getNotificationQueue = () => {
  if (!notificationQueue) {
    notificationQueue = new Queue('smarttax-notifications', { connection });
  }
  return notificationQueue;
};

const startWorkers = () => {
  const worker = new Worker(
    'smarttax-notifications',
    async (job) => {
      const { notifyUser } = require('../services/notificationService');
      await notifyUser(job.data.userId, job.data.type, job.data.overrides || {});
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error('[BullMQ] job failed', job?.id, err.message);
  });

  connection.connect().catch(() => {
    console.warn('⚠️ Redis not available — BullMQ workers disabled (cron still runs)');
  });

  return worker;
};

const enqueueNotification = async (userId, type, overrides = {}) => {
  try {
    const queue = getNotificationQueue();
    await connection.connect();
    await queue.add('notify', { userId, type, overrides }, { removeOnComplete: true });
  } catch {
    const { notifyUser } = require('../services/notificationService');
    await notifyUser(userId, type, overrides);
  }
};

module.exports = { getNotificationQueue, startWorkers, enqueueNotification, connection };
