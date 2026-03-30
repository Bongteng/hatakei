import { useEffect, useCallback, useRef } from "react";
import { テンプレートストアを使う } from "../../store/テンプレートストア";
import { テンプレートカード } from "./テンプレートカード";
import type { テンプレート応答 } from "../../types";

type Props = {
  onSelect: (テンプレート: テンプレート応答) => void;
  onCancel: () => void;
  on野菜から追加: () => void;
};

export const テンプレート一覧パネル = ({ onSelect, onCancel, on野菜から追加 }: Props) => {
  const テンプレート一覧 = テンプレートストアを使う((s) => s.テンプレート一覧);
  const 読み込み中 = テンプレートストアを使う((s) => s.読み込み中);
  const 検索キーワード = テンプレートストアを使う((s) => s.検索キーワード);
  const ソート = テンプレートストアを使う((s) => s.ソート);
  const テンプレートを取得する = テンプレートストアを使う((s) => s.テンプレートを取得する);
  const 検索キーワードを設定する = テンプレートストアを使う((s) => s.検索キーワードを設定する);
  const ソートを設定する = テンプレートストアを使う((s) => s.ソートを設定する);
  const いいねを切り替える = テンプレートストアを使う((s) => s.いいねを切り替える);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    テンプレートを取得する();
  }, [テンプレートを取得する]);

  const キーワード変更時 = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      検索キーワードを設定する(e.target.value);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        テンプレートを取得する();
      }, 300);
    },
    [検索キーワードを設定する, テンプレートを取得する]
  );

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-96 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-bold mb-3">テンプレートから追加</h3>

          {/* 検索バー */}
          <div className="mb-2">
            <input
              type="text"
              placeholder="野菜名・テンプレート名で検索"
              value={検索キーワード}
              onChange={キーワード変更時}
              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          {/* ソート */}
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => {
                ソートを設定する("likes");
                テンプレートを取得する();
              }}
              className={`px-2 py-0.5 rounded ${
                ソート === "likes"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              人気順
            </button>
            <button
              onClick={() => {
                ソートを設定する("newest");
                テンプレートを取得する();
              }}
              className={`px-2 py-0.5 rounded ${
                ソート === "newest"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              新着順
            </button>
            <button
              onClick={() => {
                ソートを設定する("timing");
                テンプレートを取得する();
              }}
              className={`px-2 py-0.5 rounded ${
                ソート === "timing"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              開始時期順
            </button>
            <button
              onClick={() => {
                ソートを設定する("kana");
                テンプレートを取得する();
              }}
              className={`px-2 py-0.5 rounded ${
                ソート === "kana"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              五十音順
            </button>
          </div>
        </div>

        {/* テンプレート一覧 */}
        <div className="flex-1 overflow-y-auto p-2">
          {読み込み中 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              読み込み中...
            </div>
          ) : テンプレート一覧.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">
              テンプレートがありません
            </div>
          ) : (
            テンプレート一覧.map((t) => (
              <テンプレートカード
                key={t.id}
                テンプレート={t}
                onSelect={() => onSelect(t)}
                onいいね={() => いいねを切り替える(t.id)}
              />
            ))
          )}
        </div>

        {/* フッター */}
        <div className="p-3 border-t border-gray-200 flex flex-col gap-2">
          <button
            onClick={on野菜から追加}
            className="w-full text-sm text-blue-500 hover:text-blue-700"
          >
            野菜を選んで空のスケジュールを追加
          </button>
          <button
            onClick={onCancel}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
