import { 行高さ, 週ラベル列幅, 月ヘッダー一覧を生成する, 月別週数 } from "../../utils/週変換";

type Props = {
  表示開始年: number;
  表示開始月: number;
};

export const 週ラベル列 = ({ 表示開始年, 表示開始月 }: Props) => {
  const 月ヘッダー一覧 = 月ヘッダー一覧を生成する(表示開始年, 表示開始月);

  return (
    <div className="shrink-0 bg-white border-r border-gray-300" style={{ width: 週ラベル列幅 }}>
      {月ヘッダー一覧.map((月) => {
        const 週数 = 月別週数[
          // 月ラベルから月番号を取得（"2026/3月" → 3）
          parseInt(月.ラベル.split("/")[1])
        ] ?? 月.行数;

        return (
          <div key={月.ラベル} style={{ height: 月.行数 * 行高さ }}>
            {Array.from({ length: 週数 }, (_, i) => (
              <div
                key={i}
                className="flex items-center border-t border-gray-100 px-1"
                style={{ height: 行高さ }}
              >
                {i === 0 ? (
                  <span className="text-xs font-semibold text-gray-700 truncate">
                    {月.ラベル.replace("/", "年").replace("月", "")}月 第1週
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 pl-2">
                    第{i + 1}週
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
