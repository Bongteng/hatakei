import { useState, useRef, useCallback } from "react";
import { タイムラインストアを使う } from "../../store/タイムラインストア";
import { タイムラインヘッダー } from "./タイムラインヘッダー";
import { スケジュール行 } from "./スケジュール行";
import { イベント追加ダイアログ } from "./イベント追加ダイアログ";
import { スケジュール追加ダイアログ } from "./スケジュール追加ダイアログ";

const 野菜名列幅 = 100;

export const タイムライン = () => {
  const タイムライン一覧 = タイムラインストアを使う((s) => s.タイムライン一覧);
  const アクティブid = タイムラインストアを使う((s) => s.アクティブタイムラインid);
  const スケジュールを追加する = タイムラインストアを使う((s) => s.スケジュールを追加する);
  const イベントを追加する = タイムラインストアを使う((s) => s.イベントを追加する);

  const アクティブタイムライン = タイムライン一覧.find((tl) => tl.id === アクティブid);

  const [イベントダイアログ, イベントダイアログを設定する] = useState<{
    スケジュールid: string;
    開始週: number;
  } | null>(null);
  const [スケジュールダイアログ表示, スケジュールダイアログ表示を設定する] = useState(false);

  const スクロールコンテナRef = useRef<HTMLDivElement>(null);
  const ヘッダーコンテナRef = useRef<HTMLDivElement>(null);

  const スクロール同期 = useCallback(() => {
    if (スクロールコンテナRef.current && ヘッダーコンテナRef.current) {
      ヘッダーコンテナRef.current.scrollLeft = スクロールコンテナRef.current.scrollLeft;
    }
  }, []);

  if (!アクティブタイムライン) {
    return <div className="flex-1 flex items-center justify-center text-gray-400">タイムラインがありません</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* ヘッダー（横スクロール同期） */}
      <div ref={ヘッダーコンテナRef} className="overflow-x-hidden">
        <タイムラインヘッダー 野菜名列幅={野菜名列幅} />
      </div>

      {/* スケジュール行（スクロール可能領域） */}
      <div
        ref={スクロールコンテナRef}
        className="flex-1 overflow-auto"
        onScroll={スクロール同期}
      >
        {アクティブタイムライン.スケジュール一覧.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            右下の + ボタンで野菜を追加
          </div>
        ) : (
          アクティブタイムライン.スケジュール一覧.map((s) => (
            <スケジュール行
              key={s.id}
              スケジュール={s}
              タイムラインid={アクティブタイムライン.id}
              野菜名列幅={野菜名列幅}
              onイベント追加={(スケジュールid, 開始週) =>
                イベントダイアログを設定する({ スケジュールid, 開始週 })
              }
            />
          ))
        )}
      </div>

      {/* + ボタン */}
      <button
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 text-2xl flex items-center justify-center z-20"
        onClick={() => スケジュールダイアログ表示を設定する(true)}
      >
        +
      </button>

      {/* イベント追加ダイアログ */}
      {イベントダイアログ && (
        <イベント追加ダイアログ
          初期開始週={イベントダイアログ.開始週}
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
    </div>
  );
};
