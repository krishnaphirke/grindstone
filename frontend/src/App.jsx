import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

const API_BASE = 'http://localhost:8080'

const TOPICS = [
  'Arrays',
  'Strings',
  'Linked List',
  'Trees',
  'Graphs',
  'Math',
  'Matrix',
  'Heap',
  'Stack',
  'Queue',
  'Trie',
  'Bit Manipulation',
  'Other',
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const APPROACHES = [
  'Sliding Window',
  'Two Pointer',
  'Binary Search',
  'BFS/DFS',
  'Recursion/Backtracking',
  'Greedy',
  'Divide and Conquer',
  'Memoization/DP',
  'Hashing',
  'Sorting',
  'Prefix Sum',
  'Union Find',
  'Other',
]
const STATUSES = ['Solved', 'To Revisit']

const DIFFICULTY_COLORS = {
  Easy: '#16a34a',
  Medium: '#eab308',
  Hard: '#dc2626',
}

const CONTEST_PLATFORMS = ['Codeforces', 'LeetCode', 'CodeChef', 'AtCoder', 'Other']

const PLATFORM_COLORS = {
  Codeforces: '#1890ff',
  LeetCode: '#f5a623',
  CodeChef: '#5b4638',
  AtCoder: '#22c55e',
  Other: '#6b7280',
}

const HEAT_COLORS = [
  { threshold: 0, color: '#1e1e2e' }, // empty
  { threshold: 1, color: '#9be9a8' }, // 1
  { threshold: 3, color: '#40c463' }, // 2-3
  { threshold: 4, color: '#216e39' }, // 4+
]

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDateFull(date) {
  const month = MONTH_LABELS[date.getMonth()]
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

function CustomDarkTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  const name = item?.name ?? label
  const value = item?.value ?? item?.payload?.value ?? item?.payload?.count
  return (
    <div
      style={{
        background: '#1e1e2e',
        color: '#ffffff',
        padding: '8px 10px',
        borderRadius: 10,
        fontSize: 12,
        boxShadow: '0 10px 26px rgba(0,0,0,0.55)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{String(name)}</div>
      <div style={{ opacity: 0.9 }}>{String(value)}</div>
    </div>
  )
}

function getSixMonthRange() {
  const today = new Date()
  const start = new Date(today)
  start.setMonth(start.getMonth() - 6)
  start.setHours(0, 0, 0, 0)

  // Align to Monday
  const day = start.getDay() // 0 (Sun) - 6 (Sat)
  const offsetToMonday = (day + 6) % 7
  start.setDate(start.getDate() - offsetToMonday)

  const days = []
  const cursor = new Date(start)
  while (cursor <= today) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return { days, start, end: today }
}

function buildHeatmapGrid(countsByDate) {
  const { days } = getSixMonthRange()
  const weeks = []
  let currentWeek = []

  days.forEach((date, index) => {
    const key = formatDateKey(date)
    const count = countsByDate[key] || 0
    currentWeek.push({ date, key, count })
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  return weeks
}

function getHeatColor(count) {
  if (count <= 0) return HEAT_COLORS[0].color
  if (count === 1) return HEAT_COLORS[1].color
  if (count <= 3) return HEAT_COLORS[2].color
  return HEAT_COLORS[3].color
}

function computeStreak(countsByDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  const cursor = new Date(today)

  while (true) {
    const key = formatDateKey(cursor)
    const count = countsByDate[key] || 0
    if (count <= 0) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false,
  )
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [heatmapAnimKey, setHeatmapAnimKey] = useState(0)

  const [problems, setProblems] = useState([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  const [problemsError, setProblemsError] = useState('')

  const [dashboardCharts, setDashboardCharts] = useState({
    topicData: [],
    difficultyData: [],
  })
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  const [heatmapCounts, setHeatmapCounts] = useState({})
  const [heatmapLoading, setHeatmapLoading] = useState(false)
  const [heatmapError, setHeatmapError] = useState('')

  const [revisionProblems, setRevisionProblems] = useState([])
  const [revisionLoading, setRevisionLoading] = useState(false)
  const [revisionError, setRevisionError] = useState('')
  const [revisionRemovingIds, setRevisionRemovingIds] = useState(new Set())
  const [dueForReviewCount, setDueForReviewCount] = useState(0)

  const [contests, setContests] = useState([])
  const [contestsLoading, setContestsLoading] = useState(false)
  const [contestsError, setContestsError] = useState('')
  const [contestFormOpen, setContestFormOpen] = useState(false)
  const [contestForm, setContestForm] = useState({
    platform: 'Codeforces',
    date: new Date().toISOString().slice(0, 10),
    rank: '',
    problemsSolved: '',
    ratingChange: '',
    notes: '',
  })
  const [contestFormSubmitting, setContestFormSubmitting] = useState(false)
  const [contestFormError, setContestFormError] = useState('')
  const [contestFormSuccess, setContestFormSuccess] = useState('')

  const [form, setForm] = useState({
    title: '',
    platform: 'LeetCode',
    topic: 'Arrays',
    approach: 'Sliding Window',
    difficulty: 'Easy',
    status: 'Solved',
    url: '',
    notes: '',
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  const [filterTopic, setFilterTopic] = useState('')
  const [filterApproach, setFilterApproach] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchProblems()
      fetchHeatmap()
      fetchDashboardCharts()
      fetchDueForReviewCount()
    } else if (activeTab === 'problems') {
      fetchProblems()
    } else if (activeTab === 'revision') {
      fetchRevisionQueue()
    } else if (activeTab === 'contests') {
      fetchContests()
    }
  }, [activeTab])

  useEffect(() => {
    fetchDueForReviewCount()
  }, [])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const quotes = useMemo(
    () => ['consistency beats talent.', 'small steps, daily.'],
    [],
  )

  useEffect(() => {
    const t = window.setInterval(() => {
      setQuoteIndex((i) => (i + 1) % quotes.length)
    }, 10_000)
    return () => window.clearInterval(t)
  }, [quotes.length])

  useEffect(() => {
    if (!heatmapLoading && !heatmapError) {
      setHeatmapAnimKey((k) => k + 1)
    }
  }, [heatmapLoading, heatmapError])

  const fetchProblems = async () => {
    try {
      setProblemsLoading(true)
      setProblemsError('')
      const res = await axios.get(`${API_BASE}/api/problems`)
      const data = res.data
      let list = []
      if (Array.isArray(data)) list = data
      else if (Array.isArray(data?.problems)) list = data.problems
      else if (Array.isArray(data?.items)) list = data.items
      setProblems(list)
    } catch (err) {
      setProblemsError('Failed to load problems.')
    } finally {
      setProblemsLoading(false)
    }
  }

  const fetchDashboardCharts = async () => {
    try {
      setDashboardLoading(true)
      setDashboardError('')
      const res = await axios.get(`${API_BASE}/api/problems/dashboard`)
      const data = res.data || {}

      const topicData = data.byTopic
        ? Object.entries(data.byTopic).map(([name, value]) => ({
            name,
            value,
          }))
        : []

      const diffData = data.byDifficulty
        ? Object.entries(data.byDifficulty).map(([name, value]) => ({
            name,
            value,
          }))
        : []

      setDashboardCharts({
        topicData,
        difficultyData: diffData,
      })
    } catch (err) {
      setDashboardError('Failed to load dashboard charts.')
    } finally {
      setDashboardLoading(false)
    }
  }

  const fetchHeatmap = async () => {
    try {
      setHeatmapLoading(true)
      setHeatmapError('')
      const res = await axios.get(`${API_BASE}/api/problems/heatmap`)
      const data = res.data || {}
      setHeatmapCounts(data)
    } catch (err) {
      setHeatmapError('Failed to load activity heatmap.')
      setHeatmapCounts({})
    } finally {
      setHeatmapLoading(false)
    }
  }

  const fetchRevisionQueue = async () => {
    try {
      setRevisionLoading(true)
      setRevisionError('')
      const res = await axios.get(`${API_BASE}/api/problems/due-today`)
      const data = res.data
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.problems)
        ? data.problems
        : []
      setRevisionProblems(list)
      setRevisionRemovingIds(new Set())
    } catch (err) {
      setRevisionError('Failed to load revision queue.')
      setRevisionProblems([])
      setRevisionRemovingIds(new Set())
    } finally {
      setRevisionLoading(false)
    }
  }

  const fetchDueForReviewCount = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/problems/due-today`)
      const data = res.data
      const list = Array.isArray(data) ? data : Array.isArray(data?.problems) ? data.problems : []
      setDueForReviewCount(list.length)
    } catch (err) {
      setDueForReviewCount(0)
    }
  }

  const fetchContests = async () => {
    try {
      setContestsLoading(true)
      setContestsError('')
      const res = await axios.get(`${API_BASE}/api/contests`)
      const data = res.data
      const list = Array.isArray(data) ? data : Array.isArray(data?.contests) ? data.contests : []
      setContests(list)
    } catch (err) {
      setContestsError('Failed to load contests.')
      setContests([])
    } finally {
      setContestsLoading(false)
    }
  }

  const handleContestFormChange = (e) => {
    const { name, value } = e.target
    setContestForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleContestSubmit = async (e) => {
    e.preventDefault()
    setContestFormSubmitting(true)
    setContestFormError('')
    setContestFormSuccess('')
    try {
      await axios.post(`${API_BASE}/api/contests`, {
        platform: contestForm.platform,
        date: contestForm.date,
        rank: Number(contestForm.rank),
        problemsSolved: Number(contestForm.problemsSolved),
        ratingChange: Number(contestForm.ratingChange),
        notes: contestForm.notes || '',
      })
      setContestFormSuccess('Contest logged successfully.')
      setContestForm({
        platform: 'Codeforces',
        date: new Date().toISOString().slice(0, 10),
        rank: '',
        problemsSolved: '',
        ratingChange: '',
        notes: '',
      })
      setContestFormOpen(false)
      fetchContests()
      window.setTimeout(() => setContestFormSuccess(''), 3000)
    } catch (err) {
      setContestFormError('Failed to log contest.')
    } finally {
      setContestFormSubmitting(false)
    }
  }

  const handleContestDelete = async (id) => {
    if (!window.confirm('Delete this contest?')) return
    try {
      await axios.delete(`${API_BASE}/api/contests/${id}`)
      setContests((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert('Failed to delete contest.')
    }
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError('')
    setFormSuccess('')
    try {
      await axios.post(`${API_BASE}/api/problems`, form)
      setFormSuccess('Problem added successfully.')
      setForm({
        title: '',
        platform: 'LeetCode',
        topic: 'Arrays',
        approach: 'Sliding Window',
        difficulty: 'Easy',
        status: 'Solved',
        url: '',
        notes: '',
      })
      // Refresh data for other pages
      fetchProblems()
      fetchHeatmap()
      fetchDashboardCharts()
    } catch (err) {
      setFormError('Failed to add problem.')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return
    try {
      await axios.delete(`${API_BASE}/api/problems/${id}`)
      setProblems((prev) => prev.filter((p) => p.id !== id))
      fetchHeatmap()
      fetchDashboardCharts()
    } catch (err) {
      alert('Failed to delete problem.')
    }
  }

  const handleMarkSolved = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/api/problems/${id}/status`,
        null,
        { params: { status: 'Solved' } },
      )
      setProblems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: 'Solved' } : p,
        ),
      )
      fetchHeatmap()
      fetchDashboardCharts()
    } catch (err) {
      alert('Failed to update status.')
    }
  }

  const handleQueueForReview = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/api/problems/${id}/status`,
        null,
        { params: { status: 'To Revisit' } },
      )
      setProblems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: 'To Revisit' } : p,
        ),
      )
      fetchHeatmap()
      fetchDashboardCharts()
    } catch (err) {
      alert('Failed to queue for review.')
    }
  }

  const removeRevisionCardWithFade = (id) => {
    setRevisionRemovingIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    window.setTimeout(() => {
      setRevisionProblems((prev) => prev.filter((p) => p.id !== id))
      setRevisionRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 220)
  }

  const safeProblems = Array.isArray(problems) ? problems : []

  const filteredProblems = safeProblems.filter((p) => {
    const topicOk = !filterTopic || p.topic === filterTopic
    const approachOk = !filterApproach || p.approach === filterApproach
    const diffOk = !filterDifficulty || p.difficulty === filterDifficulty
    const statusOk = !filterStatus || p.status === filterStatus
    return topicOk && approachOk && diffOk && statusOk
  })

  const totalSolved = useMemo(
    () => safeProblems.filter((p) => p.status === 'Solved').length,
    [safeProblems],
  )
  const totalToRevisit = useMemo(
    () => safeProblems.filter((p) => p.status === 'To Revisit').length,
    [safeProblems],
  )
  const dailyStreak = useMemo(
    () => computeStreak(heatmapCounts),
    [heatmapCounts],
  )

  const heatmapWeeks = useMemo(
    () => buildHeatmapGrid(heatmapCounts),
    [heatmapCounts],
  )

  const renderSidebar = () => (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.logoCircle}>GS</div>
        <div>
          <div style={styles.appName}>Grindstone</div>
          <div style={styles.appSub}>Stay in practice</div>
        </div>
      </div>

      <nav style={styles.nav}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
          { id: 'problems', label: 'Problems', icon: 'list' },
          { id: 'revision', label: 'Revision Queue', icon: 'clock' },
          { id: 'contests', label: 'Contest Log', icon: 'trophy' },
          { id: 'add', label: 'Add Problem', icon: 'plus' },
        ].map((item) => {
          const active = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="navItem"
              data-active={active ? 'true' : 'false'}
              style={styles.navItemBase}
            >
              <span style={styles.navIconWrapper}>
                {item.icon === 'grid' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={styles.navIcon}
                  >
                    <rect x="2" y="2" width="4" height="4" rx="1" />
                    <rect x="10" y="2" width="4" height="4" rx="1" />
                    <rect x="2" y="10" width="4" height="4" rx="1" />
                    <rect x="10" y="10" width="4" height="4" rx="1" />
                  </svg>
                )}
                {item.icon === 'list' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={styles.navIcon}
                  >
                    <rect x="3" y="3" width="10" height="2" rx="1" />
                    <rect x="3" y="7" width="10" height="2" rx="1" />
                    <rect x="3" y="11" width="10" height="2" rx="1" />
                  </svg>
                )}
                {item.icon === 'clock' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={styles.navIcon}
                  >
                    <circle
                      cx="8"
                      cy="8"
                      r="5.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M8 4.5v3.2l2.2 1.3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {item.icon === 'trophy' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={styles.navIcon}
                  >
                    <path d="M4 2h8v1h2.5a.5.5 0 0 1 .5.5v2a2.5 2.5 0 0 1-2.5 2.5H12a4 4 0 0 1-3 1.93V12h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 5 12h2V9.93A4 4 0 0 1 4 8H3.5A2.5 2.5 0 0 1 1 5.5v-2a.5.5 0 0 1 .5-.5H4zm0 1.5H2.5v1a1 1 0 0 0 1 1H4zm8 0v2h.5a1 1 0 0 0 1-1v-1z" />
                  </svg>
                )}
                {item.icon === 'plus' && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    style={styles.navIcon}
                  >
                    <path d="M7 3.5a1 1 0 0 1 2 0V7h3.5a1 1 0 1 1 0 2H9v3.5a1 1 0 1 1-2 0V9H3.5a1 1 0 1 1 0-2H7z" />
                  </svg>
                )}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'revision' && dueForReviewCount > 0 && (
                <span style={styles.navBadge}>{dueForReviewCount}</span>
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )

  const renderBottomNav = () => (
    <div style={styles.bottomNav}>
      {[
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'problems', label: 'Problems' },
        { id: 'revision', label: 'Revision' },
        { id: 'contests', label: 'Contests' },
        { id: 'add', label: 'Add Problem' },
      ].map((item) => {
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className="bottomNavItem"
            data-active={active ? 'true' : 'false'}
            style={styles.bottomNavItemBase}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )

  const renderStatCards = () => (
    <div style={styles.statsRow}>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Total Solved</div>
        <div style={styles.statValue}>{totalSolved}</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>To Revisit</div>
        <div style={styles.statValue}>{totalToRevisit}</div>
      </div>
      <div style={styles.statCard}>
        <div style={styles.statLabel}>Daily Streak</div>
        <div style={styles.statValue}>{dailyStreak}</div>
      </div>
      <div style={styles.statCardOrange}>
        <div style={styles.statLabel}>Due for Review</div>
        <div style={styles.statValue}>{dueForReviewCount}</div>
      </div>
    </div>
  )

  const renderHeatmap = () => (
    <div style={styles.heatmapCard} key={`heatmap-${heatmapAnimKey}`}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>Practice activity</div>
          <div style={styles.sectionSubtitle}>
            Last 6 months of solved problems
          </div>
        </div>
      </div>

      {heatmapLoading && <p style={styles.muted}>Loading heatmap...</p>}
      {heatmapError && <p style={styles.errorText}>{heatmapError}</p>}

      {!heatmapLoading && !heatmapError && (
        <div style={styles.heatmapWrapper} className="heatmapFadeIn">
          <div style={styles.heatmapGridWrapper}>
            <div style={styles.heatmapMonthLabels}>
              {heatmapWeeks.map((week, weekIndex) => {
                const firstDay = week[0]?.date
                if (!firstDay) return <div key={weekIndex} style={styles.heatmapMonthLabelCell} />

                const isFirstOfMonth = firstDay.getDate() <= 7
                const label = isFirstOfMonth
                  ? MONTH_LABELS[firstDay.getMonth()]
                  : ''
                return (
                  <div key={weekIndex} style={styles.heatmapMonthLabelCell}>
                    <span style={styles.heatmapMonthLabelText}>{label}</span>
                  </div>
                )
              })}
            </div>
            <div style={styles.heatmapGrid}>
              {heatmapWeeks.map((week, weekIndex) => (
                <div key={weekIndex} style={styles.heatmapColumn}>
                  {week.map((day, dayIndex) => {
                    const color = getHeatColor(day.count)
                    const title = `${day.count} problems on ${formatDisplayDateFull(day.date)}`
                    return (
                      <div
                        key={day.key}
                        title={title}
                        style={{
                          ...styles.heatmapCell,
                          backgroundColor: color,
                        }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderDashboardCharts = () => (
    <div style={styles.chartsRow} className="chartsRowForceStack">
      <div style={styles.chartCard}>
        <div style={styles.sectionTitle}>Problems by topic</div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={dashboardCharts.topicData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip
                content={<CustomDarkTooltip />}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.sectionTitle}>Difficulty split</div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={dashboardCharts.difficultyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {dashboardCharts.difficultyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      DIFFICULTY_COLORS[entry.name] ||
                      ['#22c55e', '#eab308', '#ef4444'][index % 3]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomDarkTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div>
      {renderStatCards()}
      <div
        style={styles.quotesRow}
        className="quoteFade"
        key={`quote-${quoteIndex}`}
      >
        {quotes[quoteIndex]}
      </div>
      {renderHeatmap()}
      {dashboardLoading && (
        <p style={{ ...styles.muted, marginTop: '0.75rem' }}>
          Loading charts...
        </p>
      )}
      {dashboardError && (
        <p style={{ ...styles.errorText, marginTop: '0.75rem' }}>
          {dashboardError}
        </p>
      )}
      {!dashboardLoading && !dashboardError && renderDashboardCharts()}
    </div>
  )

  const renderRevisionQueue = () => {
    const count = revisionProblems.length
    return (
      <div>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Revision queue</div>
            <div style={styles.sectionSubtitle}>
              Focused list of problems due today.
            </div>
          </div>
          <div style={styles.revisionCountBadge}>
            {count}
          </div>
        </div>

        {revisionLoading && <p style={styles.muted}>Loading revision queue...</p>}
        {revisionError && <p style={styles.errorText}>{revisionError}</p>}

        {!revisionLoading && !revisionError && count === 0 && (
          <div style={styles.revisionEmpty}>
            <span style={{ fontSize: '1.1rem', marginRight: 6 }}>✅</span>
            <span>you are all caught up.</span>
          </div>
        )}

        {!revisionLoading && !revisionError && count > 0 && (
          <>
            <div style={styles.revisionCards}>
              {revisionProblems.map((p) => {
                const removing = revisionRemovingIds.has(p.id)
                return (
                  <div
                    key={p.id}
                    className={removing ? 'revisionCardOut' : 'revisionCardIn'}
                    style={styles.revisionCard}
                  >
                    <div style={styles.revisionTitleRow}>
                      {p.url ? (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          style={styles.revisionTitleLink}
                        >
                          {p.title}
                        </a>
                      ) : (
                        <span style={styles.revisionTitleText}>{p.title}</span>
                      )}
                    </div>
                    <div style={styles.revisionMetaRow}>
                      <span style={styles.revisionPill}>
                        {p.platform}
                      </span>
                      <span style={styles.revisionPill}>
                        {p.topic}
                      </span>
                      <span
                        style={{
                          ...styles.difficultyBadge,
                          backgroundColor:
                            DIFFICULTY_COLORS[p.difficulty] || '#6b7280',
                        }}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <div style={styles.revisionReviewLine}>
                      review #{(p.reviewCount ?? 0) + 1}
                    </div>
                    <div style={styles.revisionActionsRow}>
                      <button
                        type="button"
                        style={styles.revisionDoneButton}
                        onClick={async () => {
                          try {
                            await axios.patch(
                              `${API_BASE}/api/problems/${p.id}/reviewed`,
                            )
                            removeRevisionCardWithFade(p.id)
                            fetchHeatmap()
                            fetchDashboardCharts()
                          } catch (err) {
                            alert('Failed to mark as reviewed.')
                          }
                        }}
                      >
                        done, got it
                      </button>
                      <button
                        type="button"
                        style={styles.revisionNeedMoreButton}
                        onClick={async () => {
                          try {
                            await axios.patch(
                              `${API_BASE}/api/problems/${p.id}/status`,
                              null,
                              { params: { status: 'To Revisit' } },
                            )
                            removeRevisionCardWithFade(p.id)
                            fetchHeatmap()
                            fetchDashboardCharts()
                          } catch (err) {
                            alert('Failed to update status.')
                          }
                        }}
                      >
                        need more practice
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={styles.revisionFooterNote}>
              revision is where real learning happens.
            </div>
          </>
        )}
      </div>
    )
  }

  const renderAllProblems = () => (
    <div>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>Problem library</div>
          <div style={styles.sectionSubtitle}>
            Filter, review, and update your attempts.
          </div>
        </div>
      </div>

      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Topic</label>
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            style={styles.input}
          >
            <option value="">All</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Approach</label>
          <select
            value={filterApproach}
            onChange={(e) => setFilterApproach(e.target.value)}
            style={styles.input}
          >
            <option value="">All</option>
            {APPROACHES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Difficulty</label>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            style={styles.input}
          >
            <option value="">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={styles.input}
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={fetchProblems}
          style={{ ...styles.primaryButton, marginLeft: 'auto' }}
        >
          Refresh
        </button>
      </div>

      {problemsLoading && <p style={styles.muted}>Loading problems...</p>}
      {problemsError && <p style={styles.errorText}>{problemsError}</p>}

      {!problemsLoading && filteredProblems.length === 0 && !problemsError && (
        <p style={styles.muted}>No problems found.</p>
      )}

      {!problemsLoading && filteredProblems.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Platform</th>
                <th style={styles.th}>Topic</th>
                <th style={styles.th}>Approach</th>
                <th style={styles.th}>Difficulty</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Notes</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((p) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.link}
                      >
                        {p.title}
                      </a>
                    ) : (
                      p.title
                    )}
                  </td>
                  <td style={styles.td}>{p.platform}</td>
                  <td style={styles.td}>{p.topic}</td>
                  <td style={styles.td}>
                    <span style={styles.approachBadge}>
                      {p.approach || '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.difficultyBadge,
                        backgroundColor:
                          DIFFICULTY_COLORS[p.difficulty] || '#6b7280',
                      }}
                    >
                      {p.difficulty}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(p.status === 'Solved'
                          ? styles.statusSolved
                          : styles.statusRevisit),
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={styles.td}>{p.notes}</td>
                  <td style={styles.tdActions}>
                    {p.status === 'Solved' && (
                      <button
                        type="button"
                        style={styles.queueButton}
                        onClick={() => handleQueueForReview(p.id)}
                      >
                        Queue for review
                      </button>
                    )}
                    {p.status === 'To Revisit' && (
                      <button
                        type="button"
                        style={styles.markSolvedButton}
                        onClick={() => handleMarkSolved(p.id)}
                      >
                        Mark as Solved
                      </button>
                    )}
                    <button
                      type="button"
                      style={styles.deleteButton}
                      onClick={() => handleDelete(p.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderAddProblem = () => (
    <div style={styles.addWrapper}>
      <div style={styles.addCard}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Add new problem</div>
            <div style={styles.sectionSubtitle}>
              Log another solved challenge to keep your streak alive.
            </div>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Platform</label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleFormChange}
                style={styles.input}
                required
              >
                <option value="LeetCode">LeetCode</option>
                <option value="Codeforces">Codeforces</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Topic</label>
              <select
                name="topic"
                value={form.topic}
                onChange={handleFormChange}
                style={styles.input}
                required
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Approach / Technique</label>
              <select
                name="approach"
                value={form.approach}
                onChange={handleFormChange}
                style={styles.input}
                required
              >
                {APPROACHES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Difficulty</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={handleFormChange}
                style={styles.input}
                required
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                style={styles.input}
                required
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>URL</label>
              <input
                type="url"
                name="url"
                value={form.url}
                onChange={handleFormChange}
                style={styles.input}
                placeholder="https://"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
            />
          </div>

          {formError && <p style={styles.errorText}>{formError}</p>}
          {formSuccess && <p style={styles.successText}>{formSuccess}</p>}

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Saving...' : 'Add Problem'}
          </button>
        </form>
      </div>
    </div>
  )

  const contestChartData = useMemo(() => {
    if (!contests || contests.length === 0) return []
    const sorted = [...contests].sort((a, b) => new Date(a.date) - new Date(b.date))
    let cumulative = 0
    return sorted.map((c) => {
      cumulative += (c.ratingChange || 0)
      const d = new Date(c.date)
      const label = `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`
      return { date: label, rating: cumulative, fullDate: c.date }
    })
  }, [contests])

  const renderContestLog = () => {
    const safeContests = Array.isArray(contests) ? contests : []
    return (
      <div>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionTitle}>Contest log</div>
            <div style={styles.sectionSubtitle}>
              Track your competitive contest performance over time.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setContestFormOpen((v) => !v)
              setContestFormError('')
              setContestFormSuccess('')
            }}
            style={styles.contestToggleButton}
          >
            {contestFormOpen ? '− Collapse' : '+ Log Contest'}
          </button>
        </div>

        {contestFormSuccess && (
          <p style={styles.successText}>{contestFormSuccess}</p>
        )}

        {contestFormOpen && (
          <div style={styles.contestFormCard} className="contestFormFade">
            <form onSubmit={handleContestSubmit}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Platform</label>
                  <select
                    name="platform"
                    value={contestForm.platform}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    required
                  >
                    {CONTEST_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={contestForm.date}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rank</label>
                  <input
                    type="number"
                    name="rank"
                    value={contestForm.rank}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    placeholder="e.g. 1234"
                    required
                    min="1"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Problems solved</label>
                  <input
                    type="number"
                    name="problemsSolved"
                    value={contestForm.problemsSolved}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    placeholder="e.g. 3"
                    required
                    min="0"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rating change</label>
                  <input
                    type="number"
                    name="ratingChange"
                    value={contestForm.ratingChange}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    placeholder="e.g. -15"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes (optional)</label>
                  <input
                    type="text"
                    name="notes"
                    value={contestForm.notes}
                    onChange={handleContestFormChange}
                    style={styles.input}
                    placeholder="quick takeaways…"
                  />
                </div>
              </div>
              {contestFormError && (
                <p style={styles.errorText}>{contestFormError}</p>
              )}
              <button
                type="submit"
                style={styles.primaryButton}
                disabled={contestFormSubmitting}
              >
                {contestFormSubmitting ? 'Saving…' : 'Log Contest'}
              </button>
            </form>
          </div>
        )}

        {contestsLoading && <p style={styles.muted}>Loading contests…</p>}
        {contestsError && <p style={styles.errorText}>{contestsError}</p>}

        {!contestsLoading && !contestsError && safeContests.length === 0 && (
          <div style={styles.contestEmpty}>
            no contests logged yet. start grinding.
          </div>
        )}

        {!contestsLoading && !contestsError && safeContests.length > 0 && (
          <>
            <div style={styles.contestChartCard}>
              <div style={styles.sectionTitle}>Cumulative rating</div>
              <div style={{ width: '100%', height: 260, marginTop: 12 }}>
                <ResponsiveContainer>
                  <LineChart data={contestChartData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={{ stroke: '#30363d' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                      axisLine={{ stroke: '#30363d' }}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomDarkTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3b82f6', stroke: '#020617', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#60a5fa' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.contestCards}>
              {safeContests.map((c) => {
                const changeNum = Number(c.ratingChange) || 0
                const isPositive = changeNum > 0
                const isNegative = changeNum < 0
                const changeColor = isPositive
                  ? '#4ade80'
                  : isNegative
                  ? '#f87171'
                  : '#9ca3af'
                const changePrefix = isPositive ? '+' : ''
                const d = new Date(c.date)
                const dateStr = `${MONTH_LABELS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`
                return (
                  <div key={c.id} style={styles.contestCard} className="revisionCardIn">
                    <div style={styles.contestCardTopRow}>
                      <span
                        style={{
                          ...styles.contestPlatformBadge,
                          backgroundColor: PLATFORM_COLORS[c.platform] || '#6b7280',
                        }}
                      >
                        {c.platform}
                      </span>
                      <span style={styles.contestDateText}>{dateStr}</span>
                    </div>
                    <div style={styles.contestRankRow}>
                      <span style={styles.contestRankLabel}>Rank</span>
                      <span style={styles.contestRankValue}>#{c.rank}</span>
                    </div>
                    <div style={styles.contestMetaRow}>
                      <span style={styles.contestMetaItem}>
                        {c.problemsSolved} solved
                      </span>
                      <span
                        style={{
                          ...styles.contestMetaItem,
                          color: changeColor,
                          fontWeight: 600,
                        }}
                      >
                        {changePrefix}{changeNum}
                      </span>
                    </div>
                    {c.notes && (
                      <div style={styles.contestNotes}>{c.notes}</div>
                    )}
                    <div style={styles.contestCardBottomRow}>
                      <button
                        type="button"
                        style={styles.contestDeleteButton}
                        onClick={() => handleContestDelete(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <style>{globalStyles}</style>
      <div
        style={{
          ...styles.shell,
          gridTemplateColumns: isMobile ? '1fr' : styles.shell.gridTemplateColumns,
        }}
      >
        {!isMobile && renderSidebar()}
        <main
          style={{
            ...styles.main,
            paddingBottom: isMobile ? '5.25rem' : styles.main.paddingBottom,
          }}
        >
          <header style={styles.header}>
            <div>
              <h1 style={styles.title}>Grindstone</h1>
              <p style={styles.subtitle}>
                sharpen your competitive edge.
              </p>
            </div>
          </header>

          <div key={activeTab} className="pageFade">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'problems' && renderAllProblems()}
            {activeTab === 'revision' && renderRevisionQueue()}
            {activeTab === 'contests' && renderContestLog()}
            {activeTab === 'add' && renderAddProblem()}
          </div>
        </main>
        {isMobile && renderBottomNav()}
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#010409',
    color: '#e5e7eb',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    padding: '0.75rem 1rem',
    boxSizing: 'border-box',
  },
  shell: {
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    maxWidth: 1240,
    margin: '0 auto',
    borderRadius: 18,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at 0 0, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 100% 0, rgba(129,140,248,0.24), transparent 55%), #02040a',
    overflow: 'hidden',
    boxShadow:
      '0 24px 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(148,163,184,0.15)',
  },
  sidebar: {
    borderRight: '1px solid #30363d',
    padding: '1.25rem 1.25rem 1.5rem',
    background:
      'radial-gradient(circle at 0 0, rgba(8,47,73,0.7), transparent 60%), #020617',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: '999px',
    background:
      'conic-gradient(from 160deg, #22c55e, #3b82f6, #a855f7, #22c55e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#020617',
  },
  appName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#e5e7eb',
  },
  appSub: {
    fontSize: '0.78rem',
    color: '#9ca3af',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navItemBase: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '0.55rem 0.65rem',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    color: '#aaaaaa',
  },
  navIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fill: 'currentColor',
  },
  navBadge: {
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 600,
    lineHeight: '18px',
    textAlign: 'center',
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
  main: {
    padding: '1.4rem 1.6rem 1.6rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    paddingBottom: '1.6rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: '0.3rem 0 0',
    color: '#9ca3af',
    fontSize: '0.88rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.65rem',
  },
  sectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#e5e7eb',
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '0.75rem',
  },
  statCard: {
    background:
      'radial-gradient(circle at top left, rgba(56,189,248,0.4), transparent 60%), rgba(13,17,23,0.95)',
    borderRadius: 12,
    padding: '0.7rem 0.9rem',
    border: '1px solid rgba(148,163,184,0.45)',
  },
  statCardOrange: {
    background:
      'radial-gradient(circle at top left, rgba(249,115,22,0.45), transparent 60%), rgba(13,17,23,0.95)',
    borderRadius: 12,
    padding: '0.7rem 0.9rem',
    border: '1px solid rgba(249,115,22,0.55)',
  },
  statLabel: {
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9ca3af',
  },
  statValue: {
    marginTop: 6,
    fontSize: '1.6rem',
    fontWeight: 600,
    color: '#e5e7eb',
  },
  heatmapCard: {
    marginTop: '1rem',
    borderRadius: 12,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top right, rgba(34,197,94,0.3), transparent 55%), rgba(13,17,23,0.96)',
    padding: '0.8rem 0.9rem 0.9rem',
  },
  heatmapWrapper: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: '0.75rem',
  },
  heatmapGridWrapper: {
    flex: 1,
    overflowX: 'auto',
  },
  heatmapMonthLabels: {
    display: 'flex',
    gap: 3,
    paddingLeft: 2,
  },
  heatmapMonthLabelCell: {
    width: 14,
    height: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heatmapMonthLabelText: {
    fontSize: '0.68rem',
    color: '#6b7280',
  },
  heatmapGrid: {
    display: 'flex',
    flexDirection: 'row',
    gap: 3,
    paddingTop: 2,
    paddingBottom: 6,
    paddingLeft: 2,
  },
  heatmapColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
    gap: '0.9rem',
    marginTop: '1rem',
  },
  chartCard: {
    backgroundColor: 'rgba(13,17,23,0.96)',
    borderRadius: 12,
    border: '1px solid #30363d',
    padding: '0.8rem 0.9rem',
  },
  revisionCountBadge: {
    minWidth: 32,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: '0.8rem',
    fontWeight: 500,
    textAlign: 'center',
    backgroundColor: 'rgba(34,197,94,0.18)',
    color: '#bbf7d0',
  },
  revisionEmpty: {
    marginTop: '1.1rem',
    padding: '2.2rem 1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#6b7280',
    fontSize: '0.95rem',
    gap: 4,
  },
  revisionCards: {
    marginTop: '0.9rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '0.8rem',
  },
  revisionCard: {
    borderRadius: 12,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top left, rgba(56,189,248,0.26), transparent 55%), rgba(13,17,23,0.96)',
    padding: '0.75rem 0.85rem 0.8rem',
  },
  revisionTitleRow: {
    marginBottom: 6,
  },
  revisionTitleLink: {
    fontSize: '0.96rem',
    fontWeight: 500,
    color: '#93c5fd',
    textDecoration: 'none',
  },
  revisionTitleText: {
    fontSize: '0.96rem',
    fontWeight: 500,
  },
  revisionMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  revisionPill: {
    padding: '0.12rem 0.5rem',
    borderRadius: 999,
    fontSize: '0.75rem',
    color: '#d1d5db',
    backgroundColor: '#1f2933',
  },
  revisionReviewLine: {
    marginTop: 6,
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  revisionActionsRow: {
    marginTop: 8,
    display: 'flex',
    gap: 8,
  },
  revisionDoneButton: {
    flex: 1,
    padding: '0.35rem 0.6rem',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    background:
      'linear-gradient(135deg, #22c55e, #16a3f5)',
    color: '#f9fafb',
  },
  revisionNeedMoreButton: {
    flex: 1,
    padding: '0.35rem 0.6rem',
    borderRadius: 999,
    border: '1px solid rgba(249,115,22,0.7)',
    backgroundColor: 'rgba(30,64,175,0.15)',
    color: '#fed7aa',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
  revisionFooterNote: {
    marginTop: '0.9rem',
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  quotesRow: {
    marginTop: '0.55rem',
    fontSize: '0.82rem',
    color: 'rgba(170,170,170,0.78)',
    textTransform: 'lowercase',
    letterSpacing: '0.01em',
  },
  bottomNav: {
    position: 'sticky',
    bottom: 0,
    left: 0,
    right: 0,
    gridColumn: '1 / -1',
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    padding: '10px 10px 12px',
    background: 'rgba(2,6,23,0.92)',
    borderTop: '1px solid #30363d',
    backdropFilter: 'blur(10px)',
  },
  bottomNavItemBase: {
    border: 'none',
    borderRadius: 12,
    padding: '10px 12px',
    background: 'transparent',
    color: '#aaaaaa',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'background-color 150ms ease, color 150ms ease',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'flex-end',
    marginTop: '0.75rem',
  },
  filterGroup: {
    minWidth: 150,
  },
  addWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '0.5rem',
  },
  addCard: {
    width: '100%',
    maxWidth: 600,
    borderRadius: 14,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top left, rgba(129,140,248,0.35), transparent 55%), rgba(13,17,23,0.97)',
    padding: '1rem 1.1rem 1.2rem',
    boxShadow: '0 18px 40px rgba(0,0,0,0.6)',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem 1rem',
  },
  formGroup: {
    marginBottom: '0.75rem',
  },
  label: {
    display: 'block',
    marginBottom: 4,
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  input: {
    width: '100%',
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid #30363d',
    backgroundColor: '#020617',
    color: '#e5e7eb',
    fontSize: '0.86rem',
    outline: 'none',
  },
  primaryButton: {
    marginTop: '0.5rem',
    padding: '0.5rem 1.25rem',
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    background:
      'linear-gradient(135deg, #22c55e, #16a3f5, #8b5cf6)',
    color: '#f9fafb',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.85rem',
    minWidth: 780,
  },
  th: {
    textAlign: 'left',
    padding: '0.5rem 0.55rem',
    borderBottom: '1px solid #30363d',
    fontWeight: 500,
    color: '#9ca3af',
    whiteSpace: 'nowrap',
    backgroundColor: 'rgba(15,23,42,0.95)',
  },
  tr: {
    borderBottom: '1px solid #1f2933',
  },
  td: {
    padding: '0.45rem 0.55rem',
    verticalAlign: 'top',
    color: '#e5e7eb',
  },
  tdActions: {
    padding: '0.45rem 0.55rem',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
    whiteSpace: 'nowrap',
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
  },
  difficultyBadge: {
    display: 'inline-block',
    padding: '0.12rem 0.55rem',
    borderRadius: 999,
    fontSize: '0.78rem',
    color: '#020617',
    fontWeight: 600,
  },
  approachBadge: {
    display: 'inline-block',
    padding: '0.12rem 0.55rem',
    borderRadius: 999,
    fontSize: '0.78rem',
    fontWeight: 500,
    color: '#d1d5db',
    backgroundColor: '#374151',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '0.12rem 0.6rem',
    borderRadius: 999,
    fontSize: '0.78rem',
    fontWeight: 500,
  },
  statusSolved: {
    backgroundColor: 'rgba(59,130,246,0.18)',
    color: '#93c5fd',
  },
  statusRevisit: {
    backgroundColor: 'rgba(249,115,22,0.2)',
    color: '#fdba74',
  },
  markSolvedButton: {
    padding: '4px 10px',
    height: '28px',
    borderRadius: '12px',
    border: '1px solid #22c55e',
    backgroundColor: 'transparent',
    color: '#22c55e',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  queueButton: {
    padding: '4px 10px',
    height: '28px',
    borderRadius: '12px',
    border: '1px solid #3b82f6',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  deleteButton: {
    padding: '4px 10px',
    height: '28px',
    borderRadius: '12px',
    border: '1px solid #ef4444',
    backgroundColor: 'transparent',
    color: '#ef4444',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  muted: {
    color: '#6b7280',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
  },
  errorText: {
    color: '#f97373',
    fontSize: '0.85rem',
    marginTop: '0.4rem',
  },
  successText: {
    color: '#4ade80',
    fontSize: '0.85rem',
    marginTop: '0.4rem',
  },
  contestToggleButton: {
    padding: '0.4rem 1rem',
    borderRadius: 999,
    border: '1px solid rgba(56,189,248,0.6)',
    backgroundColor: 'rgba(56,189,248,0.08)',
    color: '#93c5fd',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 150ms ease',
  },
  contestFormCard: {
    borderRadius: 14,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top left, rgba(129,140,248,0.25), transparent 55%), rgba(13,17,23,0.97)',
    padding: '1rem 1.1rem 1.2rem',
    marginBottom: '1rem',
  },
  contestEmpty: {
    marginTop: '2rem',
    padding: '2.5rem 1rem',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.92rem',
    fontStyle: 'italic',
  },
  contestChartCard: {
    marginTop: '1rem',
    borderRadius: 12,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top right, rgba(59,130,246,0.25), transparent 55%), rgba(13,17,23,0.96)',
    padding: '0.8rem 0.9rem 0.9rem',
  },
  contestCards: {
    marginTop: '1rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '0.8rem',
  },
  contestCard: {
    borderRadius: 12,
    border: '1px solid #30363d',
    background:
      'radial-gradient(circle at top left, rgba(56,189,248,0.18), transparent 55%), rgba(13,17,23,0.96)',
    padding: '0.75rem 0.85rem 0.7rem',
  },
  contestCardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contestPlatformBadge: {
    display: 'inline-block',
    padding: '0.14rem 0.6rem',
    borderRadius: 999,
    fontSize: '0.76rem',
    fontWeight: 600,
    color: '#ffffff',
  },
  contestDateText: {
    fontSize: '0.78rem',
    color: '#9ca3af',
  },
  contestRankRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  contestRankLabel: {
    fontSize: '0.78rem',
    color: '#9ca3af',
  },
  contestRankValue: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: '#e5e7eb',
  },
  contestMetaRow: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  contestMetaItem: {
    fontSize: '0.82rem',
    color: '#d1d5db',
  },
  contestNotes: {
    marginTop: 6,
    fontSize: '0.78rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  contestCardBottomRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  contestDeleteButton: {
    padding: '3px 10px',
    borderRadius: 8,
    border: '1px solid rgba(239,68,68,0.5)',
    backgroundColor: 'transparent',
    color: '#f87171',
    fontSize: '0.74rem',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 150ms ease',
  },
}

const globalStyles = `
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    background-color: #000000;
  }
  #root {
    width: 100%;
    max-width: none;
    margin: 0;
    text-align: initial;
    border: none;
    min-height: 100vh;
    display: block;
  }
  .pageFade {
    animation: pageFade 200ms ease both;
  }
  @keyframes pageFade {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .heatmapFadeIn {
    animation: heatFade 260ms ease both;
  }
  @keyframes heatFade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .quoteFade {
    animation: quoteFade 200ms ease both;
  }
  @keyframes quoteFade {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .navItem {
    transition: background-color 150ms ease, color 150ms ease;
  }
  .navItem[data-active="true"] {
    color: #ffffff !important;
    background: rgba(255,255,255,0.08) !important;
  }
  .navItem[data-active="false"] {
    color: #aaaaaa !important;
    background: transparent !important;
  }
  .navItem[data-active="false"]:hover {
    background: rgba(255,255,255,0.06) !important;
    color: #ffffff !important;
  }
  .bottomNavItem[data-active="true"] {
    color: #ffffff !important;
    background: rgba(255,255,255,0.08) !important;
  }
  .bottomNavItem[data-active="false"] {
    color: #aaaaaa !important;
    background: transparent !important;
  }
  .bottomNavItem[data-active="false"]:hover {
    background: rgba(255,255,255,0.06) !important;
    color: #ffffff !important;
  }
  .revisionCardIn {
    animation: revisionIn 200ms ease both;
  }
  .revisionCardOut {
    animation: revisionOut 200ms ease both;
  }
  @keyframes revisionIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes revisionOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-4px); }
  }
  @media (max-width: 900px) {
    /* stack charts */
    .pageFade .chartsRowForceStack {
      grid-template-columns: 1fr !important;
    }
  }
  select:focus,
  input:focus,
  textarea:focus {
    outline: none;
    border-color: rgba(56,189,248,0.9);
    box-shadow: 0 0 0 1px rgba(56,189,248,0.7);
  }
  button:disabled {
    opacity: 0.65;
    cursor: default;
  }
  .contestFormFade {
    animation: pageFade 200ms ease both;
  }
  .contestDeleteButton:hover {
    opacity: 1 !important;
  }
`

export default App
