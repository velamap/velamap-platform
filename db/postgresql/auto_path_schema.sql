-- ═══════════════════════════════════════════════════════════════
--  Auto Path Engine Schema
--  自动路径生成 + 候选关系表
-- ═══════════════════════════════════════════════════════════════

-- ── 自动生成路径缓存 ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_paths (
  id               SERIAL PRIMARY KEY,
  target_slug      VARCHAR(150) NOT NULL,
  start_slug       VARCHAR(150) NOT NULL,
  path_type        VARCHAR(30)  NOT NULL DEFAULT 'learning',
  total_cost       FLOAT        NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_path_nodes (
  id         SERIAL PRIMARY KEY,
  path_id    INT NOT NULL REFERENCES auto_paths(id) ON DELETE CASCADE,
  concept_id INT NOT NULL REFERENCES concepts(id)   ON DELETE CASCADE,
  step_order INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auto_paths_target ON auto_paths(target_slug, path_type);
CREATE INDEX IF NOT EXISTS idx_auto_path_nodes   ON auto_path_nodes(path_id);

-- ── 候选关系表（LLM 自动补全，待审核）────────────────────────
CREATE TABLE IF NOT EXISTS relation_candidates (
  id         SERIAL PRIMARY KEY,
  source_id  INT  NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id  INT  NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  rel_type   TEXT NOT NULL,
  score      FLOAT DEFAULT 0,   -- embedding 相似度
  llm_score  FLOAT DEFAULT 0,   -- LLM 置信度
  llm_reason TEXT,
  status     TEXT NOT NULL DEFAULT 'pending', -- pending / approved / rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (source_id, target_id, rel_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_candidates_status ON relation_candidates(status);
