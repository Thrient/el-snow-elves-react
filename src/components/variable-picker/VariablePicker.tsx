import { useState, useMemo, type FC } from "react";
import { Input, Popover } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type VarOp = "get" | "inc" | "dec" | "default" | "sub" | "len" | "cycle";

interface OpBtn {
  key: VarOp;
  label: string;
  syntax: (bareName: string) => string;
  hint: string;
}

const ALL_OPS: OpBtn[] = [
  { key: "get",     label: "取值",    syntax: (n) => `{${n}}`,        hint: "直接取变量值" },
  { key: "default", label: "默认值",  syntax: (n) => `{${n}:}`,       hint: "变量不存在时用默认值" },
  { key: "inc",     label: "++",      syntax: (n) => `{${n}}++`,      hint: "自增 1（用于 set）" },
  { key: "dec",     label: "--",      syntax: (n) => `{${n}}--`,      hint: "自减 1（用于 set）" },
  { key: "len",     label: "长度",    syntax: (n) => `len(${n})`,     hint: "列表元素个数（用于 when）" },
  { key: "sub",     label: "[n]",     syntax: (n) => `{${n}}[0]`,     hint: "取列表下标元素，可改 0 为其他" },
];

interface VarItem {
  syntax: string;   // "{varName}"
  label: string;    // "{varName} — 描述"
  category: "config" | "task" | "system" | "set" | "step";
}

interface Props {
  /** All variable options shown in the picker */
  variables: VarItem[];
  /** Called when user picks a variable + operation */
  onInsert: (expr: string) => void;
  /** Trigger element */
  children: React.ReactNode;
  /** Placeholder when empty */
  placeholder?: string;
  /** Context hint — reorders operations to put most relevant first */
  context?: "set" | "when" | "args" | "params";
}

const CAT_LABELS: Record<string, string> = {
  config: "全局设置",
  task: "任务变量",
  set: "Set 变量",
  system: "系统",
  step: "步骤名",
};

const CONTEXT_ORDER: Record<string, VarOp[]> = {
  set:    ["inc", "dec", "get", "default", "len", "sub"],
  when:   ["len", "get", "sub", "inc", "dec", "default"],
  args:   ["get", "default", "len", "sub", "inc", "dec"],
  params: ["get", "default", "sub", "len", "inc", "dec"],
};

const VariablePicker: FC<Props> = ({ variables, onInsert, children, placeholder, context }) => {
  const [search, setSearch] = useState("");
  const [recentVar, setRecentVar] = useState<string | null>(null);

  // Reorder operations based on context
  const orderedOps = useMemo(() => {
    if (!context) return ALL_OPS;
    const order = CONTEXT_ORDER[context] ?? ALL_OPS.map((o) => o.key);
    const byKey = new Map(ALL_OPS.map((o) => [o.key, o]));
    return order.map((k) => byKey.get(k)!).filter(Boolean);
  }, [context]);

  const filtered = useMemo(() => {
    if (!search.trim()) return variables;
    const q = search.toLowerCase();
    return variables.filter(
      (v) => v.syntax.toLowerCase().includes(q) || v.label.toLowerCase().includes(q),
    );
  }, [variables, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, VarItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  const handlePick = (bareName: string, op: VarOp) => {
    const opDef = ALL_OPS.find((o) => o.key === op);
    if (!opDef) return;
    setRecentVar(bareName);
    onInsert(opDef.syntax(bareName));
  };

  const content = (
    <div style={{ width: 360, maxHeight: 420, display: "flex", flexDirection: "column" }}>
      {/* Search */}
      <div style={{ padding: "0 0 8px", flexShrink: 0 }}>
        <Input
          size="small"
          prefix={<SearchOutlined style={{ color: "#b8afa6" }} />}
          placeholder={placeholder ?? "搜索变量…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ borderRadius: 8 }}
        />
      </div>

      {/* Variable list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {Array.from(grouped.entries()).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#b8afa6",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
              padding: "0 2px",
            }}>
              {CAT_LABELS[cat] ?? cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((item) => {
                const bare = item.syntax.replace(/^\{|\}$/g, "");
                return (
                  <div
                    key={item.syntax}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 6px",
                      borderRadius: 8,
                      background: recentVar === bare ? "#fef3ef" : "#faf8f5",
                      border: recentVar === bare ? "1px solid #d4513b33" : "1px solid #f0ede8",
                    }}
                  >
                    {/* Variable name */}
                    <code
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#3d3630",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.label}
                    >
                      {item.syntax}
                      {recentVar === bare && <span style={{ fontSize: 9, color: "#d4513b", marginLeft: 4, fontWeight: 400 }}>上次</span>}
                    </code>

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Operation buttons */}
                    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                      {orderedOps.map((op) => (
                        <button
                          key={op.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePick(bare, op.key);
                          }}
                          title={op.hint}
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "2px 6px",
                            borderRadius: 4,
                            border: "1px solid #e8e3dc",
                            background: "#fff",
                            color: "#6b5e55",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            outline: "none",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fef3ef";
                            e.currentTarget.style.borderColor = "#d4513b";
                            e.currentTarget.style.color = "#d4513b";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.borderColor = "#e8e3dc";
                            e.currentTarget.style.color = "#6b5e55";
                          }}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 16, fontSize: 12, color: "#c4bbb2" }}>
            无匹配变量
          </div>
        )}
      </div>

    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomLeft"
      content={content}
      overlayStyle={{ maxWidth: 400 }}
    >
      {children}
    </Popover>
  );
};

export { ALL_OPS };
export type { VarItem, VarOp };
export default VariablePicker;
