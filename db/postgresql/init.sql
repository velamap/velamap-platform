-- ── 一级导航分类 ──────────────────────────────────────────────
CREATE TABLE nav_categories (
  id       SERIAL PRIMARY KEY,
  slug     VARCHAR(50) NOT NULL UNIQUE,
  zh_label VARCHAR(100) NOT NULL,
  en_label VARCHAR(100) NOT NULL,
  icon     VARCHAR(50) NOT NULL,
  sort_order INT DEFAULT 0
);

-- ── 概念表 ────────────────────────────────────────────────────
CREATE TABLE concepts (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  category_id INT NOT NULL REFERENCES nav_categories(id) ON DELETE CASCADE,
  zh_name     VARCHAR(100) NOT NULL,
  en_name     VARCHAR(100) NOT NULL,
  icon        VARCHAR(50) NOT NULL DEFAULT 'BookOpen',
  zh_desc     TEXT,
  en_desc     TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 概念关系表 ────────────────────────────────────────────────
CREATE TABLE concept_relations (
  id        SERIAL PRIMARY KEY,
  source_id INT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id INT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  rel_type  VARCHAR(30) NOT NULL,  -- upstream / parallel / downstream
  UNIQUE (source_id, target_id, rel_type)
);

-- ── 一级导航数据 ──────────────────────────────────────────────
INSERT INTO nav_categories (slug, zh_label, en_label, icon, sort_order) VALUES
  ('frontier',     '前沿探索', 'Frontier',     'Telescope',   1),
  ('applications', '应用方案', 'Applications', 'LayoutGrid',  2),
  ('execution',    '工程化',   'Engineering',  'Cpu',         3),
  ('agents',       '智能体',   'Agents',       'Bot',         4),
  ('ai-infra',     '基础设施', 'AI Infra',     'Server',      5);

-- ── 概念数据 ──────────────────────────────────────────────────
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, sort_order) VALUES
  ('transformer',   5, 'Transformer',  'Transformer',       'Code',      '神经网络核心架构',     'Core neural network architecture',                  1),
  ('moe',           5, 'MoE 架构',     'MoE Architecture',  'Bot',       '混合专家稀疏模型',     'Mixture of Experts sparse model',                   2),
  ('embedding',     5, 'Embedding',    'Embedding',         'Bookmark',  '文本/图像向量表示',    'Text/image vector representation',                  3),
  ('scaling',       5, 'Scaling Law',  'Scaling Law',       'BarChart',  '模型性能缩放规律',     'Model performance scaling rules',                   4),
  ('react',         4, 'ReAct',        'ReAct',             'Bot',       '推理+行动协同架构',    'Reasoning + acting architecture',                   1),
  ('planning',      4, '规划系统',     'Planning',          'LayoutGrid','多步决策与目标分解',   'Multi-step planning & decomposition',                2),
  ('memory',        4, '记忆系统',     'Memory',            'Bookmark',  '长短时记忆管理',       'Long/short-term memory management',                 3),
  ('generate',      2, '内容生成',     'Generation',        'BookOpen',  '文本/图像/音频生成',   'Text/image/audio generation',                       1),
  ('decision',      2, '决策辅助',     'Decision',          'Bot',       '分析与判断增强',       'Analysis & decision augmentation',                  2),
  ('orchestration', 3, '工作流编排',   'Orchestration',     'LayoutGrid','DAG/状态机执行',       'DAG / state machine execution',                     1),
  ('observability', 3, '可观测性',     'Observability',     'BarChart',  '监控/追踪/日志',       'Monitoring / tracing / logging',                    2),
  ('rag',           3, '检索增强生成', 'RAG',               'Database',  '检索外部知识增强生成', 'Retrieve external knowledge to enhance generation', 3),
  ('world-model',   1, '世界模型',     'World Model',       'Globe',     '物理与时空建模',       'Physical & spatiotemporal modeling',                1),
  ('causal',        1, '因果推理',     'Causal Reasoning',  'Bot',       '反事实与因果推断',     'Counterfactual & causal inference',                 2);

-- ── RAG 上下游关系 ────────────────────────────────────────────
INSERT INTO concept_relations (source_id, target_id, rel_type) VALUES
  (12, 3,  'upstream'),
  (12, 1,  'upstream'),
  (12, 10, 'parallel'),
  (12, 11, 'parallel'),
  (12, 9,  'downstream');
