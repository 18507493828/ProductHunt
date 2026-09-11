-- Vibe Building MySQL schema (idempotent CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(191) NOT NULL,
  nickname VARCHAR(191) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  created_at DATETIME(3) NULL,
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  rank_label VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  time_text VARCHAR(255) NOT NULL DEFAULT '',
  rules TEXT,
  rewards TEXT,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  subtitle VARCHAR(500) NOT NULL DEFAULT '',
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  link_url VARCHAR(500) NOT NULL DEFAULT '',
  sort INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS navs (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  url VARCHAR(500) NOT NULL DEFAULT '',
  sort INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NULL,
  updated_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_zone (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT '',
  enabled TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  tagline VARCHAR(500) NOT NULL DEFAULT '',
  description TEXT,
  url VARCHAR(500) NOT NULL DEFAULT '',
  category VARCHAR(191) NOT NULL DEFAULT '',
  topic_id VARCHAR(64) NOT NULL DEFAULT '',
  color VARCHAR(32) NOT NULL DEFAULT '',
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  submitted_by VARCHAR(191) NOT NULL DEFAULT '',
  submitted_nickname VARCHAR(191) NOT NULL DEFAULT '',
  submitted_at DATETIME(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'approved',
  reject_reason TEXT,
  reviewed_at DATETIME(3) NULL,
  reviewed_by VARCHAR(191) NOT NULL DEFAULT '',
  is_special TINYINT(1) NOT NULL DEFAULT 0,
  campaign VARCHAR(64) NOT NULL DEFAULT '',
  view_count INT NOT NULL DEFAULT 0,
  share_count INT NOT NULL DEFAULT 0,
  app_platform VARCHAR(32) NOT NULL DEFAULT 'h5',
  updated_at DATETIME(3) NULL,
  rank_pinned TINYINT(1) NOT NULL DEFAULT 0,
  rank_hidden TINYINT(1) NOT NULL DEFAULT 0,
  rank_weight INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_categories (
  product_id VARCHAR(64) NOT NULL,
  category_name VARCHAR(191) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, category_name),
  KEY idx_product_categories_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_topics (
  product_id VARCHAR(64) NOT NULL,
  topic_id VARCHAR(64) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, topic_id),
  KEY idx_product_topics_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_ratings (
  product_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  creativity TINYINT NULL,
  completeness TINYINT NULL,
  usefulness TINYINT NULL,
  experience TINYINT NULL,
  PRIMARY KEY (product_id, user_id),
  KEY idx_product_ratings_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_comments (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL DEFAULT '',
  username VARCHAR(191) NOT NULL DEFAULT '',
  author VARCHAR(191) NOT NULL DEFAULT '',
  content TEXT,
  created_at DATETIME(3) NULL,
  KEY idx_product_comments_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topics (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  cover_image VARCHAR(500) NOT NULL DEFAULT '',
  color VARCHAR(32) NOT NULL DEFAULT '',
  region VARCHAR(64) NOT NULL DEFAULT '全国',
  created_by VARCHAR(191) NOT NULL DEFAULT '',
  created_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_followers (
  topic_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (topic_id, user_id),
  KEY idx_topic_followers_topic (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_posts (
  id VARCHAR(64) PRIMARY KEY,
  topic_id VARCHAR(64) NOT NULL DEFAULT '',
  title VARCHAR(500) NOT NULL DEFAULT '',
  content TEXT,
  image_url VARCHAR(500) NOT NULL DEFAULT '',
  link_url VARCHAR(500) NOT NULL DEFAULT '',
  submitted_by VARCHAR(191) NOT NULL DEFAULT '',
  submitted_nickname VARCHAR(191) NOT NULL DEFAULT '',
  submitted_at DATETIME(3) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'approved',
  reject_reason TEXT,
  reviewed_at DATETIME(3) NULL,
  reviewed_by VARCHAR(191) NOT NULL DEFAULT '',
  view_count INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_post_likes (
  post_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (post_id, user_id),
  KEY idx_topic_post_likes_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS topic_post_comments (
  id VARCHAR(64) PRIMARY KEY,
  post_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL DEFAULT '',
  username VARCHAR(191) NOT NULL DEFAULT '',
  author VARCHAR(191) NOT NULL DEFAULT '',
  content TEXT,
  created_at DATETIME(3) NULL,
  KEY idx_topic_post_comments_post (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shares (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL DEFAULT '',
  product_name VARCHAR(255) NOT NULL DEFAULT '',
  user_id VARCHAR(64) NOT NULL DEFAULT '',
  username VARCHAR(191) NOT NULL DEFAULT '',
  nickname VARCHAR(191) NOT NULL DEFAULT '',
  platform VARCHAR(64) NOT NULL DEFAULT '',
  created_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS share_config (
  id INT PRIMARY KEY,
  title_prefix VARCHAR(255) NOT NULL DEFAULT '',
  footer TEXT,
  include_tagline TINYINT(1) NOT NULL DEFAULT 1,
  include_url TINYINT(1) NOT NULL DEFAULT 1,
  platforms JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS incentive_config (
  id INT PRIMARY KEY,
  payload JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 上传图片二进制（与业务表一并存库，不再依赖磁盘）
CREATE TABLE IF NOT EXISTS uploads (
  id VARCHAR(191) PRIMARY KEY,
  mime_type VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
  size INT NOT NULL DEFAULT 0,
  data LONGBLOB NOT NULL,
  created_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
