import { useRef, useState } from "react";
import type { スケジュール } from "../../types";
import { スケジュール列幅 } from "../../utils/週変換";
import { プリセットストアを使う } from "../../store/プリセットストア";
import { タイムラインストアを使う } from "../../store/タイムラインストア";

type Props = {
  スケジュール一覧: スケジュール[];
  タイムラインid: string;
};

export const 野菜名ヘッダー = ({ スケジュール一覧, タイムラインid }: Props) => {
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const スケジュールを削除する = タイムラインストアを使う((s) => s.スケジュールを削除する);
  const スケジュール順序を変更する = タイムラインストアを使う((s) => s.スケジュール順序を変更する);

  const ドラッグ中インデックス = useRef<number | null>(null);
  const [ドロップ対象インデックス, ドロップ対象インデックスを設定する] = useState<number | null>(null);

  const dragStart = (i: number) => {
    ドラッグ中インデックス.current = i;
  };

  const dragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    ドロップ対象インデックスを設定する(i);
  };

  const dragEnd = () => {
    ドロップ対象インデックスを設定する(null);
  };

  const drop = (targetIndex: number) => {
    const from = ドラッグ中インデックス.current;
    ドラッグ中インデックス.current = null;
    ドロップ対象インデックスを設定する(null);

    if (from === null || from === targetIndex) return;

    const ids = スケジュール一覧.map((s) => s.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(targetIndex, 0, moved);
    スケジュール順序を変更する(タイムラインid, ids);
  };

  return (
    <div className="flex">
      {スケジュール一覧.map((schedule, i) => {
        const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
        const 野菜名 = 野菜?.名称 ?? "不明";
        const 野菜色 = 野菜?.色 ?? "#ccc";
        const ドロップハイライト = ドロップ対象インデックス === i;

        return (
          <div
            key={schedule.id}
            draggable
            onDragStart={() => dragStart(i)}
            onDragOver={(e) => dragOver(e, i)}
            onDragEnd={dragEnd}
            onDrop={() => drop(i)}
            className={`shrink-0 border-r border-gray-200 flex items-center justify-between px-1 text-xs bg-white cursor-grab select-none ${
              ドロップハイライト ? "border-l-2 border-l-blue-400" : ""
            }`}
            style={{ width: スケジュール列幅 }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: 野菜色 }}
              />
              <span className="truncate">{野菜名}</span>
            </div>
            <button
              className="text-gray-400 hover:text-red-500 shrink-0 ml-1 cursor-pointer"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => スケジュールを削除する(タイムラインid, schedule.id)}
              title="列を削除"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
};
