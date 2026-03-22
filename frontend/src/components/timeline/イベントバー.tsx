import { useRef, useState } from "react";
import type { イベント } from "../../types";
import { 列幅, 週インデックスを表示列に変換する, 表示列を週インデックスに変換する, 週数合計 } from "../../utils/週変換";

const 行高さ = 16; // px per row
const 行オフセット = 2; // top padding
const リサイズハンドル幅 = 6; // px

type Props = {
  イベント: イベント;
  行: number;
  野菜色: string;
  選択中: boolean;
  onClick: () => void;
  onDelete: () => void;
  onMove: (新開始週: number, 新終了週: number) => void;
};

export const イベントバー = ({ イベント: ev, 行, 野菜色, 選択中, onClick, onDelete, onMove }: Props) => {
  const 開始列 = 週インデックスを表示列に変換する(ev.開始週);
  const 終了列 = 週インデックスを表示列に変換する(ev.終了週);
  const left = 開始列 * 列幅;
  const width = (終了列 - 開始列 + 1) * 列幅;
  const top = 行オフセット + 行 * 行高さ;
  const height = 行高さ - 2;

  // 移動用D&D
  const ドラッグ状態 = useRef<{
    開始X: number;
    元開始列: number;
    元終了列: number;
  } | null>(null);
  const [ドラッグオフセット, ドラッグオフセットを設定する] = useState(0);
  const [ドラッグ中, ドラッグ中を設定する] = useState(false);

  // リサイズ用D&D
  const リサイズ状態 = useRef<{
    開始X: number;
    元終了列: number;
  } | null>(null);
  const [リサイズオフセット, リサイズオフセットを設定する] = useState(0);
  const [リサイズ中, リサイズ中を設定する] = useState(false);

  const mouseDown = (e: React.MouseEvent) => {
    if (選択中) return;
    e.stopPropagation();
    e.preventDefault();

    ドラッグ状態.current = {
      開始X: e.clientX,
      元開始列: 開始列,
      元終了列: 終了列,
    };
    ドラッグ中を設定する(true);
    ドラッグオフセットを設定する(0);

    const onMouseMove = (me: MouseEvent) => {
      if (!ドラッグ状態.current) return;
      const dx = me.clientX - ドラッグ状態.current.開始X;
      ドラッグオフセットを設定する(Math.round(dx / 列幅) * 列幅);
    };

    const onMouseUp = (me: MouseEvent) => {
      if (!ドラッグ状態.current) return;
      const dx = me.clientX - ドラッグ状態.current.開始X;
      const オフセット列 = Math.round(dx / 列幅);

      if (オフセット列 !== 0) {
        const { 元開始列, 元終了列 } = ドラッグ状態.current;
        const 期間 = 元終了列 - 元開始列;
        const 新開始列 = Math.max(0, Math.min(元開始列 + オフセット列, 週数合計 - 1 - 期間));
        const 新終了列 = 新開始列 + 期間;
        onMove(
          表示列を週インデックスに変換する(新開始列),
          表示列を週インデックスに変換する(新終了列),
        );
      }

      ドラッグ状態.current = null;
      ドラッグ中を設定する(false);
      ドラッグオフセットを設定する(0);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const リサイズmouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    リサイズ状態.current = {
      開始X: e.clientX,
      元終了列: 終了列,
    };
    リサイズ中を設定する(true);
    リサイズオフセットを設定する(0);

    const onMouseMove = (me: MouseEvent) => {
      if (!リサイズ状態.current) return;
      const dx = me.clientX - リサイズ状態.current.開始X;
      リサイズオフセットを設定する(Math.round(dx / 列幅) * 列幅);
    };

    const onMouseUp = (me: MouseEvent) => {
      if (!リサイズ状態.current) return;
      const dx = me.clientX - リサイズ状態.current.開始X;
      const オフセット列 = Math.round(dx / 列幅);

      if (オフセット列 !== 0) {
        const { 元終了列 } = リサイズ状態.current;
        const 新終了列 = Math.max(開始列, Math.min(元終了列 + オフセット列, 週数合計 - 1));
        onMove(
          表示列を週インデックスに変換する(開始列),
          表示列を週インデックスに変換する(新終了列),
        );
      }

      リサイズ状態.current = null;
      リサイズ中を設定する(false);
      リサイズオフセットを設定する(0);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const 表示width = リサイズ中 ? Math.max(列幅, width + リサイズオフセット) : width;

  return (
    <div
      className={`absolute rounded text-xs select-none flex items-center ${
        ドラッグ中 ? "shadow-lg z-20 opacity-90" : ""
      } ${リサイズ中 ? "z-20" : ""} ${
        選択中 ? "ring-2 ring-blue-400 z-10" : ""
      }`}
      style={{
        left: left + ドラッグオフセット,
        top,
        width: 表示width,
        height,
        backgroundColor: 野菜色 + "cc",
        cursor: ドラッグ中 ? "grabbing" : "grab",
      }}
      onMouseDown={mouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!ドラッグ中 && !リサイズ中) onClick();
      }}
    >
      {/* バツボタン（左端） */}
      {選択中 && (
        <button
          className="shrink-0 text-white/80 hover:text-white font-bold text-sm px-0.5 leading-none"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          x
        </button>
      )}
      <span className="truncate text-white drop-shadow-sm px-1">{ev.イベント名}</span>

      {/* リサイズハンドル（右端） */}
      <div
        className="absolute top-0 bottom-0 right-0 flex items-center justify-center hover:bg-white/20"
        style={{ width: リサイズハンドル幅, cursor: "ew-resize" }}
        onMouseDown={リサイズmouseDown}
      >
        <div className="w-0.5 h-2/3 rounded-full bg-white/60" />
      </div>
    </div>
  );
};
