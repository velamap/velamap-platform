-- Velamap PostgreSQL Schema

CREATE TABLE IF NOT EXISTS nodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  layer       TEXT NOT NULL,
  sub_layer   TEXT,
  description TEXT,
  capabilities TEXT[],
  domains     TEXT[],
  maturity    TEXT,
  certainty   TEXT,
  freshness   TEXT,
  type        TEXT,
  cost        JSONB,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node     UUID REFERENCES nodes(id) ON DELETE CASCADE,
  to_node       UUID REFERENCES nodes(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  weight        FLOAT DEFAULT 1.0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  category   TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS node_tags (
  node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (node_id, tag_id)
);

CREATE TABLE IF NOT EXISTS content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id      UUID REFERENCES nodes(id) ON DELETE CASCADE,
  content_type TEXT,
  title        TEXT,
  body         TEXT,
  source       TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_layer  ON nodes(layer);
CREATE INDEX IF NOT EXISTS idx_edges_from   ON edges(from_node);
CREATE INDEX IF NOT EXISTS idx_edges_to     ON edges(to_node);
CREATE INDEX IF NOT EXISTS idx_content_node ON content(node_id);
