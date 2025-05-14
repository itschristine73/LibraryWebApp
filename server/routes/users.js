const express = require('express');
const router = express.Router();
const { registerUser, loginUser, checkSession, logoutUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me/:id', checkSession);
router.post('/logout', logoutUser);


module.exports = router;

