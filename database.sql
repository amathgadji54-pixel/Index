-- ============================================
-- SUNU YOON — Script de création de la BDD
-- Exécute ce fichier dans MySQL Workbench
-- ou via : mysql -u root -p < database.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS sunu_yoon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sunu_yoon;

-- ── TABLE UTILISATEURS ──
CREATE TABLE IF NOT EXISTS utilisateurs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nom         VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  telephone   VARCHAR(20),
  mot_de_passe VARCHAR(255) NOT NULL,
  points      INT DEFAULT 0,
  role        ENUM('utilisateur', 'moderateur', 'admin') DEFAULT 'utilisateur',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── TABLE OBSTACLES ──
CREATE TABLE IF NOT EXISTS obstacles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  type         VARCHAR(50) NOT NULL,
  -- ex: embouteillage, route_barree, accident, inondation, controle_police, travaux
  description  TEXT,
  latitude     DECIMAL(10, 8) NOT NULL,
  longitude    DECIMAL(11, 8) NOT NULL,
  lieu         VARCHAR(200),
  statut       ENUM('en_attente', 'actif', 'resolu', 'expire') DEFAULT 'en_attente',
  confirmations INT DEFAULT 0,
  infirmations  INT DEFAULT 0,
  user_id      INT,
  expire_at    TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ── TABLE VOTES SUR LES OBSTACLES ──
CREATE TABLE IF NOT EXISTS votes_obstacles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  obstacle_id INT NOT NULL,
  user_id     INT NOT NULL,
  vote        ENUM('confirme', 'infirme') NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (obstacle_id, user_id),
  FOREIGN KEY (obstacle_id) REFERENCES obstacles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ── TABLE LIEUX FAVORIS ──
CREATE TABLE IF NOT EXISTS favoris (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  nom       VARCHAR(100) NOT NULL,
  latitude  DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  type      ENUM('domicile', 'travail', 'autre') DEFAULT 'autre',
  FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- ── TABLE HISTORIQUE TRAJETS ──
CREATE TABLE IF NOT EXISTS trajets (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT,
  depart_lat     DECIMAL(10, 8) NOT NULL,
  depart_lng     DECIMAL(11, 8) NOT NULL,
  depart_nom     VARCHAR(200),
  arrivee_lat    DECIMAL(10, 8) NOT NULL,
  arrivee_lng    DECIMAL(11, 8) NOT NULL,
  arrivee_nom    VARCHAR(200),
  duree_min      INT,
  distance_km    DECIMAL(6, 2),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- ── DONNÉES DE TEST ──
INSERT INTO utilisateurs (nom, email, telephone, mot_de_passe, role) VALUES
('Admin Sunu Yoon', 'admin@sunuyoon.sn', '+221770000000', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Oumar Diallo',    'oumar@test.sn',     '+221771234567', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'utilisateur');
-- mot de passe de test : "password"

INSERT INTO obstacles (type, description, latitude, longitude, lieu, statut, confirmations, expire_at) VALUES
('embouteillage', 'Bouchon important', 14.69280, -17.44670, 'Rond-point Liberté 6', 'actif', 5, DATE_ADD(NOW(), INTERVAL 2 HOUR)),
('travaux',       'Chantier en cours', 14.71670, -17.46770, 'Av. Cheikh Anta Diop', 'actif', 3, DATE_ADD(NOW(), INTERVAL 30 DAY)),
('inondation',    'Route inondée',     14.75200, -17.42000, 'Route de Pikine',      'actif', 7, DATE_ADD(NOW(), INTERVAL 6 HOUR));
