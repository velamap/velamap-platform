-- ═══════════════════════════════════════════════════════════════
--  Velamap V1.5 Schema
--  三层模型：Category + Concept + Axes + Relations + Paths
-- ═══════════════════════════════════════════════════════════════

-- ── 一级导航分类 ──────────────────────────────────────────────
CREATE TABLE nav_categories (
  id         SERIAL PRIMARY KEY,
  slug       VARCHAR(50)  NOT NULL UNIQUE,
  zh_label   VARCHAR(100) NOT NULL,
  en_label   VARCHAR(100) NOT NULL,
  icon       VARCHAR(50)  NOT NULL,
  sort_order INT DEFAULT 0
);

-- ── 概念表（增强版）──────────────────────────────────────────
CREATE TABLE concepts (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  category_id INT NOT NULL REFERENCES nav_categories(id) ON DELETE CASCADE,
  zh_name     VARCHAR(100) NOT NULL,
  en_name     VARCHAR(100) NOT NULL,
  icon        VARCHAR(50)  NOT NULL DEFAULT 'BookOpen',
  zh_desc     TEXT,
  en_desc     TEXT,
  difficulty  INT DEFAULT 1,   -- 1-5，用于学习路径排序
  importance  INT DEFAULT 1,   -- 权重，用于推荐排序
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 语义轴（多维分类）────────────────────────────────────────
CREATE TABLE axes (
  id        SERIAL PRIMARY KEY,
  axis_type TEXT NOT NULL,  -- architecture / training / reasoning / system / application
  name      TEXT NOT NULL,
  zh_name   TEXT NOT NULL
);

CREATE TABLE concept_axes (
  concept_id INT REFERENCES concepts(id) ON DELETE CASCADE,
  axis_id    INT REFERENCES axes(id)    ON DELETE CASCADE,
  PRIMARY KEY (concept_id, axis_id)
);

-- ── 概念关系表（升级版）──────────────────────────────────────
CREATE TABLE concept_relations (
  id         SERIAL PRIMARY KEY,
  source_id  INT   NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id  INT   NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  rel_type   VARCHAR(30) NOT NULL,
  -- upstream / downstream / parallel
  -- part_of / variant_of / used_by / implements / optimized_by / related_to
  weight     FLOAT DEFAULT 1.0,
  UNIQUE (source_id, target_id, rel_type)
);

-- ── 学习路径 ──────────────────────────────────────────────────
CREATE TABLE learning_paths (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  zh_name     TEXT NOT NULL,
  en_name     TEXT NOT NULL,
  description TEXT,
  path_type   TEXT DEFAULT 'learning',  -- learning / understanding / engineering / comparison
  difficulty  INT  DEFAULT 1,
  duration    INT  DEFAULT 30,          -- 预计学习时间（分钟）
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE path_nodes (
  id         SERIAL PRIMARY KEY,
  path_id    INT  NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  concept_id INT  NOT NULL REFERENCES concepts(id)       ON DELETE CASCADE,
  step_order INT  NOT NULL,
  is_key     BOOLEAN DEFAULT FALSE,  -- 核心节点
  note       TEXT                    -- 步骤说明
);

-- ── 索引 ──────────────────────────────────────────────────────
CREATE INDEX idx_concepts_category   ON concepts(category_id);
CREATE INDEX idx_relations_source    ON concept_relations(source_id);
CREATE INDEX idx_relations_target    ON concept_relations(target_id);
CREATE INDEX idx_path_nodes_path     ON path_nodes(path_id);
CREATE INDEX idx_concept_axes_concept ON concept_axes(concept_id);

-- ═══════════════════════════════════════════════════════════════
--  种子数据
-- ═══════════════════════════════════════════════════════════════

-- ── 导航分类 ──────────────────────────────────────────────────
INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order) VALUES
  ('frontier',     '前沿探索', 'Frontier',     'Telescope',  1),
  ('applications', '应用方案', 'Applications', 'LayoutGrid', 2),
  ('execution',    '工程化',   'Engineering',  'Cpu',        3),
  ('agents',       '智能体',   'Agents',       'Bot',        4),
  ('ai-infra',     '基础设施', 'AI Infra',     'Server',     5);

-- ── 概念数据（含 difficulty / importance）────────────────────
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, difficulty, importance, sort_order) VALUES
  ('transformer',   5, 'Transformer',  'Transformer',       'Code',      '神经网络核心架构',     'Core neural network architecture',                  2, 5, 1),
  ('moe',           5, 'MoE 架构',     'MoE Architecture',  'Bot',       '混合专家稀疏模型',     'Mixture of Experts sparse model',                   3, 4, 2),
  ('embedding',     5, 'Embedding',    'Embedding',         'Bookmark',  '文本/图像向量表示',    'Text/image vector representation',                  2, 5, 3),
  ('scaling',       5, 'Scaling Law',  'Scaling Law',       'BarChart',  '模型性能缩放规律',     'Model performance scaling rules',                   3, 3, 4),
  ('react',         4, 'ReAct',        'ReAct',             'Bot',       '推理+行动协同架构',    'Reasoning + acting architecture',                   3, 4, 1),
  ('planning',      4, '规划系统',     'Planning',          'LayoutGrid','多步决策与目标分解',   'Multi-step planning & decomposition',                3, 3, 2),
  ('memory',        4, '记忆系统',     'Memory',            'Bookmark',  '长短时记忆管理',       'Long/short-term memory management',                 2, 3, 3),
  ('generate',      2, '内容生成',     'Generation',        'BookOpen',  '文本/图像/音频生成',   'Text/image/audio generation',                       2, 4, 1),
  ('decision',      2, '决策辅助',     'Decision',          'Bot',       '分析与判断增强',       'Analysis & decision augmentation',                  2, 3, 2),
  ('orchestration', 3, '工作流编排',   'Orchestration',     'LayoutGrid','DAG/状态机执行',       'DAG / state machine execution',                     3, 4, 1),
  ('observability', 3, '可观测性',     'Observability',     'BarChart',  '监控/追踪/日志',       'Monitoring / tracing / logging',                    2, 3, 2),
  ('rag',           3, '检索增强生成', 'RAG',               'Database',  '检索外部知识增强生成', 'Retrieve external knowledge to enhance generation', 3, 5, 3),
  ('world-model',   1, '世界模型',     'World Model',       'Globe',     '物理与时空建模',       'Physical & spatiotemporal modeling',                4, 3, 1),
  ('causal',        1, '因果推理',     'Causal Reasoning',  'Bot',       '反事实与因果推断',     'Counterfactual & causal inference',                 4, 3, 2);

-- ── 语义轴数据 ────────────────────────────────────────────────
INSERT INTO axes (axis_type, name, zh_name) VALUES
  ('architecture',  'architecture',         '架构'),
  ('architecture',  'attention-mechanism',  '注意力机制'),
  ('training',      'pre-training',         '预训练'),
  ('training',      'fine-tuning',          '微调'),
  ('reasoning',     'reasoning-foundation', '推理基础'),
  ('reasoning',     'planning',             '规划'),
  ('system',        'retrieval',            '检索'),
  ('system',        'memory',               '记忆'),
  ('system',        'orchestration',        '编排'),
  ('application',   'generation',           '生成'),
  ('application',   'decision',             '决策');

-- ── 概念-轴关联 ───────────────────────────────────────────────
INSERT INTO concept_axes (concept_id, axis_id)
SELECT c.id, a.id FROM concepts c, axes a WHERE
  (c.slug = 'transformer' AND a.name IN ('architecture', 'attention-mechanism', 'reasoning-foundation')) OR
  (c.slug = 'moe'         AND a.name IN ('architecture', 'pre-training')) OR
  (c.slug = 'embedding'   AND a.name IN ('retrieval', 'reasoning-foundation')) OR
  (c.slug = 'rag'         AND a.name IN ('retrieval', 'orchestration', 'application')) OR
  (c.slug = 'react'       AND a.name IN ('reasoning-foundation', 'planning', 'orchestration')) OR
  (c.slug = 'planning'    AND a.name IN ('planning', 'orchestration')) OR
  (c.slug = 'memory'      AND a.name IN ('memory', 'orchestration')) OR
  (c.slug = 'generate'    AND a.name IN ('generation')) OR
  (c.slug = 'decision'    AND a.name IN ('decision', 'reasoning-foundation')) OR
  (c.slug = 'orchestration' AND a.name IN ('orchestration')) OR
  (c.slug = 'observability' AND a.name IN ('orchestration')) OR
  (c.slug = 'scaling'     AND a.name IN ('pre-training', 'architecture')) OR
  (c.slug = 'world-model' AND a.name IN ('reasoning-foundation', 'architecture')) OR
  (c.slug = 'causal'      AND a.name IN ('reasoning-foundation'));

-- ── 概念关系（升级版，含 weight）─────────────────────────────
-- RAG 的关系
INSERT INTO concept_relations (source_id, target_id, rel_type, weight)
SELECT s.id, t.id, r.rel_type, r.weight
FROM (VALUES
  ('rag', 'embedding',     'upstream',   1.0),
  ('rag', 'transformer',   'upstream',   0.8),
  ('rag', 'orchestration', 'parallel',   0.9),
  ('rag', 'observability', 'parallel',   0.7),
  ('rag', 'decision',      'downstream', 0.8)
) AS r(src, tgt, rel_type, weight)
JOIN concepts s ON s.slug = r.src
JOIN concepts t ON t.slug = r.tgt;

-- Transformer 的关系
INSERT INTO concept_relations (source_id, target_id, rel_type, weight)
SELECT s.id, t.id, r.rel_type, r.weight
FROM (VALUES
  ('transformer', 'embedding', 'downstream', 1.0),
  ('transformer', 'moe',       'downstream', 0.9),
  ('transformer', 'scaling',   'parallel',   0.8)
) AS r(src, tgt, rel_type, weight)
JOIN concepts s ON s.slug = r.src
JOIN concepts t ON t.slug = r.tgt;

-- Embedding 的关系
INSERT INTO concept_relations (source_id, target_id, rel_type, weight)
SELECT s.id, t.id, r.rel_type, r.weight
FROM (VALUES
  ('embedding', 'transformer', 'upstream',   1.0),
  ('embedding', 'rag',         'downstream', 1.0)
) AS r(src, tgt, rel_type, weight)
JOIN concepts s ON s.slug = r.src
JOIN concepts t ON t.slug = r.tgt;

-- ReAct 的关系
INSERT INTO concept_relations (source_id, target_id, rel_type, weight)
SELECT s.id, t.id, r.rel_type, r.weight
FROM (VALUES
  ('react', 'transformer', 'upstream',   0.9),
  ('react', 'planning',    'downstream', 1.0),
  ('react', 'memory',      'downstream', 0.8),
  ('react', 'rag',         'parallel',   0.7)
) AS r(src, tgt, rel_type, weight)
JOIN concepts s ON s.slug = r.src
JOIN concepts t ON t.slug = r.tgt;

-- ── 学习路径：RAG 入门路径 ────────────────────────────────────
INSERT INTO learning_paths (slug, zh_name, en_name, description, path_type, difficulty, duration)
VALUES ('rag-intro', '理解 RAG', 'Understanding RAG', '从零理解检索增强生成的最小知识链路', 'learning', 2, 45);

INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'rag-intro'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer',   1, false, '理解 Attention 机制是基础'),
  ('embedding',     2, true,  '向量化是 RAG 的核心前置'),
  ('rag',           3, true,  '核心概念'),
  ('orchestration', 4, false, '工程化编排'),
  ('observability', 5, false, '生产环境监控')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- ── 学习路径：Agent 工程路径 ──────────────────────────────────
INSERT INTO learning_paths (slug, zh_name, en_name, description, path_type, difficulty, duration)
VALUES ('agent-engineering', 'Agent 工程化', 'Agent Engineering', '从 ReAct 到完整 Agent 系统的工程路径', 'engineering', 3, 60);

INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'agent-engineering'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer', 1, false, 'LLM 基础'),
  ('react',       2, true,  'Agent 核心范式'),
  ('planning',    3, true,  '多步规划'),
  ('memory',      4, false, '状态管理'),
  ('orchestration', 5, true, '系统编排')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;
