import type { スケジュール } from "../../types";
import { スケジュール列幅 } from "../../utils/週変換";
import { プリセットストアを使う } from "../../store/プリセットストア";
import { タイムラインストアを使う } from "../../store/タイムラインストア";

type Props = {
  スケジュール一覧: スケジュール[];
  タイムラインid: string;
};

export const 野菜名ヘッダー = ({ スケジュール一覧, タイムラインid }: Props) => {
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);
  const スケジュールを削除する = タイムラインストアを使う((s) => s.スケジュールを削除する);

  return (
    <div className="flex">
      {スケジュール一覧.map((schedule) => {
        const 野菜 = 野菜一覧.find((v) => v.id === schedule.野菜id);
        const 野菜名 = 野菜?.名称 ?? "不明";
        const 野菜色 = 野菜?.色 ?? "#ccc";

        return (
          <div
            key={schedule.id}
            className="shrink-0 border-r border-gray-200 flex items-center justify-between px-1 text-xs bg-white"
            style={{ width: スケジュール列幅 }}
          >
            <div className="flex items-center gap-1 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: 野菜色 }}
              />
              <span className="truncate">{野菜名}</span>
            </div>
            <button
              className="text-gray-400 hover:text-red-500 shrink-0 ml-1"
              onClick={() => スケジュールを削除する(タイムラインid, schedule.id)}
              title="列を削除"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
};
