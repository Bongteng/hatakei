import { useState } from "react";
import type { イベント, スケジュール } from "../../types";
import { イベントバー } from "./イベントバー";
import { 列幅, 週数合計, 週インデックスを表示列に変換する, X座標を表示列に変換する, 表示列を週インデックスに変換する, 月ヘッダー一覧を生成する } from "../../utils/週変換";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { プリセットストアを使う } from "../../store/プリセットストア";

const 月ヘッダー一覧 = 月ヘッダー一覧を生成する();
const 行数上限 = 3;
const 行高さ = 16;
const 行オフセット = 2;
const 行の高さpx = 行オフセット + 行数上限 * 行高さ + 2;

const イベントに行を割り当てる = (イベント一覧: イベント[]): Map<string, number> => {
  const ソート済み = [...イベント一覧].sort(
    (a, b) => 週インデックスを表示列に変換する(a.開始週) - 週インデックスを表示列に変換する(b.開始週)
  );
  const 行末尾列: number[] = Array(行数上限).fill(-1);
  const 割り当て = new Map<string, number>();

  for (const ev of ソート済み) {
    const 開始列 = 週インデックスを表示列に変換する(ev.開始週);
    const 終了列 = 週インデックスを表示列に変換する(ev.終了週);
    let 割り当て行 = 行末尾列.findIndex((末尾) => 末尾 < 開始列);
    if (割り当て行 === -1) 割り当て行 = 0;
    行末尾列[割り当て行] = 終了列;
    割り当て.set(ev.id, 割り当て行);
  }

  return 割り当て;
};

type Props = {
  スケジュール: スケジュール;
  タイムラインid: string;
  野菜名列幅: number;
  onイベント追加: (スケジュールid: string, 開始週: number) => void;
};

export const スケジュール行 = ({ スケジュール: schedule, タイムラインid, 野菜名列幅, onイベント追加 }: Props) => {
  const [選択イベントid, 選択イベントidを設定する] = useState<string | null>(null);
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const イベントを削除する = タイムラインストアを使う((s) => s.イベントを削除する);
  const イベントを更新する = タイムラインストアを使う((s) => s.イベントを更新する);
  const スケジュールを削除する = タイムラインストアを使う((s) => s.スケジュールを削除する);
  const 現在週 = タイムラインストアを使う((s) => s.現在週);
  const 現在列 = 週インデックスを表示列に変換する(現在週);

  const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
  const 野菜名 = 野菜?.名称 ?? "不明";
  const 野菜色 = 野菜?.色 ?? "#ccc";

  const イベント一覧 = schedule.イベント一覧;
  const 行割り当て = イベントに行を割り当てる(イベント一覧);

  const 帯表示 = イベント一覧.length > 0;
  const 最早開始列 = 帯表示
    ? Math.min(...イベント一覧.map((ev) => 週インデックスを表示列に変換する(ev.開始週)))
    : 0;
  const 最遅終了列 = 帯表示
    ? Math.max(...イベント一覧.map((ev) => 週インデックスを表示列に変換する(ev.終了週)))
    : 0;
  const 帯left = 最早開始列 * 列幅;
  const 帯width = (最遅終了列 - 最早開始列 + 1) * 列幅;

  const 行クリック = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const 表示列 = X座標を表示列に変換する(x);
    const 週 = 表示列を週インデックスに変換する(表示列);
    選択イベントidを設定する(null);
    onイベント追加(schedule.id, 週);
  };

  return (
    <div className="flex border-b border-gray-200">
      <div
        className="shrink-0 border-r border-gray-300 flex items-center justify-between px-2 text-sm bg-white sticky left-0 z-10"
        style={{ width: 野菜名列幅 }}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: 野菜色 }}
          />
          <span className="truncate">{野菜名}</span>
        </div>
        <button
          className="text-gray-400 hover:text-red-500 text-xs shrink-0 ml-1"
          onClick={() => スケジュールを削除する(タイムラインid, schedule.id)}
          title="行を削除"
        >
          x
        </button>
      </div>
      <div
        className="relative cursor-pointer"
        style={{
          width: 週数合計 * 列幅,
          height: 行の高さpx,
          backgroundColor: "#f9fafb",
        }}
        onClick={行クリック}
      >
        {/* 月境界線 */}
        {月ヘッダー一覧.map((月) => (
          <div
            key={月.ラベル}
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: 月.開始列 * 列幅 }}
          />
        ))}
        {/* 色付き帯（最早〜最遅イベント範囲） */}
        {帯表示 && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: 帯left,
              width: 帯width,
              backgroundColor: 野菜色 + "25",
            }}
          />
        )}
        {/* 現在週マーカー */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400/50"
          style={{ left: 現在列 * 列幅 + 列幅 / 2 }}
        />
        {/* イベントバー */}
        {イベント一覧.map((ev) => (
          <イベントバー
            key={ev.id}
            イベント={ev}
            行={行割り当て.get(ev.id) ?? 0}
            野菜色={野菜色}
            選択中={選択イベントid === ev.id}
            onClick={() =>
              選択イベントidを設定する(
                選択イベントid === ev.id ? null : ev.id
              )
            }
            onDelete={() => {
              イベントを削除する(タイムラインid, schedule.id, ev.id);
              選択イベントidを設定する(null);
            }}
            onMove={(新開始週, 新終了週) => {
              イベントを更新する(タイムラインid, schedule.id, ev.id, { 開始週: 新開始週, 終了週: 新終了週 });
            }}
          />
        ))}
      </div>
    </div>
  );
};
