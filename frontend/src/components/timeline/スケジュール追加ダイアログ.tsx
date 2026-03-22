import { useState, useRef, useEffect } from "react";
import { プリセットストアを使う } from "../../store/プリセットストア";
import { カレンダー色一覧 } from "../../utils/カレンダー色";

type Props = {
  onSelect: (野菜id: string) => void;
  onCancel: () => void;
};

export const スケジュール追加ダイアログ = ({ onSelect, onCancel }: Props) => {
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const カスタム野菜を追加する = プリセットストアを使う((s) => s.カスタム野菜を追加する);

  const [名称, 名称を設定する] = useState("");
  const [選択色, 選択色を設定する] = useState(カレンダー色一覧[0].コード);
  const [プルダウン表示, プルダウン表示を設定する] = useState(false);
  const [選択済み野菜id, 選択済み野菜idを設定する] = useState<string | null>(null);
  const 入力欄Ref = useRef<HTMLInputElement>(null);

  const 候補一覧 = 名称
    ? 野菜一覧.filter((v) => v.名称.startsWith(名称))
    : 野菜一覧;

  const 名称変更時 = (値: string) => {
    名称を設定する(値);
    選択済み野菜idを設定する(null);
    プルダウン表示を設定する(true);
  };

  const 候補を選択する = (野菜id: string) => {
    const 野菜 = 野菜一覧.find((v) => v.id === 野菜id);
    if (!野菜) return;
    名称を設定する(野菜.名称);
    選択色を設定する(野菜.色);
    選択済み野菜idを設定する(野菜.id);
    プルダウン表示を設定する(false);
    入力欄Ref.current?.focus();
  };

  const 決定する = () => {
    const trimmed = 名称.trim();
    if (!trimmed) return;

    // プリセットが選択されていて名称と色が一致していればそのまま使う
    if (選択済み野菜id) {
      const 野菜 = 野菜一覧.find((v) => v.id === 選択済み野菜id);
      if (野菜 && 野菜.名称 === trimmed && 野菜.色 === 選択色) {
        onSelect(選択済み野菜id);
        return;
      }
    }

    // 完全一致するプリセットがあればそれを使う
    const 完全一致 = 野菜一覧.find((v) => v.名称 === trimmed && v.色 === 選択色);
    if (完全一致) {
      onSelect(完全一致.id);
      return;
    }

    // カスタム野菜として追加
    const id = カスタム野菜を追加する(trimmed, 選択色);
    onSelect(id);
  };

  // 外側クリックでプルダウンを閉じる
  const コンテナRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (コンテナRef.current && !コンテナRef.current.contains(e.target as Node)) {
        プルダウン表示を設定する(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold mb-3">野菜を追加</h3>

        {/* コンボボックス */}
        <div ref={コンテナRef} className="relative mb-3">
          <label className="text-xs text-gray-500 mb-1 block">名称</label>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full shrink-0 border border-gray-200"
              style={{ backgroundColor: 選択色 }}
            />
            <input
              ref={入力欄Ref}
              type="text"
              value={名称}
              onChange={(e) => 名称変更時(e.target.value)}
              onFocus={() => プルダウン表示を設定する(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  プルダウン表示を設定する(false);
                  決定する();
                }
                if (e.key === "Escape") プルダウン表示を設定する(false);
              }}
              placeholder="野菜名を入力（例: トマト）"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>

          {/* プルダウン候補 */}
          {プルダウン表示 && 候補一覧.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {候補一覧.map((野菜) => (
                <button
                  key={野菜.id}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    候補を選択する(野菜.id);
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: 野菜.色 }}
                  />
                  {野菜.名称}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 色選択 */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">色</label>
          <div className="grid grid-cols-6 gap-1.5">
            {カレンダー色一覧.map((色) => (
              <button
                key={色.id}
                title={色.名前}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                  選択色 === 色.コード
                    ? "border-gray-800 scale-110"
                    : "border-transparent hover:border-gray-300"
                }`}
                style={{ backgroundColor: 色.コード }}
                onClick={() => {
                  選択色を設定する(色.コード);
                  選択済み野菜idを設定する(null);
                }}
              />
            ))}
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-2">
          <button
            onClick={決定する}
            disabled={!名称.trim()}
            className="flex-1 text-sm bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            追加
          </button>
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
