const dbPromise = require('../models/db');
const axios = require('axios');
const dayjs = require('dayjs');
require('dotenv').config();

async function getValidAccessToken() {
  const db = await dbPromise;
  const token = await db.get('SELECT * FROM zns_tokens ORDER BY id DESC LIMIT 1');

  if (token && dayjs(token.expires_at).isAfter(dayjs())) {
    return token.access_token;
  }

  return await refreshToken(token?.refresh_token);
}

async function refreshToken(refreshToken) {
  const res = await axios.post(process.env.ZALO_REFRESH_URL, {
    app_id: process.env.APP_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const data = res.data;
  const expiresAt = dayjs().add(data.expires_in, 'second').format('YYYY-MM-DD HH:mm:ss');

  await db.run('INSERT INTO zns_tokens (access_token, refresh_token, expires_at) VALUES (?, ?, ?)', [
    data.access_token, data.refresh_token, expiresAt
  ]);

  return data.access_token;
}

module.exports = {
  getValidAccessToken
};
