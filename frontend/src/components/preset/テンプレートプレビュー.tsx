import type { イベント } from "../../types";

type Props = {
  イベント一覧: イベント[];
  野菜色: string;
};

// 52週を簡易プレビュー幅にマッピング（幅340px程度に収まるよう）
const プレビュー幅 = 340;
const 全週数 = 52;
const 週あたりpx = プレビュー幅 / 全週数;

export const テンプレートプレビュー = ({ イベント一覧, 野菜色 }: Props) => {
  return (
    <div
      className="relative h-5 rounded mb-2 overflow-hidden"
      style={{ width: プレビュー幅, backgroundColor: `${野菜色}20` }}
    >
      {イベント一覧.map((イベント) => {
        const left = イベント.開始週 * 週あたりpx;
        const width = Math.max(
          (イベント.終了週 - イベント.開始週 + 1) * 週あたりpx,
          4
        );
        return (
          <div
            key={イベント.id}
            className="absolute top-0 h-full rounded-sm flex items-center justify-center"
            style={{
              left,
              width,
              backgroundColor: "rgba(255,255,255,0.6)",
              border: `1px solid ${野菜色}40`,
            }}
            title={`${イベント.イベント名} (${イベント.開始週}〜${イベント.終了週}週)`}
          >
            <span
              className="text-[9px] truncate px-0.5"
              style={{ color: 野菜色 }}
            >
              {イベント.イベント名}
            </span>
          </div>
        );
      })}
    </div>
  );
};
