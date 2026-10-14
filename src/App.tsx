import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import ToolsPage from './pages/ToolsPage'
import DemoPage from './pages/DemoPage'
import { JsonTool } from './features/json-tool/JsonTool'
import { legacyRedirects, projectEntries, routePaths } from './app/routes'
import { legacyDemoTabs } from './app/demos'
import './styles/globals.css'

function JsonToolPage() {
  const navigate = useNavigate()
  return <div className="tool-route"><JsonTool onBack={() => navigate(routePaths.tools)} /></div>
}

export function AppRoutes() {
  return <Routes>
    <Route path={routePaths.home} element={<Navigate to={routePaths.tools} replace />} />
    <Route path={routePaths.tools} element={<ToolsPage />} />
    <Route path={routePaths.json} element={<JsonToolPage />} />
    <Route path={routePaths.showcase} element={<DemoPage />} />
    {Object.entries(legacyRedirects).map(([path, target]) => <Route key={path} path={path} element={<Navigate to={target} replace />} />)}
    {Object.entries(legacyDemoTabs).map(([path, demo]) => <Route key={path} path={path} element={<Navigate to={routePaths.showcase} state={{ demo }} replace />} />)}
    <Route path="/showcase/:slug" element={<Navigate to={routePaths.showcase} replace />} />
    <Route path="*" element={<Navigate to={routePaths.home} replace />} />
  </Routes>
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>
}

export { projectEntries }
