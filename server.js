const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint utama
app.get('/', (req, res) => {
  res.send('Server KanashiAm Berjalan via Nano!');
});

// Contoh Endpoint API JSON
app.get('/api/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'API KanashiAm Aktif',
    version: '1.0'
  });
});

app.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
});

