const express = require('express');
const router = express.Router();
const controller = require('../controllers/internalUserController');

router.post('/login', controller.loginInternalUser);
router.post('/create', controller.createInternalUser);
router.get('/all', controller.getAllInternalUsers);
router.put('/update/:id', controller.updateInternalUser);
router.delete('/delete/:id', controller.deleteInternalUser);

module.exports = router;
