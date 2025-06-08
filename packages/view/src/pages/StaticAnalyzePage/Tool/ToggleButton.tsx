import { useState } from "react";

interface ToggleButtonProps {
  label: React.ReactNode;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const ToggleButton = ({
  label,
  onChange,
  className = "",
}: ToggleButtonProps) => {
  const [checked, setChecked] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setChecked(isChecked);
    onChange?.(isChecked);
  };

  return (
    <label className={`inline-block cursor-pointer ${className}`}>
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={handleChange}
      />
      <span
        className={`
          inline-block px-4 py-2 rounded-lg transition-all duration-300
          border font-semibold
          ${
            checked
              ? "bg-[var(--control-item-bg-active)]  text-[var(--color-primary-text)] shadow-lg"
              : " text-[var(--color-primary-text)]"
          }
        `}
      >
        {label}
      </span>
    </label>
  );
};

export default ToggleButton;
