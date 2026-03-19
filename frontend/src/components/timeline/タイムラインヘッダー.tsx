import { 月ヘッダー一覧を生成する, 列幅, 週インデックスを表示列に変換する, 週数合計 } from "../../utils/週変換";
import { タイムラインストアを使う } from "../../store/タイムラインストア";

const 月ヘッダー一覧 = 月ヘッダー一覧を生成する();

type Props = {
  野菜名列幅: number;
};

export const タイムラインヘッダー = ({ 野菜名列幅 }: Props) => {
  const 現在週 = タイムラインストアを使う((s) => s.現在週);
  const 現在列 = 週インデックスを表示列に変換する(現在週);

  return (
    <div className="flex shrink-0 border-b border-gray-300 bg-white">
      <div
        className="shrink-0 border-r border-gray-300"
        style={{ width: 野菜名列幅 }}
      />
      <div className="relative" style={{ width: 週数合計 * 列幅 }}>
        {/* 月ラベル */}
        <div className="flex h-8">
          {月ヘッダー一覧.map((月) => (
            <div
              key={月.ラベル}
              className="border-r border-gray-200 text-xs text-gray-600 flex items-center justify-center overflow-hidden"
              style={{ width: 月.列数 * 列幅 }}
            >
              {月.ラベル}
            </div>
          ))}
        </div>
        {/* 現在週マーカー */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
          style={{ left: 現在列 * 列幅 + 列幅 / 2 }}
        />
      </div>
    </div>
  );
};
