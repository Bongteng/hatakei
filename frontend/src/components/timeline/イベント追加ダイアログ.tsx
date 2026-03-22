import { useState } from "react";
import type { 定義済みイベント名 } from "../../types";

const 定義済みイベント名一覧: 定義済みイベント名[] = [
  "種まき", "育苗", "定植", "追肥", "収穫", "土づくり", "剪定", "支柱立て",
];

type Props = {
  初期開始週: number;
  onSubmit: (イベント名: string, 開始週: number, 終了週: number) => void;
  onCancel: () => void;
};

export const イベント追加ダイアログ = ({ 初期開始週, onSubmit, onCancel }: Props) => {
  const [イベント名, イベント名を設定する] = useState<string>(定義済みイベント名一覧[0]);
  const [カスタム名, カスタム名を設定する] = useState("");
  const [開始週, 開始週を設定する] = useState(初期開始週);
  const [期間週数, 期間週数を設定する] = useState(4);

  const 最終イベント名 = イベント名 === "その他" ? カスタム名 : イベント名;
  const 送信可能 = 最終イベント名.trim().length > 0 && 期間週数 > 0;

  const 送信する = () => {
    if (!送信可能) return;
    onSubmit(最終イベント名, 開始週, 開始週 + 期間週数 - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold mb-3">イベント追加</h3>

        <label className="block text-xs text-gray-500 mb-1">イベント名</label>
        <select
          className="w-full border rounded px-2 py-1 text-sm mb-2"
          value={イベント名}
          onChange={(e) => イベント名を設定する(e.target.value)}
        >
          {定義済みイベント名一覧.map((名前) => (
            <option key={名前} value={名前}>{名前}</option>
          ))}
          <option value="その他">その他</option>
        </select>

        {イベント名 === "その他" && (
          <input
            className="w-full border rounded px-2 py-1 text-sm mb-2"
            placeholder="イベント名を入力"
            value={カスタム名}
            onChange={(e) => カスタム名を設定する(e.target.value)}
            autoFocus
          />
        )}

        <label className="block text-xs text-gray-500 mb-1">開始週（インデックス）</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-sm mb-2"
          value={開始週}
          min={1}
          max={156}
          onChange={(e) => 開始週を設定する(Number(e.target.value))}
        />

        <label className="block text-xs text-gray-500 mb-1">期間（週）</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-sm mb-2"
          value={期間週数}
          min={1}
          max={52}
          onChange={(e) => 期間週数を設定する(Number(e.target.value))}
        />

        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            onClick={onCancel}
          >
            キャンセル
          </button>
          <button
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!送信可能}
            onClick={送信する}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
};
