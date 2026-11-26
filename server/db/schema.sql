
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY name (name)
) ENGINE = InnoDB;

CREATE TABLE accounts (
  id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY idx_email (email),
  CONSTRAINT accounts_ibfk_1 FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE = InnoDB;

CREATE TABLE vendors (
  id INT NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY code (code)
) ENGINE = InnoDB;

CREATE TABLE games (
  id INT NOT NULL AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  game_code VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_jp VARCHAR(255) NULL,
  image_url TEXT,
  type ENUM('SLOT', 'LIVE', 'TABLE') NOT NULL DEFAULT 'SLOT',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_games_vendor_game (vendor_id, game_code),
  CONSTRAINT fk_games_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id)
) ENGINE = InnoDB;

CREATE INDEX idx_games_filters ON games (vendor_id, is_active, type);

CREATE INDEX idx_games_sort ON games (sort_order);

CREATE INDEX idx_games_vendor_sort ON games (vendor_id, sort_order);