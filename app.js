const express = require('express');
const path = require('path');
const app = express();
const znsRoutes = require('./routes/znsRoutes');
const templateRoutes = require('./routes/templateRoutes');
const logRoutes = require('./routes/logRoutes');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

app.use('/api/zns', znsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/logs', logRoutes);

app.listen(3000, () => {
  console.log('ZNS Tool running at http://localhost:3000');
});
