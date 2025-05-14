const db = require('../db');


//to get all the books inside the database to send to frontend
exports.getBooks = (req, res) => {
    db.query('SELECT * FROM books', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};


// Add books to DB
exports.addBook = (req, res) => {
    console.log("Uploading new book...");

    const {
        title,
        author,
        description,
        categoryId,
        publicationYear,
        isbn,
        language,
        tags,
        fileName // This should be the actual file path or filename stored
    } = req.body;

    if (!title || !fileName) {
        return res.status(400).json({ error: "Title and file name are required." });
    }

    const sql = `
        INSERT INTO books 
        (title, author, description, category_id, publication_year, isbn, language, tags, file)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        author || 'Unknown',
        description || '',
        categoryId || null,
        publicationYear || null,
        isbn || '',
        language || '',
        tags || '',
        fileName
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding book:", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Book added successfully', bookId: result.insertId });
    });
};

//to update the books details should the need arise
exports.updateBookDetails = (req, res) => {
    const { id } = req.params;
    const { title, author, description, category_id, file_data, popularity } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Book ID is required" });
    }

    const fields = [];
    const values = [];

    if (title) {
        fields.push("title = ?");
        values.push(title);
    }
    if (author) {
        fields.push("author = ?");
        values.push(author);
    }
    if (description) {
        fields.push("description = ?");
        values.push(description);
    }
    if (category_id) {
        fields.push("category_id = ?");
        values.push(category_id);
    }
    if (file_data) {
        fields.push("file_data = ?");
        values.push(file_data);
    }
    if (typeof popularity !== 'undefined') {
        fields.push("popularity = ?");
        values.push(popularity);
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
    }

    const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ message: 'Book updated successfully' });
    });
};

//to update recently opened table when user opens a book
exports.addRecentlyOpenedBook = (req, res) => {
    const { user_id, book_id } = req.body;

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
            // Entry exists - update timestamp
            const updateSql = `
                UPDATE recently_opened_books
                SET last_opened = NOW()
                WHERE user_id = ? AND book_id = ?
            `;
            db.query(updateSql, [user_id, book_id], (updateErr) => {
                if (updateErr) return res.status(500).json({ error: updateErr.message });

                return res.status(200).json({ message: 'Recently opened book timestamp updated' });
            });

        } else {
            // Entry does not exist - insert new
            const insertSql = `
                INSERT INTO recently_opened_books (user_id, book_id, last_opened)
                VALUES (?, ?, NOW())
            `;
            db.query(insertSql, [user_id, book_id], (insertErr, result) => {
                if (insertErr) return res.status(500).json({ error: insertErr.message });

                return res.status(201).json({ message: 'Book entry recorded as recently opened', entryId: result.insertId });
            });
        }
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
