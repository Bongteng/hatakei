import { useEffect, useState } from "react";
import "./index.css";
import { 認証ストアを使う } from "./store/認証ストア";
import { プリセットストアを使う } from "./store/プリセットストア";
import { タイムラインストアを使う } from "./store/タイムラインストア";
import { タイムライン } from "./components/timeline/タイムライン";
import { エクスポートポップアップ } from "./components/timeline/エクスポートポップアップ";

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function App() {
  const ユーザー = 認証ストアを使う((s) => s.ユーザー);
  const 自分を取得する = 認証ストアを使う((s) => s.自分を取得する);
  const ログアウトする = 認証ストアを使う((s) => s.ログアウトする);
  const 野菜を取得する = プリセットストアを使う((s) => s.野菜を取得する);
  const タイムライン一覧を取得する = タイムラインストアを使う((s) => s.タイムライン一覧を取得する);
  const アクティブid = タイムラインストアを使う((s) => s.アクティブタイムラインid);
  const [エクスポート表示, エクスポート表示を設定する] = useState(false);

  useEffect(() => {
    自分を取得する();
    野菜を取得する();
    タイムライン一覧を取得する();
  }, [自分を取得する, 野菜を取得する, タイムライン一覧を取得する]);

  const ログインする = () => {
    window.location.href = `${APIのベースURL}/api/auth/google`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-bold text-gray-800">hatakei</h1>
        <div>
          {ユーザー ? (
            <div className="flex items-center gap-3">
              {アクティブid && (
                <button
                  onClick={() => エクスポート表示を設定する(true)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                  title="Googleカレンダーへエクスポート"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="18" rx="2" fill="white" stroke="#dadce0" strokeWidth="1.5"/>
                    <rect x="2" y="4" width="20" height="5" rx="2" fill="#1a73e8"/>
                    <rect x="2" y="7" width="20" height="2" fill="#1a73e8"/>
                    <text x="12" y="18.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a73e8">GCal</text>
                    <line x1="7" y1="2" x2="7" y2="7" stroke="#dadce0" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="17" y1="2" x2="17" y2="7" stroke="#dadce0" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  エクスポート
                </button>
              )}
              <span className="text-sm text-gray-600">{ユーザー.id}</span>
              <button
                onClick={ログアウトする}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <button
              onClick={ログインする}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Googleでログイン
            </button>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        <タイムライン />
      </main>
      {エクスポート表示 && アクティブid && (
        <エクスポートポップアップ
          タイムラインid={アクティブid}
          onClose={() => エクスポート表示を設定する(false)}
        />
      )}
    </div>
  );
}

export default App;
