import { useState, useCallback } from "react";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { 野菜名ヘッダー } from "./タイムラインヘッダー";
import { スケジュール列 } from "./スケジュール行";
import { 週ラベル列 } from "./週ラベル列";
import { イベント追加ダイアログ } from "./イベント追加ダイアログ";
import { スケジュール追加ダイアログ } from "./スケジュール追加ダイアログ";
import { テンプレート一覧パネル } from "../preset/テンプレート一覧パネル";
import { 週ラベル列幅 } from "../../utils/週変換";
import type { テンプレート応答 } from "../../types";

export const タイムライン = () => {
  const タイムライン一覧 = タイムラインストアを使う((s) => s.タイムライン一覧);
  const アクティブid = タイムラインストアを使う((s) => s.アクティブタイムラインid);
  const スケジュールを追加する = タイムラインストアを使う((s) => s.スケジュールを追加する);
  const イベントを追加する = タイムラインストアを使う((s) => s.イベントを追加する);
  const 読み込み中 = タイムラインストアを使う((s) => s.読み込み中);
  const 表示開始年 = タイムラインストアを使う((s) => s.表示開始年);
  const 表示開始月 = タイムラインストアを使う((s) => s.表示開始月);
  const 開始週インデックス = タイムラインストアを使う((s) => s.開始週インデックス);

  const アクティブタイムライン = タイムライン一覧.find((tl) => tl.id === アクティブid);

  const [イベントダイアログ, イベントダイアログを設定する] = useState<{
    スケジュールid: string;
    開始週: number;
  } | null>(null);
  const [スケジュールダイアログ表示, スケジュールダイアログ表示を設定する] = useState(false);
  const [テンプレートパネル表示, テンプレートパネル表示を設定する] = useState(false);

  const テンプレートを適用する = useCallback(
    async (テンプレート: テンプレート応答) => {
      if (!アクティブタイムライン) return;
      await スケジュールを追加する(アクティブタイムライン.id, テンプレート.野菜id);
      const 最新 = タイムラインストアを使う.getState();
      const tl = 最新.タイムライン一覧.find((t) => t.id === アクティブタイムライン.id);
      if (!tl) return;
      const 新スケジュール = tl.スケジュール一覧[tl.スケジュール一覧.length - 1];
      if (!新スケジュール) return;
      for (const イベント of テンプレート.イベント一覧) {
        await イベントを追加する(アクティブタイムライン.id, 新スケジュール.id, {
          イベント名: イベント.イベント名,
          開始週: イベント.開始週,
          終了週: イベント.終了週,
        });
      }
      テンプレートパネル表示を設定する(false);
    },
    [アクティブタイムライン, スケジュールを追加する, イベントを追加する]
  );

  if (読み込み中) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">読み込み中...</div>;
  }

  if (!アクティブタイムライン) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">タイムラインがありません</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* スクロール全体コンテナ（sticky が効くよう1つにまとめる） */}
      <div className="flex-1 overflow-auto">
        <div className="inline-flex flex-col min-w-full">
          {/* ─── 上部固定ヘッダー行 ─── */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-gray-300 shadow-sm">
            {/* 左上コーナー（空白） */}
            <div
              className="shrink-0 sticky left-0 z-30 bg-white border-r border-gray-300"
              style={{ width: 週ラベル列幅, minHeight: 40 }}
            />

            {/* 野菜名ヘッダー */}
            <野菜名ヘッダー
              スケジュール一覧={アクティブタイムライン.スケジュール一覧}
              タイムラインid={アクティブタイムライン.id}
            />

            {/* + ボタン */}
            <button
              className="shrink-0 w-10 flex items-center justify-center text-gray-400 hover:text-blue-500 border-l border-gray-200 text-xl"
              onClick={() => テンプレートパネル表示を設定する(true)}
              title="野菜を追加"
            >
              +
            </button>
          </div>

          {/* ─── 本体（週ラベル + スケジュール列） ─── */}
          {アクティブタイムライン.スケジュール一覧.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              右上の + ボタンで野菜を追加
            </div>
          ) : (
            <div className="flex">
              {/* 週ラベル列（左固定） */}
              <div className="sticky left-0 z-10">
                <週ラベル列 表示開始年={表示開始年} 表示開始月={表示開始月} />
              </div>

              {/* スケジュール列群 */}
              {アクティブタイムライン.スケジュール一覧.map((s) => (
                <スケジュール列
                  key={s.id}
                  スケジュール={s}
                  タイムラインid={アクティブタイムライン.id}
                  開始週インデックス={開始週インデックス}
                  表示開始年={表示開始年}
                  表示開始月={表示開始月}
                  onイベント追加={(スケジュールid, 開始週) =>
                    イベントダイアログを設定する({ スケジュールid, 開始週 })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* イベント追加ダイアログ */}
      {イベントダイアログ && (
        <イベント追加ダイアログ
          初期開始週={イベントダイアログ.開始週}
          開始週インデックス={開始週インデックス}
          onSubmit={(イベント名, 開始週, 終了週) => {
            イベントを追加する(アクティブタイムライン.id, イベントダイアログ.スケジュールid, {
              イベント名,
              開始週,
              終了週,
            });
            イベントダイアログを設定する(null);
          }}
          onCancel={() => イベントダイアログを設定する(null)}
        />
      )}

      {/* スケジュール追加ダイアログ */}
      {スケジュールダイアログ表示 && (
        <スケジュール追加ダイアログ
          onSelect={(野菜id) => {
            スケジュールを追加する(アクティブタイムライン.id, 野菜id);
            スケジュールダイアログ表示を設定する(false);
          }}
          onCancel={() => スケジュールダイアログ表示を設定する(false)}
        />
      )}

      {/* テンプレート一覧パネル */}
      {テンプレートパネル表示 && (
        <テンプレート一覧パネル
          onSelect={テンプレートを適用する}
          onCancel={() => テンプレートパネル表示を設定する(false)}
          on野菜から追加={() => {
            テンプレートパネル表示を設定する(false);
            スケジュールダイアログ表示を設定する(true);
          }}
        />
      )}
    </div>
  );
};
