import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  User,
  Users,
  FileText,
  Settings,
  Flame,
  CheckCircle2,
  LogIn,
  LogOut,
} from 'lucide-react';
import { supabase, signInWithGoogle, signOut } from './lib/supabase.js';

const API_BASE = '/api'; // Will be proxied in development

function App() {
  const [activePage, setActivePage] = useState('today');
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [group, setGroup] = useState([]);
  const [stats, setStats] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, tRes, gRes, sRes] = await Promise.all([
        axios.get(`${API_BASE}/profile`),
        axios.get(`${API_BASE}/tasks`),
        axios.get(`${API_BASE}/group`),
        axios.get(`${API_BASE}/stats`)
      ]);
      setProfile(pRes.data);
      setTasks(tRes.data);
      setGroup(gRes.data);
      setStats(sRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const completeTask = async (taskId) => {
    try {
      const res = await axios.post(`${API_BASE}/tasks/${taskId}/complete`);
      if (res.data.status === 'success') {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
        setTasks(updatedTasks);
        setProfile(prev => ({
          ...prev,
          streak: prev.streak + 1,
          tasks_completed: prev.tasks_completed + 1
        }));
      }
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  if (authLoading) return <div className="loading">Loading...</div>;

  // Show login screen if not authenticated
  if (!authUser) return <LoginPage />;

  if (!profile || !stats) return <div className="loading">Loading...</div>;

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">帆布AI</div>
          <div className="logo-sub">AI Transformation OS</div>
        </div>
        <div className="nav">
          <div className="nav-section">主要功能</div>
          <NavItem
            id="today"
            active={activePage === 'today'}
            onClick={() => setActivePage('today')}
            icon={<Calendar className="nav-icon" />}
            label="今日任务"
          />
          <NavItem
            id="profile"
            active={activePage === 'profile'}
            onClick={() => setActivePage('profile')}
            icon={<User className="nav-icon" />}
            label="成长档案"
          />
          <NavItem
            id="group"
            active={activePage === 'group'}
            onClick={() => setActivePage('group')}
            icon={<Users className="nav-icon" />}
            label="我的小组"
          />
          <NavItem
            id="report"
            active={activePage === 'report'}
            onClick={() => setActivePage('report')}
            icon={<FileText className="nav-icon" />}
            label="季度报告"
          />
          <div className="nav-section">设置</div>
          <NavItem
            id="onboard"
            active={activePage === 'onboard'}
            onClick={() => setActivePage('onboard')}
            icon={<Settings className="nav-icon" />}
            label="重新测评"
          />
        </div>
        <div className="sidebar-user">
          {authUser?.user_metadata?.avatar_url ? (
            <img
              src={authUser.user_metadata.avatar_url}
              alt="avatar"
              className="avatar"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="avatar">{(authUser?.user_metadata?.name || authUser?.email || '?')[0].toUpperCase()}</div>
          )}
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authUser?.user_metadata?.name || authUser?.email}
            </div>
            <div className="role">{profile.role}</div>
          </div>
          <button
            onClick={signOut}
            title="退出登录"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '4px', flexShrink: 0 }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main">
        {activePage === 'today' && (
          <div className="page" id="page-today">
            <div className="topbar">
              <div>
                <div className="page-title">今日任务</div>
                <div className="page-sub">{stats.today} · {stats.weekday} · 第{stats.day_num}天</div>
              </div>
              <div className="topbar-right">
                <div className="streak-pill">
                  <Flame size={12} fill="currentColor" />
                  连续 {profile.streak} 天
                </div>
                <button className="btn btn-ghost btn-sm">跳过今天</button>
              </div>
            </div>

            <div className="grid4">
              <StatCard label="累计完成任务" value={profile.tasks_completed} unit="个" note="↑ 本周完成 6 个" />
              <StatCard label="当前连续打卡" value={profile.streak} streak note={`历史最长 ${profile.max_streak} 天`} />
              <StatCard label="AI就绪度评分" value={profile.score} unit="分" note={`较入测时 +${profile.score - profile.initial_score} 分`} color="var(--teal)" />
              <StatCard label="小组本周排名" value={profile.rank} unit={` / ${profile.total_members}`} note="超越 1 位成员" />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>今天的任务</h3>
                <span className="badge badge-teal">产品经理 · AI辅助</span>
              </div>
              {tasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={() => completeTask(task.id)} />
              ))}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>本月打卡记录</h3>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>3月</span>
              </div>
              <div className="streak-bar">
                {Array.from({ length: 31 }).map((_, i) => (
                  <div key={i} className={`streak-dot ${i < 16 ? 'done' : i === 16 ? 'today' : 'future'}`}></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                <LegendItem color="var(--teal)" label="已完成" />
                <LegendItem color="var(--streak)" label="今天" />
                <LegendItem color="var(--border2)" label="未完成" />
              </div>
            </div>
          </div>
        )}

        {activePage === 'profile' && <ProfilePage profile={profile} />}
        {activePage === 'group' && <GroupPage group={group} />}
        {activePage === 'report' && <ReportPage profile={profile} />}
        {activePage === 'onboard' && <Onboarding onComplete={() => setActivePage('today')} />}
      </div>
    </div>
  );
}

function NavItem({ id, active, onClick, icon, label }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, unit, note, streak, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={streak ? "stat-streak" : "stat-val"} style={{ color }}>
        {value}{unit && <span className="unit">{unit}</span>}
      </div>
      <div className="stat-note" style={streak ? { color: 'var(--streak)' } : {}}>
        {note}
      </div>
    </div>
  );
}

function TaskCard({ task, onComplete }) {
  return (
    <div className="task-card">
      <div className="task-header">
        <div className="task-tag">📋 {task.tag} · {task.duration}</div>
        <div className="task-title">{task.title}</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {task.badges.map(b => <span key={b} className="badge badge-ink">{b}</span>)}
        </div>
      </div>
      <div className="task-steps">
        {task.steps.map((step, i) => (
          <div className="step" key={i}>
            <div className="step-num">{i + 1}</div>
            <div className="step-text">{step}</div>
          </div>
        ))}
      </div>
      <div className="task-footer">
        <div className="task-meta">🎯 完成后请自评 1-5 分 · 本任务匹配你的第 2 阶段进度</div>
        <button
          className={`complete-btn ${task.completed ? 'done' : ''}`}
          onClick={onComplete}
          disabled={task.completed}
        >
          {task.completed ? <CheckCircle2 size={12} /> : <div style={{ width: 12 }} />}
          {task.completed ? '已完成！' : '标记完成'}
        </button>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: color }}></div>
      {label}
    </div>
  );
}

function ProfilePage({ profile }) {
  return (
    <div className="page">
      <div className="page-title">成长档案</div>
      <div className="page-sub">你的 AI 转型记录 · 加入 {profile.joined_days} 天</div>

      <div className="grid2" style={{ marginBottom: '12px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="score-ring-wrap">
              <svg className="ring-svg" width="80" height="80" viewBox="0 0 80 80">
                <circle className="ring-track" cx="40" cy="40" r="32" />
                <circle className="ring-fill" cx="40" cy="40" r="32" strokeDasharray="201" strokeDashoffset={201 * (1 - profile.score / 100)} />
                <text className="ring-text" x="40" y="44" textAnchor="middle">{profile.score}</text>
                <text className="ring-sub" x="40" y="56" textAnchor="middle">AI就绪度</text>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '6px' }}>入测评分 → 当前</div>
              <div style={{ fontSize: '22px', fontWeight: 300, color: 'var(--ink)' }}>
                {profile.initial_score} → <span style={{ color: 'var(--teal)', fontWeight: 500 }}>{profile.score}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--teal)', marginTop: '4px' }}>↑ 提升 {profile.score - profile.initial_score} 分 · 超越同行业 68% 用户</div>
              <div className="prog-bar" style={{ marginTop: '10px' }}>
                <div className="prog-fill" style={{ width: `${profile.score}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>转型阶段</h3>
          <TimelineItem done title="AI观望者" meta="了解AI工具 · Day 1-14" />
          <TimelineItem done title="日常使用者" meta="每日使用AI · Day 14-60" tag="已达成" tagType="teal" />
          <TimelineItem active title="AI协作者" meta="工作流整合 · Day 60-180" tag="进行中" tagType="amber" />
          <TimelineItem future title="AI增强专家" meta="领域深度整合 · Day 180+" />
        </div>
      </div>

      <div className="card" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0 }}>已解锁技能标签</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>共 14 个</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {["文档写作", "会议纪要", "数据分析辅助", "Prompt设计", "产品需求描述", "竞品研究", "用户调研设计", "代码审阅辅助"].map(s => (
            <span key={s} className="badge badge-teal" style={{ fontSize: '12px', padding: '4px 12px' }}>{s}</span>
          ))}
          <span style={{ background: 'var(--border)', color: 'var(--muted)', fontSize: '12px', padding: '4px 12px', borderRadius: '20px' }}>+4 个待解锁</span>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ done, active, future, title, meta, tag, tagType }) {
  return (
    <div className="timeline-item">
      <div className={`tl-dot ${done ? 'done' : active ? 'active' : 'future'}`}>
        {done ? '✓' : active ? '→' : '4'}
      </div>
      <div className="tl-content">
        <div className="tl-title">
          {title}
          {tag && <span className={`badge badge-${tagType} tl-badge`}>{tag}</span>}
        </div>
        <div className="tl-meta">{meta}</div>
      </div>
    </div>
  );
}

function GroupPage({ group }) {
  return (
    <div className="page">
      <div className="page-title">我的小组</div>
      <div className="page-sub">互联网产品组 · 5 人 · 本周第 2 名</div>
      <div className="grid2">
        <div className="card">
          <h3>本周小组排行</h3>
          {group.map(m => (
            <div key={m.name} className="group-member">
              <div className="member-left">
                <div style={{ width: 16, textAlign: 'right', fontSize: 13, color: 'var(--muted)' }}>{m.rank}</div>
                <div className="member-avatar" style={{ background: m.color }}>{m.name[0]}</div>
                <div>
                  <div className="member-name">{m.name} {m.name === '你' && <span style={{ color: 'var(--teal)', fontSize: 10 }}>(我)</span>}</div>
                  <div className="member-streak">连续 {m.streak} 天</div>
                </div>
              </div>
              <div className="member-dots">
                {m.week.slice(0, 5).map((d, i) => <div key={i} className="mdot" style={{ background: d ? 'var(--teal)' : 'var(--border2)' }}></div>)}
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3>小组动态</h3>
          <ActivityItem icon="🎉" title="成员 2 达成「连续30天」成就" time="30分钟前" type="teal" />
          <ActivityItem icon="⚡" title="成员 4 今日完成任务" time="1小时前" />
          <ActivityItem icon="⚠️" title="成员 3 已 3 天未打卡" time="系统提醒" type="amber" />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, type }) {
  const bg = type === 'teal' ? 'var(--teal-light)' : type === 'amber' ? 'var(--amber-light)' : 'var(--surface)';
  const color = type === 'teal' ? 'var(--teal)' : type === 'amber' ? 'var(--amber)' : 'inherit';
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '10px', background: bg, borderRadius: '8px', marginBottom: '8px' }}>
      <div style={{ fontSize: '18px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 500, color }}>{title}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{time}</div>
      </div>
    </div>
  );
}

function ReportPage({ profile }) {
  return (
    <div className="page">
      <div className="page-title">季度报告</div>
      <div className="report-highlight">
        <div className="report-title">2026 Q1 · AI 转型成长报告</div>
        <div className="report-period">2026年1月 — 3月 · {profile.name} · 产品经理</div>
        <div className="report-stats">
          <div className="rs"><div className="rs-val">{profile.tasks_completed}</div><div className="rs-label">完成任务数</div></div>
          <div className="rs"><div className="rs-val">+{profile.score - profile.initial_score}</div><div className="rs-label">评分提升</div></div>
          <div className="rs"><div className="rs-val">68%</div><div className="rs-label">超越同行比例</div></div>
        </div>
      </div>
    </div>
  );
}

function Onboarding({ onComplete }) {
  return (
    <div className="page">
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div className="page-title">职业 AI 测评</div>
        <div className="question">你目前的工作领域是？</div>
        <div className="option-grid">
          {["互联网 / 科技", "金融 / 咨询", "教育 / 培训", "医疗 / 健康"].map(o => (
            <div key={o} className="option" onClick={onComplete}>{o}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signInWithGoogle();
    // Page will redirect to Google — no need to reset loading
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark" style={{ fontSize: '22px', marginBottom: '4px' }}>帆布AI</div>
          <div className="logo-sub" style={{ color: 'var(--muted)', letterSpacing: '.1em' }}>AI TRANSFORMATION OS</div>
        </div>
        <h2 className="login-title">欢迎回来</h2>
        <p className="login-sub">登录后开始你的 AI 转型之旅</p>
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" />
          ) : (
            <GoogleIcon />
          )}
          {loading ? '跳转中...' : '使用 Google 账号登录'}
        </button>
        <p className="login-hint">登录即代表你同意我们的服务条款与隐私政策</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default App;
