import React from "react";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
};

export const Toggle: React.FC<Props> = ({ checked, onChange, disabled, "aria-label": ariaLabel }) => (
  <label className="toggle-wrap">
    <input
      type="checkbox"
      className="toggle-input"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      aria-label={ariaLabel}
    />
    <span className="toggle-track" aria-hidden />
  </label>
);
