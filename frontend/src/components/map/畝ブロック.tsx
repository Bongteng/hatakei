import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import type { 畝 } from '../../types'
import { マップストアを使う } from '../../store/マップストア'

type Props = {
  畝: 畝
  セルサイズ: number
}

export const 畝ブロック = ({ 畝: 畝データ, セルサイズ }: Props) => {
  const { 畝を更新する, 畝を削除する } = マップストアを使う()
  const [メニュー表示, メニュー表示を設定する] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 畝データ.id,
  })

  const 幅 = (畝データ.方向 === '横' ? 畝データ.長さ : 1) * セルサイズ
  const 高さ = (畝データ.方向 === '縦' ? 畝データ.長さ : 1) * セルサイズ

  const 右クリックを処理する = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    メニュー表示を設定する(true)
  }

  const 回転する = () => {
    畝を更新する(畝データ.id, { 方向: 畝データ.方向 === '横' ? '縦' : '横' })
    メニュー表示を設定する(false)
  }

  const 削除する = () => {
    畝を削除する(畝データ.id)
    メニュー表示を設定する(false)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        data-bed="true"
        {...listeners}
        {...attributes}
        onContextMenu={右クリックを処理する}
        style={{
          position: 'absolute',
          left: 畝データ.x * セルサイズ,
          top: 畝データ.y * セルサイズ,
          width: 幅,
          height: 高さ,
          transform: CSS.Translate.toString(transform),
          zIndex: isDragging ? 50 : 10,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        className={`
          bg-amber-700 border border-amber-900 rounded-sm
          flex items-center justify-center
          select-none text-white
          ${isDragging ? 'opacity-70 shadow-lg' : 'hover:brightness-110'}
        `}
        title={畝データ.名前}
      >
        <span
          className="text-xs font-medium truncate px-1"
          style={{
            writingMode: 畝データ.方向 === '縦' ? 'vertical-rl' : 'horizontal-tb',
            fontSize: Math.max(8, セルサイズ * 0.6),
          }}
        >
          {畝データ.名前}
        </span>
      </div>

      {メニュー表示 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => メニュー表示を設定する(false)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded shadow-md py-1 min-w-28"
            style={{
              left: 畝データ.x * セルサイズ + 幅 + 4,
              top: 畝データ.y * セルサイズ,
            }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100"
              onClick={回転する}
            >
              回転
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-gray-100"
              onClick={削除する}
            >
              削除
            </button>
          </div>
        </>
      )}
    </>
  )
}
