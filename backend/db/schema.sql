-- =============================================
-- NoteApp Database Schema - Fixed for MySQL/XAMPP
-- =============================================

CREATE DATABASE IF NOT EXISTS noteapp
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE noteapp;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS note_shares;
DROP TABLE IF EXISTS note_labels;
DROP TABLE IF EXISTS labels;
DROP TABLE IF EXISTS note_images;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  reset_token VARCHAR(191) DEFAULT NULL,
  reset_token_expires DATETIME NULL DEFAULT NULL,
  is_verified TINYINT(1) DEFAULT 0,
  activation_token VARCHAR(191) DEFAULT NULL,
  theme ENUM('light', 'dark') DEFAULT 'light',
  font_size ENUM('small', 'medium', 'large') DEFAULT 'medium',
  default_note_color VARCHAR(20) DEFAULT '#ffffff',
  view_mode ENUM('list', 'grid') DEFAULT 'grid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(500) DEFAULT 'Untitled',
  content TEXT,
  note_color VARCHAR(20) DEFAULT '#ffffff',
  is_pinned TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  deleted_at DATETIME NULL DEFAULT NULL,
  has_password TINYINT(1) DEFAULT 0,
  password_hash VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notes_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  note_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_images_note
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE labels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6366f1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_label (user_id, name),
  CONSTRAINT fk_labels_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_labels (
  note_id INT NOT NULL,
  label_id INT NOT NULL,
  PRIMARY KEY (note_id, label_id),
  CONSTRAINT fk_note_labels_note
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_labels_label
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE note_shares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  note_id INT NOT NULL,
  owner_id INT NOT NULL,
  recipient_id INT NOT NULL,
  permission ENUM('read', 'edit') DEFAULT 'read',
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_share (note_id, recipient_id),
  CONSTRAINT fk_note_shares_note
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_shares_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_note_shares_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  data LONGTEXT DEFAULT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;