import { useState, type FC } from "react";
import { Button, Modal, Select } from "antd";
import type { Step } from "@/types/task";

interface Props {
  step: Step; stepKeys: string[]; stepName: string;
  onUpdate: (field: string, value: unknown) => void;
}

const ITEMS = [
  { k: "success" as const, label: "成功时跳转到", color: "#16a34a", bg: "#f0fdf4", icon: "✓" },
  { k: "failure" as const, label: "失败时跳转到", color: "#dc2626", bg: "#fef2f2", icon: "✗" },
  { k: "next"    as const, label: "无条件跳转到", color: "#6b7280", bg: "#f9fafb", icon: "→" },
];

const FlowSection: FC<Props> = ({ step, stepKeys, stepName, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const has = ITEMS.some(({ k }) => (step as any)[k]);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-[#16a34a]" />
        <label className="text-[13px] font-bold text-[#1a1a2e]">流程跳转</label>
      </div>
      <div className="rounded-lg border border-[#eef0f2] bg-[#fafbfc] cursor-pointer hover:border-[#d0d5dd] transition-all"
        onClick={() => setOpen(true)}>
        <div className="px-4 py-2.5 flex items-center gap-2">
          {has
            ? ITEMS.map(({ k, color, icon }) => {
                const v = (step as any)[k] as string | undefined;
                if (!v) return null;
                return <span key={k} className="text-[11px] font-medium" style={{ color }}>{icon} {v}</span>;
              })
            : <span className="text-[11px] text-[#9ca3af]">未配置跳转</span>}
          <span className="text-[10px] text-[#9ca3af] ml-auto">点击编辑</span>
        </div>
      </div>
      <Modal title="流程跳转" open={open} onCancel={() => setOpen(false)}
        footer={<Button type="primary" onClick={() => setOpen(false)}>完成</Button>} width={480}>
        <div className="flex flex-col gap-3 pt-2">
          {ITEMS.map(({ k, label, color, bg }) => (
            <div key={k} className="rounded-lg border border-[#eef0f2] overflow-hidden">
              <div className="px-4 py-2 text-[11px] font-semibold border-b border-[#eef0f2]"
                style={{ background: bg, color }}>{label}</div>
              <div className="px-4 py-3 bg-white">
                <Select className="w-full" size="middle" allowClear showSearch placeholder="选择目标步骤"
                  value={(step as any)[k] as string | undefined} popupMatchSelectWidth={false}
                  options={stepKeys.filter((sk) => sk !== stepName).map((sk) => ({ value: sk, label: sk }))}
                  onChange={(v) => onUpdate(k, v ?? "")} />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </section>
  );
};

export default FlowSection;
