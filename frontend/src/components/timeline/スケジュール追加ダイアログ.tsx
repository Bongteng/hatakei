import { useState } from "react";
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

  const 決定する = () => {
    const trimmed = 名称.trim();
    if (!trimmed) return;

    const 完全一致 = 野菜一覧.find((v) => v.名称 === trimmed && v.色 === 選択色);
    if (完全一致) {
      onSelect(完全一致.id);
      return;
    }

    const id = カスタム野菜を追加する(trimmed, 選択色);
    onSelect(id);
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-4 w-80 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold mb-3">空のスケジュールを作成</h3>

        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">名称</label>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full shrink-0 border border-gray-200"
              style={{ backgroundColor: 選択色 }}
            />
            <input
              type="text"
              value={名称}
              onChange={(e) => 名称を設定する(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") 決定する(); }}
              placeholder="野菜名を入力（例: トマト）"
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
          </div>
        </div>

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
                onClick={() => 選択色を設定する(色.コード)}
              />
            ))}
          </div>
        </div>

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
