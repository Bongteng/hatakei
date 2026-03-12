import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { useRef, useState } from 'react'
import { マップストアを使う } from '../../store/マップストア'
import type { 方向 } from '../../types'
import { 畝ブロック } from './畝ブロック'
import { 畝追加ダイアログ } from './畝追加ダイアログ'

const セルサイズ = 16
const グリッドマス数 = 60

type ダイアログ状態 = { x: number; y: number } | null

export const マップグリッド = () => {
  const { 畝一覧, 畝を追加する, 畝を更新する } = マップストアを使う()
  const [ダイアログ, ダイアログを設定する] = useState<ダイアログ状態>(null)
  const グリッドRef = useRef<HTMLDivElement>(null)

  const センサー = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const ドラッグ終了を処理する = (event: DragEndEvent) => {
    const { active, delta } = event
    const 対象の畝 = 畝一覧.find((畝) => 畝.id === active.id)
    if (!対象の畝) return

    const 新しいx = Math.round(対象の畝.x + delta.x / セルサイズ)
    const 新しいy = Math.round(対象の畝.y + delta.y / セルサイズ)
    const 収まるx = Math.max(0, Math.min(グリッドマス数 - 1, 新しいx))
    const 収まるy = Math.max(0, Math.min(グリッドマス数 - 1, 新しいy))

    畝を更新する(対象の畝.id, { x: 収まるx, y: 収まるy })
  }

  const グリッドをクリックした = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-bed]')) return
    if (!グリッドRef.current) return

    const 矩形 = グリッドRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - 矩形.left) / セルサイズ)
    const y = Math.floor((e.clientY - 矩形.top) / セルサイズ)

    if (x < 0 || x >= グリッドマス数 || y < 0 || y >= グリッドマス数) return
    ダイアログを設定する({ x, y })
  }

  const 畝を確定する = (名前: string, 長さ: number, 方向: 方向) => {
    if (!ダイアログ) return
    畝を追加する({ 名前, 長さ, 方向, x: ダイアログ.x, y: ダイアログ.y })
    ダイアログを設定する(null)
  }

  const グリッドの幅 = グリッドマス数 * セルサイズ
  const グリッドの高さ = グリッドマス数 * セルサイズ

  return (
    <div className="w-full h-full overflow-auto bg-gray-100">
      <DndContext sensors={センサー} onDragEnd={ドラッグ終了を処理する}>
        <div
          ref={グリッドRef}
          onClick={グリッドをクリックした}
          style={{
            position: 'relative',
            width: グリッドの幅,
            height: グリッドの高さ,
            backgroundImage: `
              linear-gradient(to right, #d1d5db 1px, transparent 1px),
              linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
            `,
            backgroundSize: `${セルサイズ}px ${セルサイズ}px`,
            backgroundColor: '#f9fafb',
            cursor: 'crosshair',
          }}
        >
          {畝一覧.map((畝) => (
            <畝ブロック key={畝.id} 畝={畝} セルサイズ={セルサイズ} />
          ))}

          {ダイアログ && (
            <畝追加ダイアログ
              初期x={ダイアログ.x}
              初期y={ダイアログ.y}
              確定={畝を確定する}
              キャンセル={() => ダイアログを設定する(null)}
              セルサイズ={セルサイズ}
            />
          )}
        </div>
      </DndContext>
    </div>
  )
}
