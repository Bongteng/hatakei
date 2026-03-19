import type { イベント } from "../../types";
import { 列幅, 週インデックスを表示列に変換する } from "../../utils/週変換";

type Props = {
  イベント: イベント;
  選択中: boolean;
  onClick: () => void;
  onDelete: () => void;
};

export const イベントバー = ({ イベント: ev, 選択中, onClick, onDelete }: Props) => {
  const 開始列 = 週インデックスを表示列に変換する(ev.開始週);
  const 終了列 = 週インデックスを表示列に変換する(ev.終了週);
  const left = 開始列 * 列幅;
  const width = (終了列 - 開始列 + 1) * 列幅;

  return (
    <div
      className={`absolute top-1 bottom-1 rounded cursor-pointer flex items-center px-1 text-xs select-none ${
        選択中
          ? "bg-white/80 ring-2 ring-blue-400"
          : "bg-white/60 hover:bg-white/75"
      }`}
      style={{ left, width }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span className="truncate text-gray-700">{ev.イベント名}</span>
      {選択中 && (
        <button
          className="ml-auto shrink-0 text-red-500 hover:text-red-700 font-bold text-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          x
        </button>
      )}
    </div>
  );
};
