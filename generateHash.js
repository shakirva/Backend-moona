// hash.js
const bcrypt = require('bcrypt');

const plainPassword = 'admin1234'; // 👈 Change if needed

bcrypt.hash(plainPassword, 10).then((hash) => {
  console.log('Hashed Password:', hash);
});
