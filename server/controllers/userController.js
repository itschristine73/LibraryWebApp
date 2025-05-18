const db = require('../db');
const bcrypt = require('bcrypt');

//get users
exports.getUsers = (req, res) => {
    db.query(`SELECT * FROM users WHERE role != 'admin' `, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// Get user activity (registrations per month)
exports.getUserActivity = (req, res) => {
    const sql = `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(id) AS new_users
    FROM users
    GROUP BY month
    ORDER BY month
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
}

exports.checkSession = (req, res) => {
    const { id } = req.params;
    console.log("checking session for: ", id)
    db.query('SELECT * FROM sessions WHERE session_id = ?', [id], (err, results) =>{
        if (err) return res.status(500).json({error: err.message});

        if (results.length === 0) {
            console.log("session not found")
            return res.status(404).json({error: 'invalid session'})
        }

        console.log("found session");

        res.status(201).json({ message: 'session exists', user: req.session.user });
    })
}

exports.registerUser = (req, res) => {
    const { username, email, password, role } = req.body;

    // Check if user with same email already exists
    db.query('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], (err, results) => {
        if (err){ return res.status(500).json({ error: err.message })};

	    console.log("user found",results)
        if (results.length > 0) {
		console.log("user exists")
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Proceed to insert user
        const hash = bcrypt.hashSync(password, 10);
	    console.log("creating user")
        db.query(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username, email, hash, role],
            (err, result) => {
                if (err) return res.status(500).json({ error: err.message });

                req.session.user = {
                    id: result.insertId,
                    username,
                    email,
                    role,
                };

                res.status(201).json({ message: 'User registered', user: req.session.user });
            }
        );
    });
};


exports.loginUser = (req, res) => {
    console.log("accessing db to get user login infor")
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log("found user")
        const user = results[0];

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.user = {
            id: user.id,
            email: user.email, 
            role: user.role || 'user' 
        };

        try {
            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) {
                        console.error("Error saving session:", err);
                        return reject(err);
                    }
                    console.log("Session saved correctly");
                    resolve();
                });
            });
        
        res.json({ message: 'Logged in', user: req.session.user, sessionID: req.session.id });
        
        }
        catch (err) {
            res.status(500).json({ error: 'Failed to save session' });
        }
    });
};

exports.logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }

        res.clearCookie('connect.sid'); // Default session cookie name
        res.json({ message: 'Logout successful' });
    });
};
