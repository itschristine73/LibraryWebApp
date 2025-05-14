const db = require('../db');
const bcrypt = require('bcrypt');

exports.checkSession = (req, res) => {
    console.log("checking session", req.session.user, req.session)
    const { id } = req.params;
    db.query('SELECT * FROM sessions WHERE session_id = ?', [id], (err, results) =>{
        if (err) return res.status(500).json({error: err.message});

        if (results.length === 0) {
            return res.status(404).json({error: 'invalid session'})
        }

        console.log("found session");

        console.log(results)

        res.status(201).json({ message: 'session exists', user: req.session.user });
    })
}

exports.registerUser = (req, res) => {
    const { username, email, password, role } = req.body;

	console.log(email, role);
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
    console.log("accessing")
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log("found user")
        const user = results[0];
        console.log(user.role, user.id, user.email)

        // if (!bcrypt.compareSync(password, user.password)) {
        //     return res.status(401).json({ error: 'Invalid credentials' });
        // }

        // Set session
        req.session.user = {
            id: user.id,
            email: user.email, 
            role: user.role || 'user' 
        };
        req.session.save(err => {
            if (err) console.error("Error saving session:", err);
            else console.log("Session saved correctly");
        });

        console.log(req.session.user, req.session.id)
        res.json({ message: 'Logged in', user: req.session.user, sessionID: req.session.id });
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
