import { Input } from "antd";
import { useCallback } from "react";
import type { FC } from "react";
import * as React from "react";

interface Props {
  value: string
  onChange: (value: string) => void
}

const excluded = new Set(["Process", "Unidentified", "Dead"]);

const KeyInput: FC<Props> = ({ value, onChange }) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const key = e.key;
      if (excluded.has(key)) return;

      if (e.code.startsWith("Numpad") && /^[0-9]$/.test(key)) {
        onChange(`Num${key}`);
        return;
      }

      onChange(key.length === 1 ? key.toUpperCase() : key);
    },
    [onChange],
  );

  return (
    <Input
      value={value}
      placeholder="—"
      className="!w-24 !text-center !font-mono !text-sm !bg-white !border !border-gray-300 !rounded-md !cursor-pointer !select-none hover:!border-gray-400 focus:!border-blue-500"
      readOnly
      onKeyDown={handleKeyDown}
    />
  );
};

export default KeyInput;
