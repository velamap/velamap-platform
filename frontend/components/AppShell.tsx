'use client'

import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import {
  Telescope, LayoutGrid, Bot, Cpu, Server, LogOut, LogIn, Sun, Moon,
  Monitor, Globe, Languages, SidebarClose, SidebarOpen, Search,
  ChevronRight, Home, Menu, X, BookOpen, Code, Wrench, BarChart,
  History, AlertTriangle, Bookmark, Database
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { useApp } from '@/lib/appContext'
import type { LensId } from '@/lib/appContext'
import RagConceptual from './RagConceptual'

// ------------------------------
// 1 级导航
// ------------------------------
const NAV_ITEMS = [
  { id: 'ai-infra',     zhLabel: 'AI基础设施', enLabel: 'AI Infra',      icon: Server     },
  { id: 'agents',       zhLabel: '智能体',     enLabel: 'Agents',        icon: Bot        },
  { id: 'applications', zhLabel: '应用落地',   enLabel: 'Applications',  icon: LayoutGrid },
  { id: 'execution',    zhLabel: '执行层',     enLabel: 'Execution',     icon: Cpu        },
  { id: 'frontier',     zhLabel: '前沿探索',   enLabel: 'Frontier',      icon: Telescope  },
] as const

type PageId = typeof NAV_ITEMS[number]['id']

// ------------------------------
// 2 级知识点卡片（Azure 风格）
// ------------------------------
const TOPICS = {
  'ai-infra': [
    { id: 'transformer', zh: 'Transformer', en: 'Transformer', icon: Code,     descZh: '神经网络核心架构',   descEn: 'Core neural network architecture' },
    { id: 'moe',         zh: 'MoE 架构',    en: 'MoE Architecture', icon: Bot, descZh: '混合专家稀疏模型',   descEn: 'Mixture of Experts sparse model' },
    { id: 'embedding',   zh: 'Embedding',   en: 'Embedding',   icon: Bookmark, descZh: '文本/图像向量表示',   descEn: 'Text/image vector representation' },
    { id: 'scaling',     zh: 'Scaling Law', en: 'Scaling Law', icon: BarChart, descZh: '模型性能缩放规律',   descEn: 'Model performance scaling rules' },
  ],
  'agents': [
    { id: 'react',    zh: 'ReAct',    en: 'ReAct',    icon: Bot,        descZh: '推理+行动协同架构',   descEn: 'Reasoning + acting architecture' },
    { id: 'planning', zh: '规划系统', en: 'Planning', icon: LayoutGrid, descZh: '多步决策与目标分解',   descEn: 'Multi-step planning & decomposition' },
    { id: 'memory',   zh: '记忆系统', en: 'Memory',   icon: Bookmark,   descZh: '长短时记忆管理',       descEn: 'Long/short-term memory management' },
  ],
  'applications': [
    { id: 'generate', zh: '内容生成', en: 'Generation', icon: BookOpen, descZh: '文本/图像/音频生成', descEn: 'Text/image/audio generation' },
    { id: 'decision', zh: '决策辅助', en: 'Decision',   icon: Bot,      descZh: '分析与判断增强',     descEn: 'Analysis & decision augmentation' },
  ],
  'execution': [
    { id: 'orchestration', zh: '工作流编排', en: 'Orchestration', icon: LayoutGrid, descZh: 'DAG/状态机执行',   descEn: 'DAG / state machine execution' },
    { id: 'observability', zh: '可观测性',   en: 'Observability', icon: BarChart,   descZh: '监控/追踪/日志',   descEn: 'Monitoring / tracing / logging' },
    { id: 'rag',           zh: '检索增强生成', en: 'RAG',         icon: Database,   descZh: '检索外部知识增强生成', descEn: 'Retrieve external knowledge to enhance generation' },
  ],
  'frontier': [
    { id: 'world-model', zh: '世界模型',  en: 'World Model',      icon: Globe, descZh: '物理与时空建模',     descEn: 'Physical & spatiotemporal modeling' },
    { id: 'causal',      zh: '因果推理',  en: 'Causal Reasoning', icon: Bot,   descZh: '反事实与因果推断',   descEn: 'Counterfactual & causal inference' },
  ],
}

// ------------------------------
// 3 级 Lens 内容（文档正文）
// ------------------------------
const TOPIC_CONTENT: Record<string, Record<LensId, { title: string; content: string[] }>> = {
  transformer: {
    conceptual: {
      title: 'Transformer 概念',
      content: ['基于自注意力机制的序列建模架构', '解决RNN长距离依赖问题', '并行编码，训练效率更高'],
    },
    mechanical: {
      title: 'Transformer 内部机制',
      content: ['多头自注意力', '位置编码', '前馈网络', '层归一化与残差连接'],
    },
    practical: {
      title: '工程实践',
      content: ['参数初始化', '学习率调度', '精度混合训练', '显存优化'],
    },
    comparative: {
      title: '对比与选型',
      content: ['Transformer vs RNN', 'Transformer vs CNN', '全局注意力 vs 稀疏注意力'],
    },
    evolutionary: {
      title: '历史与演进',
      content: ['2017 Attention Is All You Need', 'GPT/bert 分支', 'MoE 稀疏化'],
    },
    critical: {
      title: '局限与反模式',
      content: ['长文本复杂度O(n²)', '推理成本高', '静态注意力无法动态适应'],
    },
  },
  moe: {
    conceptual: { title: 'MoE 概念', content: ['稀疏激活专家混合模型', '每个token只激活部分参数'] },
    mechanical: { title: 'MoE 机制', content: ['门控网络路由', '专家并行', '负载均衡'] },
    practical: { title: 'MoE 实践', content: ['专家数量', '负载均衡损失', '显存策略'] },
    comparative: { title: 'MoE 对比', content: ['稠密模型 vs 稀疏模型', '算力换参数'] },
    evolutionary: { title: 'MoE 演进', content: ['稀疏软路由 → 按需激活 → 动态架构'] },
    critical: { title: 'MoE 局限', content: ['通信开销', '推理延迟', '训练不稳定'] },
  },
  embedding: {
    conceptual: {
      title: 'Embedding 概念',
      content: ['将离散符号映射为连续向量', '语义相似性 = 向量距离', '统一多模态表征空间']
    },
    mechanical: {
      title: 'Embedding 机制',
      content: ['词嵌入/句嵌入/图像嵌入', '余弦相似度检索', '对比学习训练目标']
    },
    practical: {
      title: 'Embedding 实践',
      content: ['向量数据库选型', '维度选择', '批量生成与缓存', '检索精度优化']
    },
    comparative: {
      title: 'Embedding 对比',
      content: ['BGE vs text-embedding-ada', '稠密向量 vs 稀疏向量', '小模型 vs 大模型']
    },
    evolutionary: {
      title: 'Embedding 演进',
      content: ['独热编码 → 词向量 → 上下文嵌入', '单模态 → 多模态统一表征']
    },
    critical: {
      title: 'Embedding 局限',
      content: ['静态向量无法表达歧义', '长文本信息衰减', '高维向量检索成本高']
    }
  },
  scaling: {
    conceptual: {
      title: 'Scaling Law 概念',
      content: ['模型性能随参数/数据/算力指数增长', '大模型能力的核心规律', '通用人工智能的基础假设']
    },
    mechanical: {
      title: 'Scaling Law 机制',
      content: ['幂律分布关系', '计算最优边界', '数据质量权重']
    },
    practical: {
      title: 'Scaling Law 实践',
      content: ['算力预算规划', '数据配比策略', '训练步数与收敛', '成本收益评估']
    },
    comparative: {
      title: 'Scaling Law 对比',
      content: ['参数缩放 vs 数据缩放', '稠密模型 vs 稀疏模型', '预训练 vs 微调']
    },
    evolutionary: {
      title: 'Scaling Law 演进',
      content: ['早期经验规律', 'OpenAI 定量验证', '从单一缩放到复合缩放']
    },
    critical: {
      title: 'Scaling Law 局限',
      content: ['边际效益递减', '数据枯竭瓶颈', '对齐与安全问题', '并非唯一路径']
    }
  },
  react: {
    conceptual: {
      title: 'ReAct 概念',
      content: ['推理+行动协同智能', '类人思考与行动模式', '工具使用的基础范式']
    },
    mechanical: {
      title: 'ReAct 机制',
      content: ['思考 → 行动 → 观察 → 迭代', '工具调用格式约束', '多轮闭环控制']
    },
    practical: {
      title: 'ReAct 实践',
      content: ['提示词模板', '工具集设计', '终止条件', '错误恢复']
    },
    comparative: {
      title: 'ReAct 对比',
      content: ['ReAct vs CoT', '单轮 vs 多轮', '自主调用 vs 人工触发']
    },
    evolutionary: {
      title: 'ReAct 演进',
      content: ['CoT → 工具使用 → ReAct → 多智能体协作']
    },
    critical: {
      title: 'ReAct 局限',
      content: ['循环失控', '工具选择错误', '长程规划失效', '推理成本高']
    }
  },
  planning: {
    conceptual: {
      title: '规划系统概念',
      content: ['目标分解与步骤生成', '分层任务结构', '智能体核心决策能力']
    },
    mechanical: {
      title: '规划系统机制',
      content: ['目标解析 → 子任务拆分 → 执行调度 → 复盘修正', '状态跟踪', '依赖管理']
    },
    practical: {
      title: '规划系统实践',
      content: ['规划深度控制', '异常处理', '执行重试', '结果校验']
    },
    comparative: {
      title: '规划系统对比',
      content: ['静态规划 vs 动态规划', '集中式 vs 分布式', '预规划 vs 边做边规划']
    },
    evolutionary: {
      title: '规划系统演进',
      content: ['固定流程 → 大模型规划 → 自我修正规划 → 多智能体协同规划']
    },
    critical: {
      title: '规划系统局限',
      content: ['环境变化失效', '目标歧义崩溃', '复杂度爆炸', '不可解释']
    }
  },
  memory: {
    conceptual: {
      title: '记忆系统概念',
      content: ['智能体信息存储与检索', '长短时记忆区分', '经验学习与迭代']
    },
    mechanical: {
      title: '记忆系统机制',
      content: ['记忆编码 → 存储 → 检索 → 遗忘', '向量检索', '摘要与压缩']
    },
    practical: {
      title: '记忆系统实践',
      content: ['记忆分片', '过期清理', '检索召回率', '存储成本']
    },
    comparative: {
      title: '记忆系统对比',
      content: ['向量记忆 vs 键值记忆', '短期上下文 vs 长期存储', '本地 vs 外部库']
    },
    evolutionary: {
      title: '记忆系统演进',
      content: ['上下文窗口 → 向量库 → 记忆网络 → 自我构建知识图谱']
    },
    critical: {
      title: '记忆系统局限',
      content: ['噪声干扰', '信息过时', '检索错误', '隐私泄露风险']
    }
  },
  generate: {
    conceptual: {
      title: '内容生成概念',
      content: ['AI自主创作内容', '多模态统一生成', '用户意图到内容映射']
    },
    mechanical: {
      title: '内容生成机制',
      content: ['自回归解码', '采样策略', '提示条件控制', '质量约束']
    },
    practical: {
      title: '内容生成实践',
      content: ['风格控制', '长度约束', '事实校验', '输出格式化']
    },
    comparative: {
      title: '内容生成对比',
      content: ['生成式 vs 检索式', '小模型专用 vs 大模型通用', '免费 vs 商用']
    },
    evolutionary: {
      title: '内容生成演进',
      content: ['规则模板 → 统计生成 → 大模型生成 → 多模态统一生成']
    },
    critical: {
      title: '内容生成局限',
      content: ['幻觉事实错误', '版权风险', '风格同质化', '长文本一致性差']
    }
  },
  decision: {
    conceptual: {
      title: '决策辅助概念',
      content: ['基于数据与推理的判断支持', '不确定性评估', '人机协同决策']
    },
    mechanical: {
      title: '决策辅助机制',
      content: ['信息抽取 → 分析 → 对比 → 建议 → 置信度输出']
    },
    practical: {
      title: '决策辅助实践',
      content: ['决策流程', '证据链呈现', '可解释性', '人工复核']
    },
    comparative: {
      title: '决策辅助对比',
      content: ['AI决策 vs 人类决策', '单模型 vs 集成决策', '黑盒 vs 可解释']
    },
    evolutionary: {
      title: '决策辅助演进',
      content: ['规则判断 → 统计分析 → 大模型综合决策 → 自主决策系统']
    },
    critical: {
      title: '决策辅助局限',
      content: ['偏见放大', '数据依赖', '不可解释', '责任界定模糊']
    }
  },
  orchestration: {
    conceptual: {
      title: '工作流编排概念',
      content: ['多步骤任务自动化', '状态与依赖管理', '系统可靠性骨架']
    },
    mechanical: {
      title: '工作流编排机制',
      content: ['DAG 执行', '状态机流转', '事件驱动', '分布式协调']
    },
    practical: {
      title: '工作流编排实践',
      content: ['重试与降级', '超时控制', '异常捕获', '断点恢复']
    },
    comparative: {
      title: '工作流编排对比',
      content: ['静态编排 vs 动态编排', '代码定义 vs 可视化', '同步 vs 异步']
    },
    evolutionary: {
      title: '工作流编排演进',
      content: ['脚本 → 配置 → AI动态编排 → 自我修复流']
    },
    critical: {
      title: '工作流编排局限',
      content: ['复杂度不可控', '调试困难', '依赖链脆弱', '可观测性不足']
    }
  },
  observability: {
    conceptual: {
      title: '可观测性概念',
      content: ['系统内部状态外部可见', '监控+追踪+日志三位一体', '故障定位与优化依据']
    },
    mechanical: {
      title: '可观测性机制',
      content: ['指标采集', '分布式追踪', '日志结构化', '关联分析']
    },
    practical: {
      title: '可观测性实践',
      content: ['告警规则', '性能采样', '成本统计', '用户行为分析']
    },
    comparative: {
      title: '可观测性对比',
      content: ['监控 vs 可观测性', '自研 vs 开源平台', '拉取 vs 推送']
    },
    evolutionary: {
      title: '可观测性演进',
      content: ['日志 → 监控 → APM → E2E可观测 → AI自动诊断']
    },
    critical: {
      title: '可观测性局限',
      content: ['数据爆炸', '性能损耗', '排查成本高', '隐私合规风险']
    }
  },
  rag: {
    conceptual: {
      title: 'RAG 概念',
      content: []
    },
    mechanical: { title: 'RAG 机制', content: ['内容正在建设中'] },
    practical: { title: 'RAG 实践', content: ['内容正在建设中'] },
    comparative: { title: 'RAG 对比', content: ['内容正在建设中'] },
    evolutionary: { title: 'RAG 演进', content: ['内容正在建设中'] },
    critical: { title: 'RAG 局限', content: ['内容正在建设中'] }
  },
  'world-model': {
    conceptual: {
      title: '世界模型概念',
      content: ['模型对物理世界的建模能力', '时空与物理规则理解', '预测与反事实推演']
    },
    mechanical: {
      title: '世界模型机制',
      content: ['环境状态表示', '动作-结果预测', '时序建模', '内在奖励']
    },
    practical: {
      title: '世界模型实践',
      content: ['环境交互', '试错学习', '长程规划', '泛化适应']
    },
    comparative: {
      title: '世界模型对比',
      content: ['LLM vs 世界模型', '预测模型 vs 因果模型', '虚拟环境 vs 现实世界']
    },
    evolutionary: {
      title: '世界模型演进',
      content: ['文本预测 → 图像预测 → 物理引擎 → 自我构建世界模型']
    },
    critical: {
      title: '世界模型局限',
      content: ['真实世界复杂度太高', '数据分布偏差', '训练不稳定', '评估困难']
    }
  },
  causal: {
    conceptual: {
      title: '因果推理概念',
      content: ['从关联到因果的推断', '干预与反事实能力', '强人工智能的核心']
    },
    mechanical: {
      title: '因果推理机制',
      content: ['因果图', '干预计算', '反事实模拟', '因果发现']
    },
    practical: {
      title: '因果推理实践',
      content: ['特征因果筛选', '去偏数据', '决策归因', '鲁棒性提升']
    },
    comparative: {
      title: '因果推理对比',
      content: ['因果 vs 相关', '符号因果 vs 神经网络因果', '大模型微调 vs 专用模型']
    },
    evolutionary: {
      title: '因果推理演进',
      content: ['统计相关 → 大模型隐式因果 → 显式因果结构 → 自主因果发现']
    },
    critical: {
      title: '因果推理局限',
      content: ['因果不可观测', '数据难以验证', '计算复杂', '大模型仍以关联为主']
    }
  }
}

const LENS_ICONS = {
  conceptual: BookOpen,
  mechanical: Code,
  practical: Wrench,
  comparative: BarChart,
  evolutionary: History,
  critical: AlertTriangle,
}

const LENS_ZH: Record<LensId, string> = {
  conceptual: '概念',
  mechanical: '机制',
  practical: '实践',
  comparative: '对比',
  evolutionary: '演进',
  critical: '批判',
}

// ------------------------------
// 主组件
// ------------------------------
export default function AppShell({ user }: { user: User | null }) {
  const { theme, setTheme, lang, setLang, setMode, activeLens, setActiveLens } = useApp()
  const [activePage, setActivePage] = useState<PageId>('ai-infra')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [search, setSearch] = useState('')
  const userRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const avatarUrl = user?.user_metadata?.avatar_url
  const name = user?.user_metadata.name || user?.email || 'User'

  // 点击外部关闭菜单
  useEffect(() => {
    const cb = (e: MouseEvent) => { if (userRef.current && !userRef.current.contains(e.target as any)) setShowUserMenu(false) }
    document.addEventListener('mousedown', cb)
    return () => document.removeEventListener('mousedown', cb)
  }, [])

  const currentTopics = TOPICS[activePage] || []
  const showDetail = !!selectedTopic

  return (
    <div className="app-container">
      {/* 移动端顶部栏 */}
      <div className="mobile-header">
        <button onClick={() => setMobileSidebarOpen(true)}><Menu size={20} /></button>
        <div className="logo">Vela AI</div>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* 侧边栏 */}
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
        <div className="sidebar-inner">
          <div className="sidebar-header">
            {!collapsed && <div className="logo-text">{lang === 'zh' ? '帆布AI' : 'Vela AI'}</div>}
            <button className="close-mobile" onClick={() => setMobileSidebarOpen(false)}><X size={18} /></button>
            <button className="toggle-desktop" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <SidebarOpen size={18} /> : <SidebarClose size={18} />}
            </button>
          </div>

          <div className="search-box">
            <Search size={14} />
            <input placeholder={lang === 'zh' ? '搜索' : 'Search'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="nav-section">{!collapsed && (lang === 'zh' ? '知识体系' : 'Knowledge')}</div>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => { setActivePage(item.id); setSelectedTopic(null); setMobileSidebarOpen(false) }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{lang === 'zh' ? item.zhLabel : item.enLabel}</span>}
              </button>
            )
          })}

          <div className="sidebar-footer" ref={userRef}>
            {user ? (
              <div className="user-row" onClick={() => setShowUserMenu(!showUserMenu)}>
                {avatarUrl ? <Image src={avatarUrl} width={28} height={28} className="avatar" alt="" /> : <div className="avatar">{name[0]}</div>}
                {!collapsed && <span className="name">{name}</span>}
              </div>
            ) : (
              <button className="signin" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
                <LogIn size={14} />{!collapsed && (lang === 'zh' ? '登录' : 'Sign in')}
              </button>
            )}
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-label">{lang === 'zh' ? '视图模式' : 'View Mode'}</div>
                <div className="user-menu-modes">
                  <button className="user-menu-mode-btn" onClick={() => setMode('os')}><Monitor size={13} /> OS</button>
                  <button className="user-menu-mode-btn active"><Globe size={13} /> Web</button>
                </div>
                <button onClick={() => supabase.auth.signOut()}><LogOut size={14} />{lang === 'zh' ? '退出登录' : 'Sign out'}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="main-content">
        {/* 顶部控制栏 */}
        <div className="top-bar">
          {/* 主题切换 */}
          <button className="nav-icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title={lang === 'zh' ? '切换主题' : 'Toggle theme'}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          {/* 语言切换 */}
          <button className="nav-icon-btn lang-btn" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} title="Language">
            <Languages size={15} />
            <span style={{ fontSize: 14, lineHeight: 1 }}>{lang === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
          </button>
        </div>

        <div className="page-body">
        <div className="breadcrumbs">
          <Home size={14} />
          <ChevronRight size={12} />
          <span>{NAV_ITEMS.find(i => i.id === activePage)?.[lang === 'zh' ? 'zhLabel' : 'enLabel']}</span>
          {selectedTopic && (
            <>
              <ChevronRight size={12} />
              <span>{TOPICS[activePage]?.find(t => t.id === selectedTopic)?.[lang === 'zh' ? 'zh' : 'en']}</span>
              <ChevronRight size={12} />
              <span className="active">{lang === 'zh' ? LENS_ZH[activeLens] : activeLens}</span>
            </>
          )}
        </div>

        {!showDetail ? (
          // 2级：Azure 风格卡片页
          <div className="card-grid-page">
            <h1>{NAV_ITEMS.find(i => i.id === activePage)?.[lang === 'zh' ? 'zhLabel' : 'enLabel']}</h1>
            <div className="card-grid">
              {currentTopics.map(t => {
                const Icon = t.icon
                return (
                  <div key={t.id} className="topic-card" onClick={() => setSelectedTopic(t.id)}>
                    <div className="card-icon"><Icon size={20} /></div>
                    <div className="card-text">
                      <h3>{lang === 'zh' ? t.zh : t.en}</h3>
                      <p>{lang === 'zh' ? t.descZh : t.descEn}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // 3级：Microsoft Learn 三栏文档
          <div className="doc-layout">
            {/* 左侧 Lens 导航 */}
            <div className="doc-left">
              {(Object.keys(LENS_ICONS) as LensId[]).map(l => {
                const Icon = LENS_ICONS[l]
                return (
                  <button key={l} className={`lens-nav-item ${activeLens === l ? 'active' : ''}`} onClick={() => setActiveLens(l)}>
                    <Icon size={16} />
                    {lang === 'zh' ? LENS_ZH[l] : l}
                  </button>
                )
              })}
            </div>

            {/* 中间正文 */}
            <div className="doc-main">
              {selectedTopic === 'rag' && activeLens === 'conceptual' ? (
                <RagConceptual />
              ) : TOPIC_CONTENT[selectedTopic!]?.[activeLens] ? (
                <>
                  <h1>{TOPIC_CONTENT[selectedTopic!][activeLens].title}</h1>
                  {TOPIC_CONTENT[selectedTopic!][activeLens].content.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </>
              ) : (
                <p className="empty">{lang === 'zh' ? '内容正在建设中' : 'Coming soon'}</p>
              )}
            </div>

            {/* 右侧目录 */}
            <div className="doc-right">
              <div className="toc-title">{lang === 'zh' ? '目录' : 'Contents'}</div>
              {TOPIC_CONTENT[selectedTopic!]?.[activeLens]?.content?.map((line, i) => (
                <div key={i} className="toc-item">{line}</div>
              ))}
            </div>
          </div>
        )}
        </div>{/* page-body */}
      </div>

      {/* 全局样式 */}
      <style jsx global>{`
        * { box-sizing: border-box; margin:0; padding:0; font-family: 'DM Sans', system-ui, sans-serif; }
        .app-container { display: flex; height: 100vh; background: var(--surface); color: var(--ink); }
        .mobile-header { display: none; align-items: center; justify-content: space-between; padding:12px 16px; background: var(--card); border-bottom:1px solid var(--border); }
        .sidebar { position: relative; width:240px; background: var(--card); border-right:1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; transition: width 0.2s; }
        .sidebar.collapsed { width:60px; }
        .sidebar-overlay { display: none; position: fixed; inset:0; background: rgba(0,0,0,0.4); z-index:9; }
        .sidebar-inner { position: relative; z-index:10; height: 100%; display: flex; flex-direction: column; }
        .sidebar-header { height:48px; padding:0 16px; display: flex; align-items: center; justify-content: space-between; border-bottom:1px solid var(--border); }
        .logo-text { font-family: 'Noto Serif SC', serif; font-weight:700; font-size:16px; color: var(--ink); }
        .close-mobile { display: none; }
        .search-box { display: flex; align-items: center; gap:8px; padding:8px 12px; margin:8px; background: var(--surface); border-radius:8px; }
        .search-box input { border:none; background:none; outline:none; color: var(--ink); font-size:14px; width:100%; }
        .nav-section { padding:8px 16px; font-size:11px; color: var(--muted); text-transform: uppercase; letter-spacing:0.5px; }
        .nav-item { display: flex; align-items: center; gap:10px; height:40px; padding:0 16px; border-radius:8px; cursor:pointer; background:none; border:none; color: var(--muted); font-size:14px; line-height:1; text-align:left; margin:2px 8px; width: calc(100% - 16px); white-space: nowrap; overflow: hidden; }
        .nav-item:hover { background: var(--surface); color: var(--ink); }
        .nav-item.active { background: var(--teal-light); color: var(--teal); font-weight:600; }
        .sidebar-footer { margin-top: auto; padding:12px; border-top:1px solid var(--border); position: relative; }
        .user-row { display: flex; align-items: center; gap:10px; cursor:pointer; padding: 4px; border-radius: 8px; }
        .user-row:hover { background: var(--surface); }
        .avatar { width:28px; height:28px; border-radius:8px; background: var(--surface); display: grid; place-items: center; font-weight:600; color: var(--ink); }
        .user-menu { position: absolute; bottom:60px; left:8px; width:168px; background: var(--card); border:1px solid var(--border2); border-radius:10px; padding:6px 0; box-shadow:0 4px 20px rgba(0,0,0,0.12); z-index: 99; }
        .user-menu-label { padding:6px 14px 2px; font-size:11px; color: var(--muted); text-transform: uppercase; letter-spacing:0.08em; }
        .user-menu-modes { display: flex; gap:6px; padding:4px 14px 8px; border-bottom:1px solid var(--border); }
        .user-menu-mode-btn { flex:1; display:flex; align-items:center; justify-content:center; gap:5px; padding:6px 0; border-radius:6px; border:1px solid var(--border2); background:none; cursor:pointer; font-size:12px; font-weight:600; color: var(--muted); font-family:inherit; }
        .user-menu-mode-btn.active { border-color: var(--teal); background: var(--teal-light); color: var(--teal); cursor:default; }
        .user-menu button { display: flex; align-items: center; gap:8px; width:100%; padding:8px 14px; background:none; border:none; color: var(--ink); cursor:pointer; font-size:13px; font-family:inherit; }
        .user-menu button:hover { background: var(--surface); }
        .signin { display: flex; align-items: center; gap:8px; width:100%; padding:8px; background:none; border:none; color: var(--muted); cursor:pointer; font-size:14px; font-family:inherit; }
        .main-content { flex:1; overflow-y: auto; padding:0; display: flex; flex-direction: column; }
        .top-bar { display: flex; align-items: center; justify-content: flex-end; gap:8px; padding:0 24px; height:48px; background: var(--card); border-bottom:1px solid var(--border); flex-shrink:0; }
        .nav-icon-btn { width:32px; height:32px; border-radius:8px; border:none; background:transparent; color: var(--muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition: all .15s; }
        .nav-icon-btn:hover { background: var(--surface); color: var(--ink); }
        .lang-btn { width:44px; gap:3px; }
        .page-body { flex:1; overflow-y: auto; padding:24px 32px; }
        .breadcrumbs { display: flex; align-items: center; gap:6px; font-size:13px; color: var(--muted); margin-bottom:20px; }
        .breadcrumbs .active { color: var(--teal); font-weight:600; }
        .card-grid-page h1 { font-size:24px; font-weight:700; margin-bottom:24px; color: var(--ink); }
        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px; }
        .topic-card { display: flex; align-items: center; gap:12px; padding:16px 20px; height:88px; background: var(--card); border:1px solid var(--border); border-radius:12px; cursor:pointer; transition:0.15s; overflow:hidden; }
        .topic-card:hover { border-color: var(--teal); box-shadow: 0 2px 12px rgba(4,138,129,0.1); }
        .card-icon { width:36px; height:36px; display:grid; place-items:center; background: var(--teal-light); border-radius:10px; color: var(--teal); flex-shrink:0; }
        .card-text h3 { font-size:15px; font-weight:600; margin-bottom:4px; color: var(--ink); }
        .card-text p { font-size:13px; color: var(--muted); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        .doc-layout { display: flex; gap:0; height:100%; }
        .doc-left { width:180px; flex-shrink:0; padding:16px 8px; border-right:1px solid var(--border); }
        .lens-nav-item { display:flex; align-items:center; gap:8px; width:100%; padding:9px 12px; border-radius:8px; border:none; background:none; color: var(--muted); font-size:13px; cursor:pointer; font-family:inherit; margin-bottom:2px; }
        .lens-nav-item:hover { background: var(--surface); color: var(--ink); }
        .lens-nav-item.active { background: var(--teal-light); color: var(--teal); font-weight:600; }
        .doc-main { flex:1; padding:24px 32px; overflow-y:auto; }
        .doc-main h1 { font-size:22px; font-weight:700; margin-bottom:16px; color: var(--ink); }
        .doc-main p { font-size:14px; line-height:1.7; color: var(--ink2); margin-bottom:10px; }
        .doc-right { width:200px; flex-shrink:0; padding:16px; border-left:1px solid var(--border); }
        .toc-title { font-size:11px; font-weight:600; color: var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-bottom:10px; }
        .toc-item { font-size:12px; color: var(--muted); padding:4px 0; border-bottom:1px solid var(--border); }
        .empty { color: var(--muted); font-style:italic; }
        @media (max-width: 768px) {
          .mobile-header { display: flex; }
          .sidebar { position: fixed; left:0; top:0; bottom:0; transform: translateX(-100%); transition: transform 0.2s; z-index:99; }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .close-mobile { display: flex; }
          .toggle-desktop { display: none; }
          .doc-right { display: none; }
        }
        [data-theme="dark"] .app-container { background: var(--surface); color: var(--ink); }
        [data-theme="dark"] .sidebar { background: var(--card); border-right-color: var(--border); }
        [data-theme="dark"] .sidebar-header { border-bottom-color: var(--border); }
        [data-theme="dark"] .top-bar { background: var(--card); border-bottom-color: var(--border); }
        [data-theme="dark"] .topic-card { background: var(--card); border-color: var(--border); }
        [data-theme="dark"] .user-menu { background: var(--card); border-color: var(--border2); }
        [data-theme="dark"] .nav-item.active { background: rgba(4,138,129,0.2); }
      `}</style>
    </div>
  )
}