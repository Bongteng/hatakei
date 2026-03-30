import { useRef, useState } from "react";
import type { スケジュール, イベント } from "../../types";
import { スケジュール列幅 } from "../../utils/週変換";
import { プリセットストアを使う } from "../../store/プリセットストア";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { カレンダー色一覧 } from "../../utils/カレンダー色";

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type ポップアップ状態 = {
  スケジュールid: string;
  野菜id: string;
  名称: string;
  色: string;
  インデックス: number;
};

type Props = {
  スケジュール一覧: スケジュール[];
  タイムラインid: string;
};

export const 野菜名ヘッダー = ({ スケジュール一覧, タイムラインid }: Props) => {
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const 野菜を更新する = プリセットストアを使う((s) => s.野菜を更新する);
  const スケジュールを削除する = タイムラインストアを使う((s) => s.スケジュールを削除する);
  const スケジュール順序を変更する = タイムラインストアを使う((s) => s.スケジュール順序を変更する);

  const ドラッグ中インデックス = useRef<number | null>(null);
  const [ドロップ対象インデックス, ドロップ対象インデックスを設定する] = useState<number | null>(null);
  const [ポップアップ, ポップアップを設定する] = useState<ポップアップ状態 | null>(null);
  const [反映中, 反映中を設定する] = useState(false);

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

  const ヘッダーをクリック = (e: React.MouseEvent, schedule: スケジュール, index: number) => {
    e.stopPropagation();
    const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
    ポップアップを設定する({
      スケジュールid: schedule.id,
      野菜id: schedule.野菜id,
      名称: 野菜?.名称 ?? "不明",
      色: 野菜?.色 ?? "#888888",
      インデックス: index,
    });
  };

  const ポップアップを閉じる = () => ポップアップを設定する(null);

  const 変更を保存する = async () => {
    if (!ポップアップ) return;
    await 野菜を更新する(ポップアップ.野菜id, { 名称: ポップアップ.名称, 色: ポップアップ.色 });
    ポップアップを閉じる();
  };

  const テンプレートに反映する = async () => {
    if (!ポップアップ) return;
    const schedule = スケジュール一覧.find((s) => s.id === ポップアップ.スケジュールid);
    if (!schedule) return;

    反映中を設定する(true);
    try {
      // まず野菜の色・名前を更新
      await 野菜を更新する(ポップアップ.野菜id, { 名称: ポップアップ.名称, 色: ポップアップ.色 });

      // 同名テンプレートを検索
      const 検索結果 = await fetch(
        `${APIのベースURL}/api/templates?q=${encodeURIComponent(ポップアップ.名称)}`,
        { credentials: "include" }
      );
      const テンプレート一覧 = await 検索結果.json() as { id: string; テンプレート名: string }[];
      const 対象テンプレート = テンプレート一覧.find((t) => t.テンプレート名 === ポップアップ.名称);

      if (!対象テンプレート) {
        alert(`「${ポップアップ.名称}」と同名のテンプレートが見つかりません`);
        return;
      }

      const イベント一覧: Omit<イベント, "id">[] = schedule.イベント一覧.map((ev) => ({
        イベント名: ev.イベント名,
        開始週: ev.開始週,
        終了週: ev.終了週,
      }));

      await fetch(`${APIのベースURL}/api/templates/${対象テンプレート.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          テンプレート名: ポップアップ.名称,
          説明文: "",
          イベント一覧,
          タグ一覧: [],
        }),
      });

      ポップアップを閉じる();
    } finally {
      反映中を設定する(false);
    }
  };

  return (
    <div className="flex relative">
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
            onClick={(e) => ヘッダーをクリック(e, schedule, i)}
            className={`shrink-0 border-r border-gray-200 flex items-center justify-center px-1 text-xs bg-white cursor-pointer select-none ${
              ドロップハイライト ? "border-l-2 border-l-blue-400" : ""
            }`}
            style={{ width: スケジュール列幅 }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: 野菜色 }}
              />
              <span className="break-words text-center leading-tight">{野菜名}</span>
            </div>
          </div>
        );
      })}

      {/* ポップアップ */}
      {ポップアップ && (
        <>
          {/* オーバーレイ（クリックで閉じる） */}
          <div
            className="fixed inset-0 z-40"
            onClick={ポップアップを閉じる}
          />
          <div
            className="absolute top-full z-50 bg-white border border-gray-200 rounded shadow-lg p-3 w-52"
            style={{ left: ポップアップ.インデックス * スケジュール列幅 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              {/* 色（固定色パレット） */}
              <div className="text-xs text-gray-600 mb-1">色</div>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {カレンダー色一覧.map((色) => (
                  <button
                    key={色.id}
                    title={色.名前}
                    onClick={() => ポップアップを設定する({ ...ポップアップ, 色: 色.コード })}
                    className="w-5 h-5 rounded-full border-2 cursor-pointer"
                    style={{
                      backgroundColor: 色.コード,
                      borderColor: ポップアップ.色 === 色.コード ? "#1d4ed8" : "transparent",
                    }}
                  />
                ))}
              </div>
              {/* 名前 */}
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-8">名前</span>
                <input
                  type="text"
                  value={ポップアップ.名称}
                  onChange={(e) => ポップアップを設定する({ ...ポップアップ, 名称: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-xs"
                />
              </label>
              {/* 保存ボタン */}
              <button
                onClick={変更を保存する}
                className="text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 cursor-pointer"
              >
                保存
              </button>
              {/* テンプレートに反映 */}
              <button
                onClick={テンプレートに反映する}
                disabled={反映中}
                className="text-xs bg-green-500 text-white rounded px-2 py-1 hover:bg-green-600 disabled:opacity-50 cursor-pointer"
              >
                {反映中 ? "反映中..." : "テンプレートに反映"}
              </button>
              {/* 削除 */}
              <button
                onClick={() => {
                  スケジュールを削除する(タイムラインid, ポップアップ.スケジュールid);
                  ポップアップを閉じる();
                }}
                className="text-xs text-red-500 hover:text-red-700 text-left cursor-pointer"
              >
                この列を削除
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
