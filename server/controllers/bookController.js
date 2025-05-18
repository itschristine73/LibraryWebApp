const db = require('../db');


//to get all the books inside the database to send to frontend
exports.getBooks = (req, res) => {
    console.log("loading books")
    const sql = `
        SELECT 
            books.*, 
            categories.name AS category_name 
        FROM books
        LEFT JOIN categories ON books.category_id = categories.id
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addCategories = (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Category name is required" });
    }

    const sql = "INSERT INTO categories (name) VALUES (?)";

    db.query(sql, [name], (err, result) => {
        if (err) {
            // Handle duplicate category name (if you have a UNIQUE constraint on name)
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: "Category already exists" });
            }
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({ message: "Category added successfully", categoryId: result.insertId });
    });
};

exports.removeCategoryByID = (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
    }

    const sql = "DELETE FROM categories WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json({ message: "Category deleted successfully" });
    });
};

exports.removeCategories = (req, res) => {
    const { ids } = req.body; // expects an array of category IDs

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: "An array of category IDs is required" });
    }

    const placeholders = ids.map(() => '?').join(', ');

    // Step 1: Detach categories from books
    const detachBooksSql = `UPDATE books SET category_id = NULL WHERE category_id IN (${placeholders})`;
    db.query(detachBooksSql, ids, (detachErr) => {
        if (detachErr) return res.status(500).json({ error: detachErr.message });

        // Step 2: Delete categories
        const deleteSql = `DELETE FROM categories WHERE id IN (${placeholders})`;
        db.query(deleteSql, ids, (deleteErr, result) => {
            if (deleteErr) return res.status(500).json({ error: deleteErr.message });

            res.status(200).json({ message: `${result.affectedRows} categories deleted successfully` });
        });
    });
};

//book category distribution
exports.getBookCategoryDistribution = (req, res) => {
    const sql = `
      SELECT c.name AS category, COUNT(b.id) AS book_count
      FROM categories c
      LEFT JOIN books b ON c.id = b.category_id
      GROUP BY c.id, c.name
    `;
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  };

exports.getCategories = (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(results);
    })
}

exports.getCategorieById = (req, res) => {
    const { id } = req.params

    const sql = 'SELECT * FROM categories WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) {
            return res.status(404).json({ error: 'caetegory not found' });
        }
        res.json(result[0]);
    });
}

// Add books to DB
exports.addBook = (req, res) => {
    console.log("Uploading new book...");

    const {
        title,
        author,
        description,
        categoryId,
        publicationYear,
        publisher,
        edition,
        isbn,
        language,
        tags,
        fileData 
    } = req.body;

    if (!title || !fileData) {
        return res.status(400).json({ error: "Title and file name are required." });
    }

    const sql = `
        INSERT INTO books 
        (title, author, description, category_id, publication_year, publisher, edition, isbn, language, tags, file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        author || 'Unknown',
        description || '',
        categoryId || null,
        publicationYear || null,
        publisher || null,
        edition || null,
        isbn || '',
        language || '',
        tags || '',
        fileData
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding book:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
    });
};

//to update recently opened table when user opens a book
exports.addRecentlyOpenedBook = (req, res) => {
    console.log("adding recently opened")
    const { user_id, book_id } = req.body;

    console.log(user_id, book_id)

    if (!user_id || !book_id) {
        return res.status(400).json({ error: 'User ID and Book ID are required' });
    }

    // Check if the entry already exists
    const checkSql = `
        SELECT * FROM recently_opened_books WHERE user_id = ? AND book_id = ?
    `;

    db.query(checkSql, [user_id, book_id], (checkErr, results) => {
        if (checkErr) return res.status(500).json({ error: checkErr.message });

        if (results.length > 0) {
            console.log("found")
            // Entry exists - update timestamp
            const updateSql = `
                UPDATE recently_opened_books
                SET opened_at = NOW()
                WHERE user_id = ? AND book_id = ?
            `;
            db.query(updateSql, [user_id, book_id], (updateErr) => {
                if (updateErr) {
                    console.error(updateErr);
                    return res.status(500).json({ error: updateErr.message });
                }

                return res.status(200).json({ message: 'Recently opened book timestamp updated' });
            });

        } else {
            console.log("not found")
            // Entry does not exist - insert new
            const insertSql = `
                INSERT INTO recently_opened_books (user_id, book_id, opened_at)
                VALUES (?, ?, NOW())
            `;
            db.query(insertSql, [user_id, book_id], (insertErr, result) => {
                if (insertErr) {
                    console.error(insertErr);
                    return res.status(500).json({ error: insertErr.message });
                }

                return res.status(201).json({ message: 'Book entry recorded as recently opened', entryId: result.insertId });
            });
        }
    });
};

exports.getRecentlyOpenedBooks = (req, res) => {
    console.log("getting recents");
    const userId = req.params.userId;
  
    const sql = `
      SELECT b.id, b.title, b.author
      FROM recently_opened_books ro
      JOIN books b ON ro.book_id = b.id
      WHERE ro.user_id = ?
      ORDER BY ro.opened_at DESC
      LIMIT 5
    `;
  
    db.query(sql, [userId], (err, results) => {
      if (err){
        console.log(err.message)
        return res.status(500).json({ error: err.message });
      } 
      res.json(results);
    });
};

//to get the books y ID 
exports.getBookById = (req, res) => {
    console.log("getting")
    const { id } = req.params; 
    console.log(id)
    const sql = 'SELECT * FROM books WHERE id = ?';
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.json(result[0]);
    });
};

//to delete books from db based on id
exports.delBookById = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM books WHERE id = ?';

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found or already deleted' });
        }
        res.json({ message: 'Book deleted successfully' });
    });
};

//delete multiple books based on a list of id's
exports.delMultipleBooks = (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No book IDs provided' });
    }

    const placeholders = ids.map(() => '?').join(', ');
    const sql = `DELETE FROM books WHERE id IN (${placeholders})`;

    db.query(sql, ids, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No matching books found to delete' });
        }

        res.json({ message: `${result.affectedRows} book(s) deleted successfully` });
    });
};

exports.getStats = async (req, res) => {
    try {
      const { id } = req.params;

      console.log(id)
  
      const [totalBooks] = await db.promise().query(
        `SELECT COUNT(DISTINCT book_id) AS count
         FROM recently_opened_books
         WHERE user_id = ?`,
        [id]
      );
  console.log(totalBooks)
      const [topCategory] = await db.promise().query(
        `SELECT c.name AS category, COUNT(*) AS count
         FROM recently_opened_books ro
         JOIN books b ON ro.book_id = b.id
         JOIN categories c ON b.category_id = c.id
         WHERE ro.user_id = ?
         GROUP BY c.name
         ORDER BY count DESC
         LIMIT 1`,
        [id]
      );
  console.log(topCategory)
      const [weeklyBooks] = await db.promise().query(
        `SELECT COUNT(DISTINCT book_id) AS count
         FROM recently_opened_books
         WHERE user_id = ? AND WEEK(opened_at) = WEEK(NOW())`,
        [id]
      );
  console.log(weeklyBooks)
      const [categoryBreakdown] = await db.promise().query(
        `SELECT c.name AS category, COUNT(*) AS count
         FROM recently_opened_books ro
         JOIN books b ON ro.book_id = b.id
         JOIN categories c ON b.category_id = c.id
         WHERE ro.user_id = ?
         GROUP BY c.name
         ORDER BY count DESC`,
        [id]
      );
  console.log(categoryBreakdown)
      res.json({
        totalBooksRead: totalBooks[0]?.count || 0,
        topCategory: topCategory[0]?.category || null,
        booksThisWeek: weeklyBooks[0]?.count || 0,
        categoryBreakdown
      });
  
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  };
  