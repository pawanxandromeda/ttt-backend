// // server.js
// require('dotenv').config({ path: '.env.local' });
// const app = require('./app');
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// server.js
require('dotenv').config({ path: '.env.local' });
const app = require('./app');
const PORT = process.env.PORT || 5000;

// ✅ Bind to 0.0.0.0 to allow external access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
