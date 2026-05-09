import { useState, useRef, type FC } from "react";
import { AutoComplete, Button, Input, Modal } from "antd";
import { HolderOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import type { EditorCtx } from "./constants";
import SubflowModalItem from "./SubflowModalItem";

interface Props {
  label: string; color: string; list: any[]; ctx: EditorCtx;
  onChange: (v: any[]) => void; isKeyValue?: boolean;
}

const SubList: FC<Props> = ({ label, color, list, ctx, onChange, isKeyValue }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const arr = list ?? [];
  const preview = isKeyValue
    ? arr.slice(0, 3).map((s: any) => s.name || "?").join(", ")
    : arr.slice(0, 3).map((s: any) => {
        const name = typeof s === "string" ? s : s.step;
        return name + (typeof s === "object" && (s.when || s.args) ? "*" : "");
      }).join(" → ");

  const move = (from: number, to: number) => {
    const u = [...arr];
    const [item] = u.splice(from, 1);
    u.splice(to, 0, item);
    onChange(u);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 rounded-full" style={{ background: color }} />
        <span className="text-[13px] font-bold text-[#1a1a2e]">{label}</span>
        {arr.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f0f2f5] text-[#6b7280] font-medium">{arr.length}</span>}
      </div>
      {arr.length > 0 ? (
        <div className="rounded-lg border border-[#eef0f2] bg-[#fafbfc] px-3 py-2 cursor-pointer hover:border-[#d0d5dd] transition-colors"
          onClick={() => setModalOpen(true)}>
          <span className="text-[11px] text-[#374151]">{preview}{arr.length > 3 ? ` 等${arr.length}项` : ""}</span>
          <span className="text-[10px] text-[#9ca3af] ml-2">点击编辑</span>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#d0d5dd] px-3 py-2 cursor-pointer hover:border-[#3b82f6] hover:bg-[#fafbff] transition-colors"
          onClick={() => setModalOpen(true)}>
          <span className="text-[11px] text-[#9ca3af]">未配置 — 点击编辑</span>
        </div>
      )}
      <Modal
        closable={false}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span style={{ lineHeight: "24px" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Button type="primary" size="small" ghost icon={<PlusOutlined />}
                onClick={() => onChange([...arr, isKeyValue ? { name: "", value: "" } : { step: "" }])}>
                添加{isKeyValue ? "变量" : "步骤"}
              </Button>
              <Button type="text" size="small" icon={<CloseOutlined />}
                onClick={() => setModalOpen(false)} />
            </div>
          </div>
        }
        open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={600}>
        <div className="flex flex-col gap-2 pt-2 max-h-[65vh]">
          <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
            {arr.map((item, i) => isKeyValue ? (
              <div key={i} className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[#eef0f2] bg-white hover:border-[#dde0e6] transition-all">
                <span className="w-6 h-6 rounded-full bg-[#eff6ff] flex items-center justify-center text-[10px] font-bold text-[#3b82f6] shrink-0">{i + 1}</span>
                <Input size="small" variant="borderless" placeholder="变量名" className="flex-1 font-semibold" value={item.name}
                  onChange={(e) => { const u = [...arr]; u[i] = { ...u[i], name: e.target.value }; onChange(u); }} />
                <span className="text-xs text-[#d0d5dd] font-medium">=</span>
                <AutoComplete className="flex-1" size="small" variant="borderless" placeholder="值" value={item.value as string}
                  options={ctx.variableOptions}
                  filterOption={(iv, opt) => opt?.label?.toLowerCase().includes(iv.toLowerCase()) ?? false}
                  onChange={(v) => { const u = [...arr]; u[i] = { ...u[i], value: v }; onChange(u); }} />
                <Button type="text" size="small" className="!text-[#d0d5dd] hover:!text-[#dc2626] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { const u = [...arr]; u.splice(i, 1); onChange(u); }}>×</Button>
              </div>
            ) : (
              <div key={i}
                draggable
                onDragStart={() => { dragIdx.current = i; }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => {
                  if (dragIdx.current !== null && dragIdx.current !== i) {
                    move(dragIdx.current, i);
                  }
                  dragIdx.current = null;
                }}
                className="flex items-center gap-1.5 group/drag cursor-default">
                <HolderOutlined className="text-[12px] text-[#d0d5dd] hover:text-[#6b7280] shrink-0 cursor-grab opacity-0 group-hover/drag:opacity-100 transition-opacity" />
                <SubflowModalItem index={i} item={item} ctx={ctx} arr={arr} onChange={onChange} />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubList;
