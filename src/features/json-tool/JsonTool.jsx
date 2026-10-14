import { useState, useCallback, useRef } from 'react'
import './JsonTool.css'
import { formatCode, parseExcludedFields } from './format'

const PLACEHOLDER = `{
  "common_settings_kmaH9J": "<div><span>示例设置</span></div>",
  "new_common_tabbar_RTmp4j": "<nav><a href='#'>首页</a><a href='#'>关于</a></nav>",
  "content": "<section><h2>示例文章</h2><p>这是一段文字<br>换行了</p></section>"
}`

const modes = [
  { id: 'json', label: 'JSON', sample: PLACEHOLDER.trim() },
  { id: 'html', label: 'HTML', sample: '<section><h2>示例文章</h2><p>这是一段文字<br>换行了</p></section>' },
  { id: 'shopify-html', label: 'Shopify HTML', sample: '<section><h2>示例文章</h2><p>这是一段文字<br>换行了</p></section>' },
  { id: 'js', label: 'JS', sample: 'const products=[{name:"示例商品",price:99}];function total(items){return items.reduce((sum,item)=>sum+item.price,0)}console.log(total(products));' },
]

export function JsonTool({ onBack }) {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [charCount, setCharCount] = useState(0)
  const [excludedFieldInput, setExcludedFieldInput] = useState('')
  const [formatMode, setFormatMode] = useState('json')
  const [formatting, setFormatting] = useState(false)
  const requestId = useRef(0)
  const copyTimer = useRef(null)
  const currentMode = modes.find((mode) => mode.id === formatMode)

  const handleFormat = useCallback(async () => {
    const request = ++requestId.current
    if (!input.trim()) {
      setError(`请先输入 ${currentMode.label} 内容`)
      setOutput('')
      return
    }
    setFormatting(true)
    try {
      const formatted = await formatCode(input, formatMode, excludedFieldInput)
      if (request !== requestId.current) return
      setOutput(formatted)
      setError('')
    } catch (e) {
      if (request !== requestId.current) return
      setError(`${currentMode.label} 格式化失败：` + e.message)
      setOutput('')
    } finally {
      if (request === requestId.current) setFormatting(false)
    }
  }, [excludedFieldInput, formatMode, currentMode.label, input])

  const resetResult = useCallback(() => {
    requestId.current += 1
    setFormatting(false)
    setOutput('')
    setError('')
    setCopied(false)
    clearTimeout(copyTimer.current)
  }, [])

  const handleModeChange = (mode) => {
    setFormatMode(mode)
    resetResult()
  }

  const handleClear = useCallback(() => {
    setInput('')
    resetResult()
    setCharCount(0)
  }, [resetResult])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    })
  }, [output])

  const handleInputChange = useCallback((e) => {
    resetResult()
    const val = e.target.value
    setInput(val)
    setCharCount(val.length)
  }, [resetResult])

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleFormat()
    }
  }, [handleFormat])

  const handleDemo = useCallback(() => {
    setInput(currentMode.sample)
    setCharCount(currentMode.sample.length)
    resetResult()
  }, [currentMode.sample, resetResult])

  return (
    <div className="app">
      {/* 顶部装饰条 */}
      <div className="decorative-bar" aria-hidden="true">
        <span className="bar-segment bar-segment--rose" />
        <span className="bar-segment bar-segment--sage" />
        <span className="bar-segment bar-segment--blue" />
        <span className="bar-segment bar-segment--warm" />
        <span className="bar-segment bar-segment--mauve" />
      </div>

      <header className="header">
        <div className="brand-lockup">
          <div className="header-badge">{'{ }'}</div>
          <div>
            <h1 className="title">格式化</h1>
            <p className="subtitle">{currentMode.label}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="back-btn" onClick={onBack}>
            <span aria-hidden="true">←</span> 返回工具箱
          </button>
          <div className="format-tags" role="group" aria-label="格式化模式">
          {modes.map((mode) => <button key={mode.id} className={`mode-btn ${formatMode === mode.id ? 'is-active' : ''}`} aria-pressed={formatMode === mode.id} onClick={() => handleModeChange(mode.id)}>{mode.label}</button>)}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="tool-row">
          {formatMode === 'json' && <label className="filter-control" htmlFor="excluded-fields">
            <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 5h16M7 12h10M10 19h4" />
            </svg>
            <span>跳过字段</span>
            <input
              id="excluded-fields"
              className="filter-input"
              type="text"
              value={excludedFieldInput}
              onChange={(event) => { setExcludedFieldInput(event.target.value); resetResult() }}
              placeholder="aaa;bbbb;ccc"
              spellCheck={false}
            />
            {parseExcludedFields(excludedFieldInput).size > 0 && (
              <span className="filter-count">{parseExcludedFields(excludedFieldInput).size}</span>
            )}
          </label>}

          <div className="actions">
            <button className="btn btn--primary" onClick={handleFormat} disabled={formatting}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
              {formatting ? '格式化中…' : '格式化'}
            </button>
            <button className="btn btn--ghost" onClick={handleClear}>
              清空
            </button>
          </div>
        </div>

        {error && (
          <div className="error" role="alert">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="editor-grid">
          <section className="panel panel--input">
            <div className="panel-top">
              <div className="panel-label">
                <span className="panel-dot" aria-hidden="true" />
                原数据
              </div>
              <div className="panel-meta">
                <button className="meta-btn" onClick={handleDemo}>
                  填入示例
                </button>
                <span className="char-count">{charCount.toLocaleString()} 字符</span>
              </div>
            </div>
            <textarea
              id="json-input"
              aria-label={`${currentMode.label} 原数据`}
              className="editor"
              placeholder={`在此粘贴 ${currentMode.label} 文本……`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
            <div className="panel-hint">Ctrl + Enter 快速格式化</div>
          </section>

          <section className="panel panel--output">
            <div className="panel-top">
              <div className="panel-label">
                <span className="panel-dot panel-dot--sage" aria-hidden="true" />
                格式化结果
              </div>
              {output && (
                <button
                  className={`btn btn--copy ${copied ? 'btn--copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '已复制' : '复制结果'}
                </button>
              )}
            </div>
            {output ? (
              <pre className="result">{output}</pre>
            ) : (
              <div className="output-empty">
                <svg className="empty-code-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
                </svg>
                <strong>等待格式化</strong>
                <span>输入 {currentMode.label} 后，结果会显示在这里</span>
              </div>
            )}
          </section>
        </div>
      </main>

    </div>
  )
}

export function ToolboxHome({ onOpen }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部工具')
  const categories = ['全部工具', '店铺运营', '数据处理']
  const tools = [{ name: '格式化', type: 'JSON / HTML / JS', category: '数据处理', description: '整理数据与代码。', status: '可用', accent: 'blue' }]
  const visibleTools = tools.filter((tool) => {
    const matchesQuery = `${tool.name}${tool.type}${tool.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === '全部工具' || tool.category === category)
  })

  return (
    <div className="toolbox-page">
      <div className="decorative-bar" aria-hidden="true"><span className="bar-segment bar-segment--rose" /><span className="bar-segment bar-segment--sage" /><span className="bar-segment bar-segment--blue" /><span className="bar-segment bar-segment--warm" /><span className="bar-segment bar-segment--mauve" /></div>
      <header className="toolbox-header">
        <div className="toolbox-brand"><div className="toolbox-mark">L</div><div><div className="toolbox-name">lunovaai 工具箱</div><div className="toolbox-caption">为日常工作准备的轻量工具</div></div></div>
        <div className="header-status"><span className="status-dot" />系统运行正常</div>
      </header>
      <main className="toolbox-main">
        <section className="welcome-section"><div><p className="eyebrow">工具中心 / 2026</p><h1>把重复工作，<span>交给工具。</span></h1><p className="welcome-copy">集中管理店铺运营中常用的小工具，快速打开、立即使用。</p></div><div className="welcome-stat"><strong>01</strong><span>当前可用工具</span></div></section>
        <section className="tool-browser" aria-label="工具目录">
          <div className="browser-toolbar"><div className="category-tabs">{categories.map((item) => <button key={item} className={category === item ? 'category-tab is-active' : 'category-tab'} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索工具" /></label></div>
          <div className="tool-grid">{visibleTools.map((tool) => <article className="tool-card" key={tool.name}><div className="tool-card-top"><div className={`tool-icon tool-icon--${tool.accent}`}>{'{ }'}</div><span className="available-badge"><span className="status-dot" />{tool.status}</span></div><div className="tool-card-body"><p className="tool-type">{tool.type}</p><h2>{tool.name}</h2><p>{tool.description}</p></div><button className="tool-open" onClick={onOpen}>立即使用 <span aria-hidden="true">↗</span></button></article>)}{visibleTools.length === 0 && <div className="no-results">没有找到匹配的工具</div>}</div>
        </section>
        <section className="coming-soon"><div><p className="eyebrow">工具路线图</p><h2>更多工具正在准备中</h2><p>我们会持续补充选品、内容与数据处理工具。</p></div><div className="coming-count"><strong>04</strong><span>即将推出</span></div></section>
      </main><footer className="toolbox-footer"><span>lunovaai 工具箱</span><span>轻量、专注、随时可用</span></footer>
    </div>
  )
}
