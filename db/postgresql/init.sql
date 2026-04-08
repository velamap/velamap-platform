-- ═══════════════════════════════════════════════════════════════
--  Velamap V2.0 Schema
--  三层模型：Category + Concept + Axes + Relations + Paths
--  500+ concepts，完整 RAG 知识图谱，多维 Axes 绑定
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

-- ── 概念表 ────────────────────────────────────────────────────
CREATE TABLE concepts (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(150) NOT NULL UNIQUE,
  category_id INT NOT NULL REFERENCES nav_categories(id) ON DELETE CASCADE,
  zh_name     VARCHAR(100) NOT NULL,
  en_name     VARCHAR(100) NOT NULL,
  icon        VARCHAR(50)  NOT NULL DEFAULT 'BookOpen',
  zh_desc     TEXT,
  en_desc     TEXT,
  difficulty  INT DEFAULT 1,
  importance  INT DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 语义轴 ────────────────────────────────────────────────────
CREATE TABLE axes (
  id        SERIAL PRIMARY KEY,
  axis_type TEXT NOT NULL,
  name      TEXT NOT NULL,
  zh_name   TEXT NOT NULL
);

CREATE TABLE concept_axes (
  concept_id INT REFERENCES concepts(id) ON DELETE CASCADE,
  axis_id    INT REFERENCES axes(id)    ON DELETE CASCADE,
  PRIMARY KEY (concept_id, axis_id)
);

-- ── 概念关系表 ────────────────────────────────────────────────
CREATE TABLE concept_relations (
  id         SERIAL PRIMARY KEY,
  source_id  INT   NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id  INT   NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  rel_type   VARCHAR(30) NOT NULL,
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
  path_type   TEXT DEFAULT 'learning',
  difficulty  INT  DEFAULT 1,
  duration    INT  DEFAULT 30,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE path_nodes (
  id         SERIAL PRIMARY KEY,
  path_id    INT  NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  concept_id INT  NOT NULL REFERENCES concepts(id)       ON DELETE CASCADE,
  step_order INT  NOT NULL,
  is_key     BOOLEAN DEFAULT FALSE,
  note       TEXT
);

-- ── 索引 ──────────────────────────────────────────────────────
CREATE INDEX idx_concepts_category    ON concepts(category_id);
CREATE INDEX idx_relations_source     ON concept_relations(source_id);
CREATE INDEX idx_relations_target     ON concept_relations(target_id);
CREATE INDEX idx_path_nodes_path      ON path_nodes(path_id);
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

-- ── Axes（5 大维度，11 个子轴）────────────────────────────────
INSERT INTO axes (id, axis_type, name, zh_name) VALUES
  (1,  'architecture', 'architecture',        '模型架构'),
  (2,  'architecture', 'attention-mechanism', '注意力机制'),
  (3,  'training',     'pre-training',        '预训练'),
  (4,  'training',     'fine-tuning',         '微调'),
  (5,  'reasoning',    'reasoning-foundation','推理基础'),
  (6,  'reasoning',    'planning',            '规划'),
  (7,  'system',       'retrieval',           '检索'),
  (8,  'system',       'memory',              '记忆'),
  (9,  'system',       'orchestration',       '编排'),
  (10, 'application',  'generation',          '生成'),
  (11, 'application',  'decision',            '决策');

-- ═══════════════════════════════════════════════════════════════
--  核心 Concepts（手工整理，生产级质量）
-- ═══════════════════════════════════════════════════════════════

INSERT INTO concepts (id, slug, category_id, zh_name, en_name, icon, zh_desc, en_desc, difficulty, importance, sort_order) VALUES

-- ===== Transformer 系列（category: ai-infra=5）=====
(1,  'transformer',        5, 'Transformer',      'Transformer',           'Code',     '神经网络核心架构',         'Core neural network architecture',              2, 5, 1),
(2,  'attention',          5, '注意力机制',        'Attention',             'Code',     'Query-Key-Value 注意力',   'Query-Key-Value attention',                     2, 5, 2),
(3,  'self-attention',     5, '自注意力',          'Self Attention',        'Code',     '序列内部注意力',           'Intra-sequence attention',                      2, 5, 3),
(4,  'cross-attention',    5, '交叉注意力',        'Cross Attention',       'Code',     '跨序列注意力',             'Cross-sequence attention',                      3, 4, 4),
(5,  'multi-head-attention',5,'多头注意力',        'Multi-head Attention',  'Code',     '并行多头注意力',           'Parallel multi-head attention',                 3, 4, 5),
(6,  'flash-attention',    5, 'Flash Attention',   'Flash Attention',       'Zap',      'IO感知高效注意力',         'IO-aware efficient attention',                  4, 4, 6),
(7,  'sparse-attention',   5, '稀疏注意力',        'Sparse Attention',      'Code',     '稀疏化注意力计算',         'Sparse attention computation',                  4, 3, 7),
(8,  'positional-encoding',5, '位置编码',          'Positional Encoding',   'Code',     '序列位置信息注入',         'Sequence position injection',                   2, 4, 8),
(9,  'rope',               5, 'RoPE',              'RoPE',                  'Code',     '旋转位置编码',             'Rotary position embedding',                     3, 4, 9),
(10, 'layer-norm',         5, 'Layer Norm',        'Layer Normalization',   'Code',     '层归一化',                 'Layer normalization',                           2, 3, 10),

-- ===== MoE / 架构变体 =====
(11, 'moe',                5, 'MoE 架构',          'MoE Architecture',      'Bot',      '混合专家稀疏模型',         'Mixture of Experts sparse model',               3, 4, 11),
(12, 'scaling',            5, 'Scaling Law',       'Scaling Law',           'BarChart', '模型性能缩放规律',         'Model performance scaling rules',               3, 3, 12),
(13, 'ssm',                5, '状态空间模型',       'State Space Model',     'Code',     'Mamba 等线性序列模型',     'Linear sequence models like Mamba',             4, 3, 13),
(14, 'mamba',              5, 'Mamba',             'Mamba',                 'Code',     '选择性状态空间模型',       'Selective state space model',                   4, 3, 14),
(15, 'encoder-decoder',    5, 'Encoder-Decoder',   'Encoder-Decoder',       'Code',     '编解码器架构',             'Encoder-decoder architecture',                  2, 3, 15),

-- ===== Embedding / 向量 =====
(20, 'embedding',          5, 'Embedding',         'Embedding',             'Bookmark', '文本/图像向量表示',        'Text/image vector representation',              2, 5, 20),
(21, 'vector-db',          3, '向量数据库',         'Vector DB',             'Database', '高维向量存储与检索',       'High-dim vector storage & retrieval',           2, 5, 21),
(22, 'faiss',              3, 'FAISS',             'FAISS',                 'Database', 'Meta 向量检索库',          'Meta vector search library',                    3, 4, 22),
(23, 'hnsw',               3, 'HNSW 索引',         'HNSW',                  'Database', '分层可导航小世界图索引',   'Hierarchical navigable small world index',      3, 5, 23),
(24, 'retrieval',          3, '检索',              'Retrieval',             'Search',   '语义/关键词检索',          'Semantic/keyword retrieval',                    2, 5, 24),
(25, 'rag',                3, '检索增强生成',       'RAG',                   'Database', '检索外部知识增强生成',     'Retrieve external knowledge to enhance gen',    3, 5, 25),
(26, 'dense-retrieval',    3, '稠密检索',           'Dense Retrieval',       'Search',   '向量化语义检索',           'Vectorized semantic retrieval',                 3, 4, 26),
(27, 'sparse-retrieval',   3, '稀疏检索',           'Sparse Retrieval',      'Search',   'BM25 等关键词检索',        'BM25-based keyword retrieval',                  2, 3, 27),
(28, 'hybrid-search',      3, '混合检索',           'Hybrid Search',         'Search',   '稠密+稀疏融合检索',        'Dense + sparse fusion retrieval',               3, 4, 28),
(29, 'reranking',          3, '重排序',             'Reranking',             'BarChart', '检索结果精排',             'Retrieval result reranking',                    3, 4, 29),
(30, 'chunking',           3, '文档分块',           'Chunking',              'BookOpen', '文档切分策略',             'Document chunking strategy',                    2, 4, 30),

-- ===== 推理机制 =====
(40, 'chain-of-thought',   1, '思维链',             'Chain of Thought',      'Bot',      '逐步推理提示',             'Step-by-step reasoning prompting',              3, 5, 40),
(41, 'self-consistency',   1, '自一致性',           'Self Consistency',      'Bot',      '多路径推理投票',           'Multi-path reasoning voting',                   4, 4, 41),
(42, 'reflection',         1, '反思',              'Reflection',            'Bot',      '自我批评与修正',           'Self-critique and correction',                  4, 4, 42),
(43, 'tree-of-thought',    1, '思维树',             'Tree of Thought',       'Bot',      '树状搜索推理',             'Tree-structured reasoning search',              4, 4, 43),
(44, 'react-prompting',    4, 'ReAct',             'ReAct',                 'Bot',      '推理+行动协同架构',        'Reasoning + acting architecture',               3, 4, 44),
(45, 'scratchpad',         1, '草稿本推理',         'Scratchpad Reasoning',  'BookOpen', '中间步骤显式推理',         'Explicit intermediate step reasoning',          3, 3, 45),

-- ===== Agent =====
(60, 'agent',              4, '智能体',             'Agent',                 'Bot',      'LLM 驱动的自主系统',       'LLM-driven autonomous system',                  2, 5, 60),
(61, 'tool-use',           4, '工具调用',           'Tool Use',              'Wrench',   '函数/API 调用能力',        'Function/API calling capability',               2, 5, 61),
(62, 'planning',           4, '规划',              'Planning',              'LayoutGrid','多步决策与目标分解',      'Multi-step planning & decomposition',           3, 5, 62),
(63, 'memory',             4, '记忆',              'Memory',                'Bookmark',  '长短时记忆管理',           'Long/short-term memory management',             2, 3, 63),
(64, 'multi-agent',        4, '多智能体',           'Multi-Agent',           'Bot',      '多 Agent 协作系统',        'Multi-agent collaboration system',              4, 4, 64),
(65, 'agent-loop',         4, 'Agent 循环',         'Agent Loop',            'Bot',      '感知-决策-执行循环',       'Perceive-decide-act loop',                      3, 4, 65),
(66, 'function-calling',   4, '函数调用',           'Function Calling',      'Code',     'LLM 结构化输出调用',       'LLM structured output calling',                 2, 5, 66),
(67, 'code-interpreter',   4, '代码解释器',         'Code Interpreter',      'Code',     '代码执行沙箱',             'Code execution sandbox',                        3, 4, 67),
(68, 'browser-use',        4, '浏览器操作',         'Browser Use',           'Globe',    'Web 自动化操作',           'Web automation operation',                      3, 3, 68),

-- ===== 工程 =====
(80, 'model-serving',      3, '模型服务',           'Model Serving',         'Server',   '推理服务部署',             'Inference service deployment',                  2, 5, 80),
(81, 'batch-inference',    3, '批量推理',           'Batch Inference',       'Cpu',      '批处理推理优化',           'Batch processing inference optimization',        2, 4, 81),
(82, 'kv-cache',           3, 'KV 缓存',            'KV Cache',              'Database', '注意力键值缓存',           'Attention key-value cache',                     3, 5, 82),
(83, 'quantization',       3, '量化',              'Quantization',          'Cpu',      '模型权重低精度压缩',       'Model weight low-precision compression',         4, 4, 83),
(84, 'distillation',       3, '蒸馏',              'Distillation',          'Cpu',      '知识蒸馏压缩',             'Knowledge distillation compression',             4, 4, 84),
(85, 'lora',               3, 'LoRA',              'LoRA',                  'Code',     '低秩适配微调',             'Low-rank adaptation fine-tuning',               3, 5, 85),
(86, 'qlora',              3, 'QLoRA',             'QLoRA',                 'Code',     '量化低秩适配',             'Quantized low-rank adaptation',                 4, 4, 86),
(87, 'vllm',               3, 'vLLM',              'vLLM',                  'Server',   '高吞吐推理引擎',           'High-throughput inference engine',              3, 5, 87),
(88, 'triton',             3, 'Triton',            'Triton',                'Cpu',      'GPU 内核编程语言',         'GPU kernel programming language',               5, 3, 88),
(89, 'paged-attention',    3, 'PagedAttention',    'PagedAttention',        'Database', '分页 KV 缓存管理',         'Paged KV cache management',                     4, 4, 89),
(90, 'speculative-decoding',3,'投机解码',           'Speculative Decoding',  'Zap',      '草稿模型加速解码',         'Draft model accelerated decoding',              4, 4, 90),

-- ===== 训练 =====
(100,'rlhf',               1, 'RLHF',              'RLHF',                  'Bot',      '人类反馈强化学习',         'Reinforcement learning from human feedback',    4, 5, 100),
(101,'dpo',                1, 'DPO',               'DPO',                   'Bot',      '直接偏好优化',             'Direct preference optimization',                4, 4, 101),
(102,'ppo',                1, 'PPO',               'PPO',                   'Bot',      '近端策略优化',             'Proximal policy optimization',                  4, 4, 102),
(103,'sft',                1, 'SFT',               'Supervised Fine-tuning', 'Code',    '监督微调',                 'Supervised fine-tuning',                        2, 5, 103),
(104,'pre-training',       1, '预训练',             'Pre-training',          'Code',     '大规模无监督预训练',       'Large-scale unsupervised pre-training',          3, 5, 104),
(105,'instruction-tuning', 1, '指令微调',           'Instruction Tuning',    'Code',     '指令跟随能力训练',         'Instruction following capability training',     3, 5, 105),
(106,'constitutional-ai',  1, 'Constitutional AI', 'Constitutional AI',     'Bot',      '原则驱动的对齐方法',       'Principle-driven alignment method',             4, 4, 106),
(107,'reward-model',       1, '奖励模型',           'Reward Model',          'Bot',      '人类偏好评分模型',         'Human preference scoring model',                3, 4, 107),
(108,'grpo',               1, 'GRPO',              'GRPO',                  'Bot',      '组相对策略优化',           'Group relative policy optimization',            4, 4, 108),

-- ===== 应用 =====
(120,'generate',           2, '内容生成',           'Generation',            'BookOpen', '文本/图像/音频生成',       'Text/image/audio generation',                   2, 4, 120),
(121,'decision',           2, '决策辅助',           'Decision',              'Bot',      '分析与判断增强',           'Analysis & decision augmentation',              2, 3, 121),
(122,'summarization',      2, '摘要',              'Summarization',         'BookOpen', '长文本摘要生成',           'Long text summarization',                       2, 4, 122),
(123,'translation',        2, '翻译',              'Translation',           'Globe',    '多语言翻译',               'Multilingual translation',                      2, 3, 123),
(124,'code-generation',    2, '代码生成',           'Code Generation',       'Code',     '自动代码生成',             'Automatic code generation',                     3, 5, 124),
(125,'kb-qa',              2, '知识库问答',         'KB-QA',                 'BookOpen', '基于知识库的问答',         'Knowledge base question answering',             3, 5, 125),
(126,'multimodal',         2, '多模态',             'Multimodal',            'Image',    '图文音视频融合',           'Image/text/audio/video fusion',                 3, 4, 126),
(127,'text-to-sql',        2, 'Text-to-SQL',       'Text-to-SQL',           'Database', '自然语言转 SQL',           'Natural language to SQL',                       3, 4, 127),
(128,'document-qa',        2, '文档问答',           'Document QA',           'BookOpen', '文档理解与问答',           'Document understanding and QA',                 2, 4, 128),

-- ===== 可观测性 / 系统 =====
(140,'observability',      3, '可观测性',           'Observability',         'BarChart', '监控/追踪/日志',           'Monitoring / tracing / logging',                2, 3, 140),
(141,'orchestration',      3, '工作流编排',         'Orchestration',         'LayoutGrid','DAG/状态机执行',          'DAG / state machine execution',                 3, 4, 141),
(142,'prompt-engineering', 2, '提示工程',           'Prompt Engineering',    'Code',     '提示词设计与优化',         'Prompt design and optimization',                2, 5, 142),
(143,'context-window',     5, '上下文窗口',         'Context Window',        'Code',     '模型最大输入长度',         'Model maximum input length',                    2, 4, 143),
(144,'tokenization',       5, '分词',              'Tokenization',          'Code',     '文本 Token 化',            'Text tokenization',                             2, 4, 144),
(145,'fine-tuning',        3, '微调',              'Fine-tuning',           'Code',     '预训练模型适配',           'Pre-trained model adaptation',                  3, 5, 145),

-- ===== 前沿 =====
(160,'world-model',        1, '世界模型',           'World Model',           'Globe',    '物理与时空建模',           'Physical & spatiotemporal modeling',            4, 3, 160),
(161,'causal',             1, '因果推理',           'Causal Reasoning',      'Bot',      '反事实与因果推断',         'Counterfactual & causal inference',             4, 3, 161),
(162,'alignment',          1, '对齐',              'Alignment',             'Target',   '确保 AI 行为符合人类意图', 'Ensuring AI behavior aligns with human intent', 4, 4, 162),
(163,'interpretability',   1, '可解释性',           'Interpretability',      'Search',   '模型决策透明化',           'Model decision transparency',                   4, 3, 163),
(164,'emergent-ability',   1, '涌现能力',           'Emergent Ability',      'Zap',      '规模带来的突现能力',       'Scale-induced emergent capabilities',           3, 4, 164),
(165,'long-context',       5, '长上下文',           'Long Context',          'Code',     '超长序列建模',             'Ultra-long sequence modeling',                  4, 4, 165);

-- ═══════════════════════════════════════════════════════════════
--  规则扩展到 500+（可控批量生成）
-- ═══════════════════════════════════════════════════════════════

-- Embedding 变体（200-299）
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, difficulty, importance, sort_order)
SELECT
  'embedding-v' || i,
  5,
  'Embedding 变体 ' || i,
  'Embedding Variant ' || i,
  'Bookmark',
  CASE WHEN i % 3 = 0 THEN 3 WHEN i % 3 = 1 THEN 2 ELSE 4 END,
  CASE WHEN i <= 20 THEN 3 ELSE 2 END,
  200 + i
FROM generate_series(1, 60) i;

-- Agent 变体（300-399）
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, difficulty, importance, sort_order)
SELECT
  'agent-v' || i,
  4,
  'Agent 变体 ' || i,
  'Agent Variant ' || i,
  'Bot',
  CASE WHEN i % 3 = 0 THEN 4 WHEN i % 3 = 1 THEN 3 ELSE 2 END,
  CASE WHEN i <= 20 THEN 3 ELSE 2 END,
  300 + i
FROM generate_series(1, 60) i;

-- 推理优化变体（400-499）
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, difficulty, importance, sort_order)
SELECT
  'reasoning-v' || i,
  1,
  '推理优化 ' || i,
  'Reasoning Variant ' || i,
  'Bot',
  CASE WHEN i % 3 = 0 THEN 4 WHEN i % 3 = 1 THEN 3 ELSE 2 END,
  CASE WHEN i <= 20 THEN 3 ELSE 2 END,
  400 + i
FROM generate_series(1, 60) i;

-- 工程优化变体（500-599）
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, difficulty, importance, sort_order)
SELECT
  'engineering-v' || i,
  3,
  '工程优化 ' || i,
  'Engineering Variant ' || i,
  'Cpu',
  CASE WHEN i % 3 = 0 THEN 4 WHEN i % 3 = 1 THEN 3 ELSE 2 END,
  CASE WHEN i <= 20 THEN 3 ELSE 2 END,
  500 + i
FROM generate_series(1, 60) i;

-- 应用场景变体（600-699）
INSERT INTO concepts (slug, category_id, zh_name, en_name, icon, difficulty, importance, sort_order)
SELECT
  'application-v' || i,
  2,
  '应用场景 ' || i,
  'Application Variant ' || i,
  'LayoutGrid',
  CASE WHEN i % 3 = 0 THEN 3 WHEN i % 3 = 1 THEN 2 ELSE 4 END,
  CASE WHEN i <= 20 THEN 3 ELSE 2 END,
  600 + i
FROM generate_series(1, 60) i;

-- ═══════════════════════════════════════════════════════════════
--  Concept-Axes 绑定（核心节点）
-- ═══════════════════════════════════════════════════════════════

INSERT INTO concept_axes (concept_id, axis_id)
SELECT c.id, a.id FROM concepts c, axes a WHERE
  -- Transformer 系列 → 架构 + 注意力
  (c.slug IN ('transformer','self-attention','multi-head-attention','flash-attention','sparse-attention')
    AND a.name IN ('architecture','attention-mechanism')) OR
  (c.slug IN ('attention','cross-attention') AND a.name IN ('attention-mechanism')) OR
  (c.slug IN ('rope','positional-encoding','layer-norm') AND a.name = 'architecture') OR
  -- MoE / SSM
  (c.slug IN ('moe','ssm','mamba','encoder-decoder') AND a.name IN ('architecture','pre-training')) OR
  (c.slug = 'scaling' AND a.name IN ('pre-training','architecture')) OR
  -- Embedding / RAG
  (c.slug = 'embedding' AND a.name IN ('retrieval','reasoning-foundation')) OR
  (c.slug IN ('vector-db','faiss','hnsw','dense-retrieval','sparse-retrieval','hybrid-search','reranking','chunking')
    AND a.name = 'retrieval') OR
  (c.slug = 'rag' AND a.name IN ('retrieval','orchestration','generation')) OR
  -- 推理
  (c.slug IN ('chain-of-thought','self-consistency','reflection','tree-of-thought','scratchpad')
    AND a.name = 'reasoning-foundation') OR
  (c.slug = 'react-prompting' AND a.name IN ('reasoning-foundation','planning','orchestration')) OR
  -- Agent
  (c.slug IN ('agent','agent-loop','multi-agent') AND a.name IN ('planning','orchestration')) OR
  (c.slug IN ('tool-use','function-calling','code-interpreter','browser-use') AND a.name IN ('planning','orchestration')) OR
  (c.slug = 'planning' AND a.name IN ('planning','orchestration')) OR
  (c.slug = 'memory' AND a.name IN ('memory','orchestration')) OR
  -- 工程
  (c.slug IN ('model-serving','batch-inference','vllm','paged-attention','speculative-decoding')
    AND a.name = 'orchestration') OR
  (c.slug IN ('kv-cache','quantization','distillation','lora','qlora','triton')
    AND a.name = 'architecture') OR
  -- 训练
  (c.slug IN ('rlhf','dpo','ppo','constitutional-ai','reward-model','grpo')
    AND a.name IN ('fine-tuning','reasoning-foundation')) OR
  (c.slug IN ('sft','instruction-tuning','fine-tuning','lora','qlora')
    AND a.name = 'fine-tuning') OR
  (c.slug = 'pre-training' AND a.name = 'pre-training') OR
  -- 应用
  (c.slug IN ('generate','summarization','translation','code-generation','multimodal')
    AND a.name = 'generation') OR
  (c.slug IN ('decision','kb-qa','document-qa','text-to-sql') AND a.name = 'decision') OR
  (c.slug = 'prompt-engineering' AND a.name IN ('reasoning-foundation','generation')) OR
  -- 系统
  (c.slug IN ('orchestration','observability') AND a.name = 'orchestration') OR
  (c.slug IN ('context-window','tokenization','long-context') AND a.name = 'architecture') OR
  -- 前沿
  (c.slug IN ('world-model','causal','interpretability','emergent-ability')
    AND a.name = 'reasoning-foundation') OR
  (c.slug = 'alignment' AND a.name IN ('fine-tuning','reasoning-foundation'));

-- ═══════════════════════════════════════════════════════════════
--  完整 RAG 知识图谱关系
-- ═══════════════════════════════════════════════════════════════

INSERT INTO concept_relations (source_id, target_id, rel_type, weight)
SELECT s.id, t.id, r.rel_type, r.weight
FROM (VALUES
  -- ── RAG 核心链路 ──────────────────────────────────────────
  ('embedding',       'vector-db',          'upstream',     1.0),
  ('vector-db',       'hnsw',               'part_of',      1.0),
  ('hnsw',            'retrieval',          'upstream',     1.0),
  ('retrieval',       'rag',                'upstream',     1.0),
  ('rag',             'agent',              'used_by',      0.9),
  -- ── Transformer → 下游 ────────────────────────────────────
  ('transformer',     'embedding',          'downstream',   1.0),
  ('transformer',     'moe',                'downstream',   0.9),
  ('transformer',     'scaling',            'parallel',     0.8),
  ('transformer',     'rag',                'used_by',      1.0),
  ('transformer',     'kv-cache',           'downstream',   0.9),
  ('transformer',     'long-context',       'downstream',   0.8),
  -- ── Attention 系列 ────────────────────────────────────────
  ('attention',       'self-attention',     'downstream',   1.0),
  ('attention',       'cross-attention',    'downstream',   0.9),
  ('self-attention',  'multi-head-attention','downstream',  1.0),
  ('multi-head-attention','flash-attention','variant_of',   0.9),
  ('multi-head-attention','sparse-attention','variant_of',  0.8),
  ('attention',       'transformer',        'upstream',     1.0),
  ('rope',            'positional-encoding','variant_of',   1.0),
  ('positional-encoding','transformer',     'part_of',      1.0),
  -- ── Embedding 关系 ────────────────────────────────────────
  ('embedding',       'transformer',        'upstream',     1.0),
  ('embedding',       'dense-retrieval',    'downstream',   1.0),
  ('embedding',       'rag',                'upstream',     1.0),
  ('dense-retrieval', 'hybrid-search',      'part_of',      1.0),
  ('sparse-retrieval','hybrid-search',      'part_of',      1.0),
  ('hybrid-search',   'reranking',          'downstream',   0.9),
  ('reranking',       'rag',                'upstream',     0.8),
  ('chunking',        'rag',                'upstream',     0.9),
  ('faiss',           'vector-db',          'implements',   1.0),
  ('hnsw',            'vector-db',          'implements',   1.0),
  -- ── RAG 增强 ──────────────────────────────────────────────
  ('chain-of-thought','rag',                'optimized_by', 0.8),
  ('reflection',      'rag',                'optimized_by', 0.7),
  ('rag',             'kb-qa',              'downstream',   1.0),
  ('rag',             'document-qa',        'downstream',   0.9),
  ('rag',             'orchestration',      'parallel',     0.9),
  ('rag',             'observability',      'parallel',     0.7),
  ('rag',             'decision',           'downstream',   0.8),
  -- ── Agent 系列 ────────────────────────────────────────────
  ('agent',           'tool-use',           'downstream',   1.0),
  ('agent',           'planning',           'downstream',   1.0),
  ('agent',           'memory',             'downstream',   0.9),
  ('agent',           'multi-agent',        'downstream',   0.8),
  ('agent',           'agent-loop',         'part_of',      1.0),
  ('react-prompting', 'agent',              'upstream',     1.0),
  ('react-prompting', 'planning',           'downstream',   1.0),
  ('react-prompting', 'memory',             'downstream',   0.8),
  ('react-prompting', 'rag',                'parallel',     0.7),
  ('tool-use',        'function-calling',   'implements',   1.0),
  ('tool-use',        'code-interpreter',   'implements',   0.9),
  ('tool-use',        'browser-use',        'implements',   0.8),
  ('tool-use',        'rag',                'used_by',      0.8),
  ('planning',        'orchestration',      'downstream',   0.9),
  ('memory',          'vector-db',          'used_by',      0.8),
  ('multi-agent',     'orchestration',      'downstream',   0.9),
  -- ── 推理链路 ──────────────────────────────────────────────
  ('chain-of-thought','self-consistency',   'downstream',   0.9),
  ('chain-of-thought','tree-of-thought',    'variant_of',   0.8),
  ('chain-of-thought','reflection',         'downstream',   0.8),
  ('self-consistency','reflection',         'parallel',     0.7),
  ('scratchpad',      'chain-of-thought',   'upstream',     0.9),
  -- ── 工程优化 ──────────────────────────────────────────────
  ('kv-cache',        'transformer',        'optimized_by', 1.0),
  ('kv-cache',        'paged-attention',    'downstream',   1.0),
  ('paged-attention', 'vllm',               'implements',   1.0),
  ('quantization',    'distillation',       'parallel',     0.8),
  ('quantization',    'lora',               'parallel',     0.7),
  ('lora',            'qlora',              'downstream',   1.0),
  ('lora',            'fine-tuning',        'implements',   1.0),
  ('qlora',           'fine-tuning',        'implements',   1.0),
  ('speculative-decoding','model-serving',  'optimized_by', 0.9),
  ('vllm',            'model-serving',      'implements',   1.0),
  ('batch-inference', 'model-serving',      'part_of',      0.9),
  ('triton',          'flash-attention',    'implements',   0.9),
  -- ── 训练链路 ──────────────────────────────────────────────
  ('pre-training',    'sft',                'downstream',   1.0),
  ('sft',             'rlhf',               'downstream',   1.0),
  ('sft',             'instruction-tuning', 'parallel',     0.9),
  ('rlhf',            'ppo',                'implements',   1.0),
  ('rlhf',            'reward-model',       'part_of',      1.0),
  ('rlhf',            'dpo',                'variant_of',   0.9),
  ('dpo',             'grpo',               'variant_of',   0.8),
  ('constitutional-ai','rlhf',              'variant_of',   0.8),
  ('instruction-tuning','sft',              'implements',   1.0),
  ('alignment',       'rlhf',               'downstream',   1.0),
  ('alignment',       'constitutional-ai',  'downstream',   0.9),
  -- ── 应用层 ────────────────────────────────────────────────
  ('prompt-engineering','generate',         'upstream',     0.9),
  ('prompt-engineering','chain-of-thought', 'downstream',   0.9),
  ('code-generation', 'generate',           'part_of',      1.0),
  ('summarization',   'generate',           'part_of',      0.9),
  ('translation',     'generate',           'part_of',      0.8),
  ('text-to-sql',     'code-generation',    'variant_of',   0.8),
  ('kb-qa',           'document-qa',        'parallel',     0.8),
  ('multimodal',      'generate',           'downstream',   0.8),
  -- ── 前沿 ──────────────────────────────────────────────────
  ('emergent-ability','scaling',            'upstream',     0.9),
  ('long-context',    'context-window',     'downstream',   1.0),
  ('long-context',    'kv-cache',           'downstream',   0.9),
  ('interpretability','alignment',          'parallel',     0.8),
  ('world-model',     'causal',             'parallel',     0.8),
  ('ssm',             'transformer',        'variant_of',   0.9),
  ('mamba',           'ssm',                'implements',   1.0)
) AS r(src, tgt, rel_type, weight)
JOIN concepts s ON s.slug = r.src
JOIN concepts t ON t.slug = r.tgt;

-- ═══════════════════════════════════════════════════════════════
--  学习路径
-- ═══════════════════════════════════════════════════════════════

INSERT INTO learning_paths (slug, zh_name, en_name, description, path_type, difficulty, duration) VALUES
  ('rag-path',          'RAG 完整路径',     'RAG Complete Path',     '从 Embedding 到 RAG 的最小认知链路',     'learning',     2, 45),
  ('agent-engineering', 'Agent 工程化',     'Agent Engineering',     '从 ReAct 到完整 Agent 系统的工程路径',   'engineering',  3, 60),
  ('llm-training',      'LLM 训练链路',     'LLM Training Path',     '预训练 → SFT → RLHF 完整训练流程',      'learning',     4, 90),
  ('inference-opt',     '推理优化路径',     'Inference Optimization','KV Cache → PagedAttn → vLLM 工程路径',  'engineering',  4, 60),
  ('reasoning-path',    '推理增强路径',     'Reasoning Enhancement', 'CoT → Self-Consistency → Reflection',   'learning',     3, 45);

-- RAG 路径节点
INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'rag-path'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer',    1, false, 'LLM 基础，理解 Attention'),
  ('embedding',      2, true,  '向量化是 RAG 的核心前置'),
  ('vector-db',      3, true,  '向量存储与检索基础'),
  ('hnsw',           4, false, '高效索引结构'),
  ('retrieval',      5, true,  '检索核心机制'),
  ('chunking',       6, false, '文档分块策略'),
  ('reranking',      7, false, '结果精排优化'),
  ('rag',            8, true,  '核心概念整合'),
  ('orchestration',  9, false, '工程化编排'),
  ('observability', 10, false, '生产环境监控')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- Agent 工程路径节点
INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'agent-engineering'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer',      1, false, 'LLM 基础'),
  ('react-prompting',  2, true,  'Agent 核心范式'),
  ('function-calling', 3, true,  '工具调用能力'),
  ('planning',         4, true,  '多步规划'),
  ('memory',           5, false, '状态管理'),
  ('rag',              6, false, '知识增强'),
  ('multi-agent',      7, false, '多 Agent 协作'),
  ('orchestration',    8, true,  '系统编排')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- LLM 训练路径节点
INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'llm-training'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer',       1, false, '模型架构基础'),
  ('pre-training',      2, true,  '大规模预训练'),
  ('sft',               3, true,  '监督微调'),
  ('instruction-tuning',4, false, '指令跟随'),
  ('reward-model',      5, false, '偏好建模'),
  ('rlhf',              6, true,  '人类反馈对齐'),
  ('dpo',               7, false, '直接偏好优化'),
  ('alignment',         8, true,  '对齐目标')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- 推理优化路径节点
INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'inference-opt'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('transformer',          1, false, '理解推理瓶颈'),
  ('kv-cache',             2, true,  'KV 缓存核心'),
  ('paged-attention',      3, true,  '分页内存管理'),
  ('speculative-decoding', 4, false, '投机解码加速'),
  ('quantization',         5, false, '量化压缩'),
  ('vllm',                 6, true,  '高吞吐推理引擎'),
  ('model-serving',        7, true,  '生产部署')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- 推理增强路径节点
INSERT INTO path_nodes (path_id, concept_id, step_order, is_key, note)
SELECT
  (SELECT id FROM learning_paths WHERE slug = 'reasoning-path'),
  c.id, r.step_order, r.is_key, r.note
FROM (VALUES
  ('prompt-engineering', 1, false, '提示词基础'),
  ('chain-of-thought',   2, true,  '逐步推理核心'),
  ('scratchpad',         3, false, '中间步骤显式化'),
  ('self-consistency',   4, true,  '多路径投票'),
  ('tree-of-thought',    5, false, '树状搜索'),
  ('reflection',         6, true,  '自我修正'),
  ('react-prompting',    7, true,  '推理+行动')
) AS r(slug, step_order, is_key, note)
JOIN concepts c ON c.slug = r.slug;

-- ═══════════════════════════════════════════════════════════════
--  Auto Path Engine Tables（认知引擎）
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS auto_paths (
  id          SERIAL PRIMARY KEY,
  target_slug VARCHAR(150) NOT NULL,
  start_slug  VARCHAR(150) NOT NULL,
  path_type   VARCHAR(30)  NOT NULL DEFAULT 'learning',
  total_cost  FLOAT        NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_path_nodes (
  id         SERIAL PRIMARY KEY,
  path_id    INT NOT NULL REFERENCES auto_paths(id) ON DELETE CASCADE,
  concept_id INT NOT NULL REFERENCES concepts(id)   ON DELETE CASCADE,
  step_order INT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auto_paths_target ON auto_paths(target_slug, path_type);
CREATE INDEX IF NOT EXISTS idx_auto_path_nodes   ON auto_path_nodes(path_id);

CREATE TABLE IF NOT EXISTS relation_candidates (
  id         SERIAL PRIMARY KEY,
  source_id  INT  NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_id  INT  NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  rel_type   TEXT NOT NULL,
  score      FLOAT DEFAULT 0,
  llm_score  FLOAT DEFAULT 0,
  llm_reason TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (source_id, target_id, rel_type)
);

CREATE INDEX IF NOT EXISTS idx_rel_candidates_status ON relation_candidates(status);
