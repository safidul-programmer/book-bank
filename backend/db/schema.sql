-- Book Bank Database Schema
-- Target database: book_bank
-- Run this file to create all tables from scratch.

USE book_bank;

-- ============================================================
-- 1. users — Student and Admin accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. books — Book inventory
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(255)  NOT NULL,
  author              VARCHAR(150)  NOT NULL,
  isbn                VARCHAR(13)   NOT NULL UNIQUE,
  genre               VARCHAR(100)  NULL,
  description         TEXT          NULL,
  total_quantity      INT UNSIGNED  NOT NULL DEFAULT 1,
  available_quantity  INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_quantity CHECK (available_quantity <= total_quantity)
);

-- ============================================================
-- 3. borrow_records — Borrowing history
-- ============================================================
CREATE TABLE IF NOT EXISTS borrow_records (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  book_id     INT UNSIGNED  NOT NULL,
  borrow_date TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  due_date    DATE          NOT NULL,
  return_date TIMESTAMP     NULL,
  CONSTRAINT fk_borrow_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT
);
