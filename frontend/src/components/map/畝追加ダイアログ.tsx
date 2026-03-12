import { useState } from 'react'
import type { 方向 } from '../../types'

type Props = {
  初期x: number
  初期y: number
  確定: (名前: string, 長さ: number, 方向: 方向) => void
  キャンセル: () => void
  セルサイズ: number
}

export const 畝追加ダイアログ = ({ 初期x, 初期y, 確定, キャンセル, セルサイズ }: Props) => {
  const [名前, 名前を設定する] = useState('')
  const [長さ, 長さを設定する] = useState(4)
  const [方向, 方向を設定する] = useState<方向>('縦')

  const 送信する = (e: React.FormEvent) => {
    e.preventDefault()
    if (!名前.trim()) return
    確定(名前.trim(), 長さ, 方向)
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={キャンセル} />
      <form
        onSubmit={送信する}
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-44"
        style={{
          left: (初期x + 1) * セルサイズ + 4,
          top: 初期y * セルサイズ,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-gray-500 mb-2">
          ({初期x}, {初期y}) に畝を追加
        </p>
        <input
          autoFocus
          type="text"
          placeholder="畝の名前"
          value={名前}
          onChange={(e) => 名前を設定する(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:outline-none focus:border-amber-500"
        />
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="text-xs text-gray-500">長さ（マス）</label>
            <input
              type="number"
              min={1}
              max={60}
              value={長さ}
              onChange={(e) => 長さを設定する(Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">向き</label>
            <select
              value={方向}
              onChange={(e) => 方向を設定する(e.target.value as 方向)}
              className="w-full border border-gray-300 rounded px-1 py-1 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="縦">縦</option>
              <option value="横">横</option>
            </select>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            type="submit"
            className="flex-1 bg-amber-600 text-white rounded py-1 text-sm hover:bg-amber-700"
          >
            追加
          </button>
          <button
            type="button"
            onClick={キャンセル}
            className="flex-1 border border-gray-300 rounded py-1 text-sm hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </>
  )
}
