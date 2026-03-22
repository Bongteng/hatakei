import { useEffect } from "react";
import "./index.css";
import { 認証ストアを使う } from "./store/認証ストア";
import { プリセットストアを使う } from "./store/プリセットストア";
import { タイムラインストアを使う } from "./store/タイムラインストア";
import { タイムライン } from "./components/timeline/タイムライン";

const APIのベースURL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function App() {
  const ユーザー = 認証ストアを使う((s) => s.ユーザー);
  const 自分を取得する = 認証ストアを使う((s) => s.自分を取得する);
  const ログアウトする = 認証ストアを使う((s) => s.ログアウトする);
  const 野菜を取得する = プリセットストアを使う((s) => s.野菜を取得する);
  const タイムライン一覧を取得する = タイムラインストアを使う((s) => s.タイムライン一覧を取得する);

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
    </div>
  );
}

export default App;
