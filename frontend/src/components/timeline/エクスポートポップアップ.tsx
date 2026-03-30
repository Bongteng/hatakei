import { useState } from "react";

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type エクスポート状態 =
  | { tag: "入力中" }
  | { tag: "送信中"; 作成済み: number; 合計: number }
  | { tag: "完了"; 作成数: number }
  | { tag: "エラー"; メッセージ: string; needsReauth: boolean };

type Props = {
  タイムラインid: string;
  onClose: () => void;
};

const 今月 = () => {
  const now = new Date();
  return { 年: now.getFullYear(), 月: now.getMonth() + 1 };
};

const 月を加算する = (年: number, 月: number, 加算: number): { 年: number; 月: number } => {
  const total = (年 * 12 + 月 - 1) + 加算;
  return { 年: Math.floor(total / 12), 月: (total % 12) + 1 };
};

const 月差を計算する = (開始年: number, 開始月: number, 終了年: number, 終了月: number): number =>
  (終了年 - 開始年) * 12 + (終了月 - 開始月);

export const エクスポートポップアップ = ({ タイムラインid, onClose }: Props) => {
  const { 年: 現在年, 月: 現在月 } = 今月();
  const デフォルト終了 = 月を加算する(現在年, 現在月, 11);

  const [開始年, 開始年を設定する] = useState(現在年);
  const [開始月, 開始月を設定する] = useState(現在月);
  const [終了年, 終了年を設定する] = useState(デフォルト終了.年);
  const [終了月, 終了月を設定する] = useState(デフォルト終了.月);
  const [状態, 状態を設定する] = useState<エクスポート状態>({ tag: "入力中" });

  const 月差 = 月差を計算する(開始年, 開始月, 終了年, 終了月);
  const 範囲エラー = 月差 < 0 ? "終了は開始より後にしてください" :
    月差 > 11 ? "期間は1年以内にしてください" : null;

  const エクスポートする = async () => {
    if (範囲エラー) return;
    状態を設定する({ tag: "送信中", 作成済み: 0, 合計: 0 });
    try {
      const resp = await fetch(`${APIのベースURL}/api/gcal/export`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ タイムラインid, 開始年, 開始月, 終了年, 終了月 }),
      });

      if (resp.status === 401) {
        状態を設定する({ tag: "エラー", メッセージ: "ログインが必要です", needsReauth: false });
        return;
      }
      if (resp.status === 403) {
        const data = await resp.json() as { error?: string };
        状態を設定する({ tag: "エラー", メッセージ: data.error ?? "カレンダー権限がありません。再ログインしてください。", needsReauth: true });
        return;
      }
      if (!resp.ok) {
        const data = await resp.json() as { error?: string };
        状態を設定する({ tag: "エラー", メッセージ: data.error ?? "エラーが発生しました", needsReauth: false });
        return;
      }

      // SSEストリームを読む
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const event = JSON.parse(chunk.slice(6)) as
            | { type: "start"; 合計: number }
            | { type: "progress"; 作成済み: number; 合計: number }
            | { type: "complete"; 作成数: number }
            | { type: "error"; message: string };

          if (event.type === "start") {
            状態を設定する({ tag: "送信中", 作成済み: 0, 合計: event.合計 });
          } else if (event.type === "progress") {
            状態を設定する({ tag: "送信中", 作成済み: event.作成済み, 合計: event.合計 });
          } else if (event.type === "complete") {
            状態を設定する({ tag: "完了", 作成数: event.作成数 });
          } else if (event.type === "error") {
            状態を設定する({ tag: "エラー", メッセージ: event.message, needsReauth: false });
          }
        }
      }
    } catch {
      状態を設定する({ tag: "エラー", メッセージ: "通信エラーが発生しました", needsReauth: false });
    }
  };

  const 年の選択肢 = Array.from({ length: 5 }, (_, i) => 現在年 - 1 + i);
  const 月の選択肢 = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded shadow-lg p-4 w-72"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-sm font-semibold text-gray-700 mb-3">Googleカレンダーへエクスポート</div>

        {状態.tag === "送信中" ? (
          <div className="mb-3">
            <div className="text-sm text-gray-700 mb-1">エクスポート中...</div>
            <div className="text-sm font-mono text-blue-600">
              {状態.合計 > 0 ? `${状態.作成済み} / ${状態.合計} 件` : "準備中..."}
            </div>
            {状態.合計 > 0 && (
              <div className="mt-2 h-1.5 bg-gray-200 rounded">
                <div
                  className="h-1.5 bg-blue-500 rounded transition-all"
                  style={{ width: `${Math.round((状態.作成済み / 状態.合計) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ) : 状態.tag === "完了" ? (
          <div className="text-sm text-green-600 mb-3">
            {状態.作成数}件の予定をhatakeiカレンダーに追加しました。
          </div>
        ) : 状態.tag === "エラー" ? (
          <div className="mb-3">
            <div className="text-sm text-red-500 mb-2">{状態.メッセージ}</div>
            {状態.needsReauth && (
              <button
                className="text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 cursor-pointer"
                onClick={() => { window.location.href = `${APIのベースURL}/api/auth/google`; }}
              >
                再ログイン
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 開始年月 */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-600 w-8">開始</span>
              <select
                className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                value={開始年}
                onChange={(e) => 開始年を設定する(Number(e.target.value))}
              >
                {年の選択肢.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                value={開始月}
                onChange={(e) => 開始月を設定する(Number(e.target.value))}
              >
                {月の選択肢.map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>
            {/* 終了年月 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 w-8">終了</span>
              <select
                className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                value={終了年}
                onChange={(e) => 終了年を設定する(Number(e.target.value))}
              >
                {年の選択肢.map((y) => <option key={y} value={y}>{y}年</option>)}
              </select>
              <select
                className="border border-gray-300 rounded px-1 py-0.5 text-xs"
                value={終了月}
                onChange={(e) => 終了月を設定する(Number(e.target.value))}
              >
                {月の選択肢.map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>
            {範囲エラー && (
              <div className="text-xs text-red-500 mb-2">{範囲エラー}</div>
            )}
            <p className="text-xs text-amber-600 mt-3">
              エクスポートすると、hatakeiカレンダーの既存の予定はすべて削除されます。
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                onClick={onClose}
              >
                キャンセル
              </button>
              <button
                className="text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
                disabled={状態.tag === "送信中" || !!範囲エラー}
                onClick={エクスポートする}
              >
                {状態.tag === "送信中" ? "エクスポート中..." : "エクスポート"}
              </button>
            </div>
          </>
        )}

        {(状態.tag === "完了" || 状態.tag === "エラー") && (
          <div className="flex justify-end mt-3">
            <button
              className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={onClose}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </>
  );
};
