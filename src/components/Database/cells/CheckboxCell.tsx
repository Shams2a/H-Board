/**
 * CheckboxCell Component
 * Boolean checkbox editor
 */

interface CheckboxCellProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function CheckboxCell({ value, onChange }: CheckboxCellProps) {
  return (
    <div className="flex items-center justify-center w-full py-1">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 dark:text-primary-500 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-2 cursor-pointer bg-white dark:bg-gray-700"
      />
    </div>
  );
}
