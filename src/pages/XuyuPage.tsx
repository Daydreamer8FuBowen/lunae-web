import { Link } from 'react-router-dom'
import { routePaths } from '../app/routes'
import './xuyu.css'

export default function XuyuPage() {
  return <main className="xuyu-page" aria-label="须臾集">
    <nav className="xuyu-toolbar" aria-label="项目导航">
      <Link to={routePaths.tools}>← 返回工具箱</Link>
      <span>须臾集 · 让片刻有处可停</span>
    </nav>
    <iframe className="xuyu-frame" src="/code1/index.html" title="须臾集创作与收藏" />
  </main>
}
