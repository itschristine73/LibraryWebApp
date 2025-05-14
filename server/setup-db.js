const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
	  multipleStatements: true       
});
const createDbAndTables = `
CREATE DATABASE IF NOT EXISTS library_catalog;

USE library_catalog;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role VARCHAR(255) NOT NULL
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

INSERT IGNORE INTO categories (name) VALUES 
  ('Fiction'),
  ('Non-fiction'),
  ('Science'),
  ('Technology'),
  ('History'),
  ('Biography'),
  ('Fantasy'),
  ('Mystery'),
  ('Education');

-- books Table
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  description TEXT,
  category_id INT,
  publication_year INT,
  isbn VARCHAR(20),
  language VARCHAR(50),
  tags TEXT,
  file VARCHAR(255) NOT NULL,
  popularity_score INT DEFAULT 0, -- to track book popularity for ranking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- recently opened books table to track books opened
CREATE TABLE IF NOT EXISTS recently_opened_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_book (user_id, book_id)
);

-- user book activity to track users book opening and all
CREATE TABLE IF NOT EXISTS user_book_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  action ENUM('opened', 'downloaded', 'borrowed', 'returned') NOT NULL,
  activity_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  INDEX (user_id),
  INDEX (book_id)
);


`;

connection.query(createDbAndTables, (err, results) => {
  if (err) {
    console.error('Error creating DB/tables:', err.message);
  } else {
    console.log('Database and tables set up successfully.');
  }
  connection.end();
});

