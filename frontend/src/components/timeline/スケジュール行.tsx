import { useState } from "react";
import type { スケジュール } from "../../types";
import { イベントバー } from "./イベントバー";
import { 列幅, 週数合計, 週インデックスを表示列に変換する, X座標を表示列に変換する, 表示列を週インデックスに変換する, 月ヘッダー一覧を生成する } from "../../utils/週変換";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { プリセットストアを使う } from "../../store/プリセットストア";

const 月ヘッダー一覧 = 月ヘッダー一覧を生成する();

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
  const スケジュールを削除する = タイムラインストアを使う((s) => s.スケジュールを削除する);
  const 現在週 = タイムラインストアを使う((s) => s.現在週);
  const 現在列 = 週インデックスを表示列に変換する(現在週);

  const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
  const 野菜名 = 野菜?.名称 ?? "不明";
  const 野菜色 = 野菜?.色 ?? "#ccc";

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
        className="relative h-10 cursor-pointer"
        style={{
          width: 週数合計 * 列幅,
          backgroundColor: 野菜色 + "20",
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
        {/* 現在週マーカー */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400/50"
          style={{ left: 現在列 * 列幅 + 列幅 / 2 }}
        />
        {/* イベントバー */}
        {schedule.イベント一覧.map((ev) => (
          <イベントバー
            key={ev.id}
            イベント={ev}
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
          />
        ))}
      </div>
    </div>
  );
};
