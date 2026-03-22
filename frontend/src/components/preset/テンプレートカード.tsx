import type { テンプレート応答 } from "../../types";
import { テンプレートプレビュー } from "./テンプレートプレビュー";

type Props = {
  テンプレート: テンプレート応答;
  onSelect: () => void;
  onいいね: () => void;
};

export const テンプレートカード = ({
  テンプレート,
  onSelect,
  onいいね,
}: Props) => {
  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 hover:border-blue-300 transition-colors">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: テンプレート.野菜色 }}
        />
        <span className="text-sm font-medium truncate">
          {テンプレート.テンプレート名}
        </span>
        <span className="text-xs text-gray-400 ml-auto shrink-0">
          {テンプレート.野菜名称}
        </span>
      </div>

      {/* 説明文 */}
      {テンプレート.説明文 && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {テンプレート.説明文}
        </p>
      )}

      {/* イベントプレビュー */}
      {テンプレート.イベント一覧.length > 0 && (
        <テンプレートプレビュー
          イベント一覧={テンプレート.イベント一覧}
          野菜色={テンプレート.野菜色}
        />
      )}

      {/* タグ */}
      {テンプレート.タグ一覧.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {テンプレート.タグ一覧.map((タグ) => (
            <span
              key={タグ}
              className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
            >
              {タグ}
            </span>
          ))}
        </div>
      )}

      {/* フッター */}
      <div className="flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onいいね();
          }}
          className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded ${
            テンプレート.いいね済み
              ? "text-red-500 bg-red-50"
              : "text-gray-400 hover:text-red-400"
          }`}
        >
          {テンプレート.いいね済み ? "♥" : "♡"} {テンプレート.いいね数}
        </button>

        <button
          onClick={onSelect}
          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          追加
        </button>
      </div>
    </div>
  );
};
