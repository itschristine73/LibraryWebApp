const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getBooks, addBook, getBookById, delBookById, delMultipleBooks, addRecentlyOpenedBook, getCategories, getCategorieById, addCategories, removeCategories, removeCategoryByID, getBookCategoryDistribution, getStats, getRecentlyOpenedBooks } = require('../controllers/bookController');
const isAuth = require('../middleware/auth');

router.post('/uploadBooks', addBook);
router.get('/loadBooks', getBooks);
router.get('/loadBook/:id', getBookById);
router.get('/delBook/:id', delBookById);
router.post('/deleteMultiple', delMultipleBooks);
router.post('/addRecentlyOpenedBook', addRecentlyOpenedBook);
router.get('/recentlyOpenedBooks/:userId', getRecentlyOpenedBooks);
router.get('/getCategories', getCategories);
router.get('/getCategory/:id', getCategorieById);
router.post('/addCategory', addCategories);
router.post('/removeCategoryById/:id', removeCategoryByID);
router.post('/removeCategories', removeCategories);
router.get('/bookCategoryDistribution', getBookCategoryDistribution);
router.get('/overview/:id', getStats);

module.exports = router;

