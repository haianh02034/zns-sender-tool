const axios = require('axios');
const { getValidAccessToken } = require('./tokenService');
const dbPromise = require('../models/db');
require('dotenv').config();

async function sendZNS(userId, templateId, data, trackingId) {
  const accessToken = await getValidAccessToken();
  let status = 'success';
  let message = 'Gửi thành công';

  try {
    const res = await axios.post(process.env.ZALO_SEND_API, {
      recipient: { user_id: userId },
      template_id: templateId,
      template_data: data,
      tracking_id: trackingId
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Ghi log
    const db = await dbPromise;
    await db.run('INSERT INTO zns_logs (user_id, template_id, tracking_id, status, message) VALUES (?, ?, ?, ?, ?)', [
      userId, templateId, trackingId, status, message
    ]);

    return res.data;

  } catch (error) {
    status = 'fail';
    message = error?.response?.data?.message || error.message;

    await db.run('INSERT INTO zns_logs (user_id, template_id, tracking_id, status, message) VALUES (?, ?, ?, ?, ?)', [
      userId, templateId, trackingId, status, message
    ]);

    throw new Error(message);
  }
}

async function getZNSAllTemplates() {
  const accessToken = await getValidAccessToken();
  try {
    const res = await axios.get(process.env.ZALO_GET_TEMPLATES_API, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  } catch (error) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

module.exports = {
  sendZNS,
  getZNSAllTemplates
};
