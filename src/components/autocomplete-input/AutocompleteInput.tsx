import { useState, useCallback, useEffect, type FC } from "react";
import { AutoComplete } from "antd";

export type AutocompleteType =
  | "action"
  | "template"
  | "step"
  | "variable"
  | "subflow";

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  type: AutocompleteType;
  context?: {
    taskName?: string;
    version?: string;
    taskId?: string;
  };
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

const cache = new Map<string, { value: string; label: string }[]>();

const AutocompleteInput: FC<Props> = ({
  value = "",
  onChange,
  type,
  context = {},
  placeholder,
  disabled,
  allowClear,
}) => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    () => cache.get(type) ?? []
  );

  const fetchSuggestions = useCallback(async () => {
    if (cache.has(type)) {
      setOptions(cache.get(type)!);
      return;
    }

    try {
      let result: { value: string; label: string }[];

      switch (type) {
        case "action":
          result = await window.pywebview?.api.emit("API:AUTOCOMPLETE:ACTIONS");
          break;
        case "template":
          result = await window.pywebview?.api.emit(
            "API:AUTOCOMPLETE:TEMPLATES",
            context.taskName ?? null,
            context.version ?? null
          );
          result = (result ?? []).map((name: string) => ({
            value: name,
            label: name,
          }));
          break;
        case "step":
          if (context.taskId) {
            result = await window.pywebview?.api.emit(
              "API:AUTOCOMPLETE:STEPS",
              context.taskId
            );
            result = (result ?? []).map((name: string) => ({
              value: name,
              label: name,
            }));
          } else {
            result = [];
          }
          break;
        case "variable": {
          const items: { value: string; label: string }[] = [
            { value: "{result}", label: "{result} — 当前步骤返回值" },
          ];
          // CONFIG variables from settings
          try {
            const settings = await window.pywebview?.api.emit("API:SETTINGS:LOAD");
            if (settings?.values) {
              for (const key of Object.keys(settings.values)) {
                items.push({
                  value: `{CONFIG.${key}}`,
                  label: `{CONFIG.${key}} — 全局设置`,
                });
              }
            }
          } catch {
            // settings not available
          }
          result = items;
          break;
        }
        case "subflow":
          // subflow names = step names (subflows are steps called via run_subflow)
          if (context.taskId) {
            result = await window.pywebview?.api.emit(
              "API:AUTOCOMPLETE:STEPS",
              context.taskId
            );
            result = (result ?? []).map((name: string) => ({
              value: name,
              label: name,
            }));
          } else {
            result = [];
          }
          break;
        default:
          result = [];
      }

      cache.set(type, result);
      setOptions(result);
    } catch {
      setOptions([]);
    }
  }, [type, context.taskName, context.version, context.taskId]);

  useEffect(() => {
    cache.delete(type);
  }, [type, context.taskName, context.version, context.taskId]);

  return (
    <AutoComplete
      value={value}
      onChange={(v) => onChange?.(v)}
      options={options}
      onFocus={fetchSuggestions}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      style={{ width: "100%" }}
      filterOption={(inputValue, option) =>
        option?.label?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
      }
    />
  );
};

export default AutocompleteInput;
