import { useState, useRef, useCallback, type FC, type KeyboardEvent } from "react";
import { Input, Popover } from "antd";
import VariablePicker, { type VarItem } from "./VariablePicker";

interface Props {
  value: string;
  onChange: (value: string) => void;
  variables: VarItem[];
  placeholder?: string;
  mono?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const SmartVarInput: FC<Props> = ({ value, onChange, variables, placeholder, mono, style, className }) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const insertPosRef = useRef<number>(0);

  const handleInsert = useCallback(
    (expr: string) => {
      const pos = insertPosRef.current;
      const before = value.slice(0, pos);
      // Remove the just-typed { if it's at cursor position
      const hasBrace = before.endsWith("{");
      const adjustedPos = hasBrace ? pos - 1 : pos;
      const newVal = hasBrace
        ? value.slice(0, adjustedPos) + expr + value.slice(pos)
        : before + expr + value.slice(pos);
      onChange(newVal);
      setOpen(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(adjustedPos + expr.length, adjustedPos + expr.length);
      }, 0);
    },
    [value, onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "{") {
      insertPosRef.current = e.currentTarget.selectionStart ?? value.length;
      // Let the { be typed first, then after render, check and open picker
      requestAnimationFrame(() => {
        setOpen(true);
      });
    }
  };

  const handleFocus = () => {
    insertPosRef.current = inputRef.current?.selectionStart ?? value.length;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => setOpen(v)}
      placement="bottomLeft"
      overlayStyle={{ maxWidth: 400 }}
      destroyTooltipOnHide
      content={
        <VariablePicker
          variables={variables}
          onInsert={handleInsert}
          placeholder="搜索变量…"
        />
      }
    >
      <Input
        ref={inputRef as any}
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleFocus}
        placeholder={placeholder ?? "输入 { 插入变量"}
        className={className}
        style={{ fontFamily: mono ? "'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace" : undefined, fontSize: mono ? 12 : undefined, ...style }}
      />
    </Popover>
  );
};

export default SmartVarInput;
