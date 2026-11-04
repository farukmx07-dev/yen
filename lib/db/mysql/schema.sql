CREATE TABLE IF NOT EXISTS documents (
  collection_name VARCHAR(32) NOT NULL,
  doc_id CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (collection_name, doc_id),
  KEY idx_collection_updated (collection_name, updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT NOT NULL PRIMARY KEY CHECK (id = 1),
  payload JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
