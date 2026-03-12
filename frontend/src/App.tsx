import './index.css'
import { マップグリッド } from './components/map/マップグリッド'

function App() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      <div className="h-1/3 border-b border-gray-300 overflow-hidden">
        <マップグリッド />
      </div>
      <div className="h-2/3 flex items-center justify-center text-gray-400 text-sm">
        タイムライン（Phase 3で実装）
      </div>
    </div>
  )
}

export default App
