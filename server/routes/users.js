const express = require('express');
const router = express.Router();
const { registerUser, loginUser, checkSession, logoutUser, getUsers, getUserActivity } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me/:id', checkSession);
router.post('/logout', logoutUser);
router.get('/getUsers', getUsers);
router.get('/userActivity', getUserActivity);


module.exports = router;

