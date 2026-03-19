import { プリセットストアを使う } from "../../store/プリセットストア";

type Props = {
  onSelect: (野菜id: string) => void;
  onCancel: () => void;
};

export const スケジュール追加ダイアログ = ({ onSelect, onCancel }: Props) => {
  const 野菜一覧 = プリセットストアを使う((s) => s.野菜一覧);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-lg p-4 w-72 max-h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold mb-3">野菜を選択</h3>
        <div className="overflow-y-auto flex-1">
          {野菜一覧.map((野菜) => (
            <button
              key={野菜.id}
              className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
              onClick={() => onSelect(野菜.id)}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: 野菜.色 }}
              />
              {野菜.名称}
            </button>
          ))}
        </div>
        <button
          className="mt-2 text-sm text-gray-500 hover:text-gray-700"
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};
