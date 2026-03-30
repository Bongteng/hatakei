import { useState } from "react";
import type { イベント, スケジュール } from "../../types";
import { イベントバー } from "./イベントバー";
import {
  行高さ, スケジュール列幅, 週数合計,
  週インデックスを表示行に変換する, 表示行を週インデックスに変換する,
  Y座標を表示行に変換する, 月ヘッダー一覧を生成する,
} from "../../utils/週変換";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { プリセットストアを使う } from "../../store/プリセットストア";

const サブ列数上限 = 3;

const イベントにサブ列を割り当てる = (
  イベント一覧: イベント[],
  開始週インデックス: number,
): Map<string, number> => {
  const ソート済み = [...イベント一覧].sort(
    (a, b) => 週インデックスを表示行に変換する(a.開始週, 開始週インデックス)
      - 週インデックスを表示行に変換する(b.開始週, 開始週インデックス)
  );
  const 列末尾行: number[] = Array(サブ列数上限).fill(-1);
  const 割り当て = new Map<string, number>();

  for (const ev of ソート済み) {
    const 開始行 = 週インデックスを表示行に変換する(ev.開始週, 開始週インデックス);
    const 終了行 = 週インデックスを表示行に変換する(ev.終了週, 開始週インデックス);
    let 割り当て列 = 列末尾行.findIndex((末尾) => 末尾 < 開始行);
    if (割り当て列 === -1) 割り当て列 = 0;
    列末尾行[割り当て列] = 終了行;
    割り当て.set(ev.id, 割り当て列);
  }

  return 割り当て;
};

type コメントポップアップ状態 = {
  イベントid: string;
  イベント名: string;
  コメント: string;
  x: number;
  y: number;
};

type Props = {
  スケジュール: スケジュール;
  タイムラインid: string;
  開始週インデックス: number;
  表示開始年: number;
  表示開始月: number;
  onイベント追加: (スケジュールid: string, 開始週: number) => void;
};

export const スケジュール列 = ({
  スケジュール: schedule,
  タイムラインid,
  開始週インデックス,
  表示開始年,
  表示開始月,
  onイベント追加,
}: Props) => {
  const [コメントポップアップ, コメントポップアップを設定する] = useState<コメントポップアップ状態 | null>(null);
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const イベントを削除する = タイムラインストアを使う((s) => s.イベントを削除する);
  const イベントを更新する = タイムラインストアを使う((s) => s.イベントを更新する);
  const 現在週 = タイムラインストアを使う((s) => s.現在週);

  const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
  const 野菜色 = 野菜?.色 ?? "#ccc";

  const 現在行 = 週インデックスを表示行に変換する(現在週, 開始週インデックス);

  // 表示範囲内のイベントのみ
  const 表示対象イベント = schedule.イベント一覧.filter((ev) => {
    const 開始行 = 週インデックスを表示行に変換する(ev.開始週, 開始週インデックス);
    const 終了行 = 週インデックスを表示行に変換する(ev.終了週, 開始週インデックス);
    return 終了行 >= 0 && 開始行 < 週数合計;
  });

  const サブ列割り当て = イベントにサブ列を割り当てる(表示対象イベント, 開始週インデックス);
  const 使用サブ列数 = 表示対象イベント.length === 0
    ? 1
    : Math.max(...Array.from(サブ列割り当て.values())) + 1;

  const 月ヘッダー一覧 = 月ヘッダー一覧を生成する(表示開始年, 表示開始月);

  // 色付き帯: 最早イベント開始行〜最遅イベント終了行
  const 帯あり = 表示対象イベント.length > 0;
  const 帯開始行 = 帯あり
    ? Math.max(0, Math.min(...表示対象イベント.map((ev) => 週インデックスを表示行に変換する(ev.開始週, 開始週インデックス))))
    : 0;
  const 帯終了行 = 帯あり
    ? Math.min(週数合計 - 1, Math.max(...表示対象イベント.map((ev) => 週インデックスを表示行に変換する(ev.終了週, 開始週インデックス))))
    : 0;

  const 列クリック = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const 表示行 = Y座標を表示行に変換する(y);
    const 週 = 表示行を週インデックスに変換する(
      Math.max(0, Math.min(表示行, 週数合計 - 1)),
      開始週インデックス,
    );
    コメントポップアップを設定する(null);
    onイベント追加(schedule.id, 週);
  };

  const バーを開く = (e: React.MouseEvent, ev: イベント) => {
    コメントポップアップを設定する({
      イベントid: ev.id,
      イベント名: ev.イベント名,
      コメント: ev.コメント ?? "",
      x: e.clientX,
      y: e.clientY,
    });
  };

  const コメントを保存する = () => {
    if (!コメントポップアップ) return;
    イベントを更新する(タイムラインid, schedule.id, コメントポップアップ.イベントid, {
      コメント: コメントポップアップ.コメント || null,
    });
    コメントポップアップを設定する(null);
  };

  const イベントを削除してポップアップを閉じる = () => {
    if (!コメントポップアップ) return;
    イベントを削除する(タイムラインid, schedule.id, コメントポップアップ.イベントid);
    コメントポップアップを設定する(null);
  };

  return (
    <>
      <div
        className="relative shrink-0 border-r border-gray-200 cursor-pointer"
        style={{
          width: スケジュール列幅,
          height: 週数合計 * 行高さ,
          backgroundColor: "#f9fafb",
        }}
        onClick={列クリック}
      >
        {/* 色付き帯（最早〜最遅イベント範囲） */}
        {帯あり && (
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: 帯開始行 * 行高さ,
              height: (帯終了行 - 帯開始行 + 1) * 行高さ,
              backgroundColor: 野菜色 + "25",
            }}
          />
        )}
        {/* 月境界線（水平線） */}
        {月ヘッダー一覧.map((月) => (
          <div
            key={月.ラベル}
            className="absolute left-0 right-0 border-t border-gray-200"
            style={{ top: 月.開始行 * 行高さ }}
          />
        ))}
        {/* 週区切り線（薄い水平線） */}
        {Array.from({ length: 週数合計 }, (_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ top: i * 行高さ }}
          />
        ))}
        {/* 現在週マーカー（水平線） */}
        {現在行 >= 0 && 現在行 < 週数合計 && (
          <div
            className="absolute left-0 right-0 border-t-2 border-red-400/60 z-10"
            style={{ top: 現在行 * 行高さ + 行高さ / 2 }}
          />
        )}
        {/* イベントバー（縦） */}
        {表示対象イベント.map((ev) => (
          <イベントバー
            key={ev.id}
            イベント={ev}
            サブ列={サブ列割り当て.get(ev.id) ?? 0}
            使用サブ列数={使用サブ列数}
            開始週インデックス={開始週インデックス}
            野菜色={野菜色}
            onOpen={バーを開く}
            onMove={(新開始週, 新終了週) => {
              イベントを更新する(タイムラインid, schedule.id, ev.id, { 開始週: 新開始週, 終了週: 新終了週 });
            }}
          />
        ))}
      </div>

      {/* コメントポップアップ（fixed） */}
      {コメントポップアップ && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => コメントポップアップを設定する(null)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg p-3 w-64"
            style={{
              left: Math.min(コメントポップアップ.x + 8, window.innerWidth - 272),
              top: Math.min(コメントポップアップ.y + 8, window.innerHeight - 220),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-semibold text-gray-700 mb-2 truncate">
              {コメントポップアップ.イベント名}
            </div>
            <textarea
              className="w-full border border-gray-300 rounded px-2 py-1 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
              rows={5}
              maxLength={1000}
              placeholder="コメントを入力..."
              value={コメントポップアップ.コメント}
              onChange={(e) =>
                コメントポップアップを設定する({ ...コメントポップアップ, コメント: e.target.value })
              }
              autoFocus
            />
            <div className="text-right text-xs text-gray-400 mb-2">
              {コメントポップアップ.コメント.length} / 1000
            </div>
            <div className="flex justify-between">
              <button
                className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                onClick={イベントを削除してポップアップを閉じる}
              >
                削除
              </button>
              <div className="flex gap-2">
                <button
                  className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                  onClick={() => コメントポップアップを設定する(null)}
                >
                  キャンセル
                </button>
                <button
                  className="text-xs bg-blue-500 text-white rounded px-2 py-0.5 hover:bg-blue-600 cursor-pointer"
                  onClick={コメントを保存する}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
