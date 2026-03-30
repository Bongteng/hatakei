import { useRef, useState } from "react";
import type { イベント } from "../../types";
import { 行高さ, 週インデックスを表示行に変換する, 週数合計 } from "../../utils/週変換";

const リサイズハンドル高さ = 6;

type Props = {
  イベント: イベント;
  サブ列: number;
  使用サブ列数: number;
  開始週インデックス: number;
  野菜色: string;
  onOpen: (e: React.MouseEvent, イベント: イベント) => void;
  onMove: (新開始週: number, 新終了週: number) => void;
};

export const イベントバー = ({
  イベント: ev,
  サブ列,
  使用サブ列数,
  開始週インデックス,
  野菜色,
  onOpen,
  onMove,
}: Props) => {
  const 開始行 = 週インデックスを表示行に変換する(ev.開始週, 開始週インデックス);
  const 終了行 = 週インデックスを表示行に変換する(ev.終了週, 開始週インデックス);
  const サブ列幅 = Math.floor(120 / 使用サブ列数); // スケジュール列幅 / 使用サブ列数
  const top = 開始行 * 行高さ;
  const height = (終了行 - 開始行 + 1) * 行高さ;
  const left = サブ列 * サブ列幅 + 1;
  const width = サブ列幅 - 2;

  // 移動D&D
  const ドラッグ状態 = useRef<{
    開始Y: number;
    元開始行: number;
    元終了行: number;
  } | null>(null);
  const [ドラッグオフセット, ドラッグオフセットを設定する] = useState(0);
  const [ドラッグ中, ドラッグ中を設定する] = useState(false);
  const 操作済み = useRef(false);

  // リサイズ（下端）
  const リサイズ状態 = useRef<{
    開始Y: number;
    元終了行: number;
  } | null>(null);
  const [リサイズオフセット, リサイズオフセットを設定する] = useState(0);
  const [リサイズ中, リサイズ中を設定する] = useState(false);

  const mouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    ドラッグ状態.current = { 開始Y: e.clientY, 元開始行: 開始行, 元終了行: 終了行 };
    ドラッグ中を設定する(true);
    ドラッグオフセットを設定する(0);

    const onMouseMove = (me: MouseEvent) => {
      if (!ドラッグ状態.current) return;
      const dy = me.clientY - ドラッグ状態.current.開始Y;
      ドラッグオフセットを設定する(Math.round(dy / 行高さ) * 行高さ);
    };

    const onMouseUp = (me: MouseEvent) => {
      if (!ドラッグ状態.current) return;
      const dy = me.clientY - ドラッグ状態.current.開始Y;
      const オフセット行 = Math.round(dy / 行高さ);

      if (オフセット行 !== 0) {
        操作済み.current = true;
        const { 元開始行, 元終了行 } = ドラッグ状態.current;
        const 期間 = 元終了行 - 元開始行;
        const 新開始行 = Math.max(0, Math.min(元開始行 + オフセット行, 週数合計 - 1 - 期間));
        const 新終了行 = 新開始行 + 期間;
        onMove(新開始行 + 開始週インデックス, 新終了行 + 開始週インデックス);
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

    リサイズ状態.current = { 開始Y: e.clientY, 元終了行: 終了行 };
    リサイズ中を設定する(true);
    リサイズオフセットを設定する(0);

    const onMouseMove = (me: MouseEvent) => {
      if (!リサイズ状態.current) return;
      const dy = me.clientY - リサイズ状態.current.開始Y;
      リサイズオフセットを設定する(Math.round(dy / 行高さ) * 行高さ);
    };

    const onMouseUp = (me: MouseEvent) => {
      if (!リサイズ状態.current) return;
      const dy = me.clientY - リサイズ状態.current.開始Y;
      const オフセット行 = Math.round(dy / 行高さ);

      if (オフセット行 !== 0) {
        操作済み.current = true;
        const { 元終了行 } = リサイズ状態.current;
        const 新終了行 = Math.max(開始行, Math.min(元終了行 + オフセット行, 週数合計 - 1));
        onMove(開始行 + 開始週インデックス, 新終了行 + 開始週インデックス);
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

  const 表示top = top + ドラッグオフセット;
  const 表示height = リサイズ中 ? Math.max(行高さ, height + リサイズオフセット) : height;

  return (
    <div
      className={`absolute rounded text-xs select-none flex flex-col overflow-hidden ${
        ドラッグ中 ? "shadow-lg z-20 opacity-90" : ""
      } ${リサイズ中 ? "z-20" : ""}`}
      style={{
        top: 表示top,
        height: 表示height,
        left,
        width,
        backgroundColor: 野菜色 + "cc",
        cursor: ドラッグ中 ? "grabbing" : "grab",
      }}
      onMouseDown={mouseDown}
      onClick={(e) => {
        e.stopPropagation();
        if (操作済み.current) {
          操作済み.current = false;
          return;
        }
        onOpen(e, ev);
      }}
    >
      <span className="break-words text-white drop-shadow-sm px-0.5 text-center leading-tight flex-1 overflow-hidden">
        {ev.イベント名}
      </span>

      {/* リサイズハンドル（下端） */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center hover:bg-white/20"
        style={{ height: リサイズハンドル高さ, cursor: "ns-resize" }}
        onMouseDown={リサイズmouseDown}
      >
        <div className="h-0.5 w-2/3 rounded-full bg-white/60" />
      </div>
    </div>
  );
};
