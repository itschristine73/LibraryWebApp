const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getBooks, addBook, getBookById, delBookById, delMultipleBooks, updateBookDetails, addRecentlyOpenedBook } = require('../controllers/bookController');
const isAuth = require('../middleware/auth');

router.post('/uploadBooks', addBook);
router.get('/loadBooks', getBooks);
router.get('/loadBooks/:id', getBookById);
router.get('/delBook/:id', delBookById);
router.post('/deleteMultiple', delMultipleBooks);
router.post('/updateBookDetails/:id', updateBookDetails);
router.post('/addRecentlyOpenedBook', addRecentlyOpenedBook);

module.exports = router;

