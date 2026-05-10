import { useState, type FC } from "react";
import { Input, InputNumber, Modal, Select, Tag, Tooltip } from "antd";
import {
  InfoCircleOutlined,
  MonitorOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { FullTask } from "@/types/task";
import { useEditorStore } from "@/store/editor-store";

interface Props {
  open: boolean;
  task: FullTask;
  stepNames: string[];
  onClose: () => void;
}

/* ---- Loop step list with drag-to-reorder and tag-cloud picker ---- */

const LoopStepEditor: FC<{
  steps: string[];
  available: string[];
  onChange: (v: string[]) => void;
}> = ({ steps, available, onChange }) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState("");

  const rm = (i: number) => onChange(steps.filter((_, j) => j !== i));
  const onDragStart = (i: number) => setDragIdx(i);

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...steps];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    onChange(next);
    setDragIdx(i);
  };

  const add = (name: string) => {
    if (steps.includes(name)) return;
    onChange([...steps, name]);
  };

  const availableTags = available.filter((k) => !steps.includes(k));
  const filtered = tagFilter
    ? availableTags.filter((k) => k.toLowerCase().includes(tagFilter.toLowerCase()))
    : availableTags;

  return (
    <div className="flex flex-col gap-2.5">
      {/* Selected steps */}
      <div className="rounded-lg border border-[#e8ecf1] bg-[#fafbfc] overflow-hidden">
        {steps.length === 0 ? (
          <div className="text-[12px] text-[#c0c4cc] text-center py-5">
            暂未添加循环步骤
          </div>
        ) : (
          steps.map((step, i) => (
            <div
              key={step}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={() => setDragIdx(null)}
              className={`flex items-center gap-2.5 px-3 py-2 cursor-default border-b border-[#eef0f2] last:border-b-0 transition-colors
                ${dragIdx === i ? "opacity-30 bg-[#f0f4ff]" : "hover:bg-[#f5f7fa]"}`}
            >
              <span className="text-[#c8ccd4] cursor-grab select-none text-xs leading-none">⠿</span>
              <span className="w-5 h-5 rounded-full bg-[#1677ff14] text-[#1677ff] text-[11px] font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-[13px] text-[#1a1a2e] select-none font-medium">{step}</span>
              <Tooltip title="移除">
                <button
                  onClick={() => rm(i)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[#c0c4cc] hover:text-[#ff4d4f] hover:bg-[#fff1f0] transition-all opacity-0 group-hover:opacity-100"
                >
                  <DeleteOutlined className="text-[11px]" />
                </button>
              </Tooltip>
            </div>
          ))
        )}
      </div>

      {/* Available steps picker */}
      {availableTags.length > 0 && (
        <div className="flex flex-col gap-2">
          {availableTags.length > 8 && (
            <Input
              size="small"
              placeholder="筛选可用步骤..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              allowClear
              className="!text-[12px]"
            />
          )}
          <div className="flex flex-wrap gap-1.5">
            {filtered.map((k) => (
              <Tag
                key={k}
                className="cursor-pointer m-0 text-[11px] px-2.5 py-0.5 rounded-full border border-dashed border-[#1677ff40] bg-[#1677ff08] text-[#1677ff] hover:bg-[#1677ff18] transition-colors"
                onClick={() => add(k)}
              >
                + {k}
              </Tag>
            ))}
            {filtered.length === 0 && tagFilter && (
              <span className="text-[12px] text-[#c0c4cc]">无匹配步骤</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ---- Main component ---- */

const TaskSettingsModal: FC<Props> = ({ open, task, stepNames, onClose }) => {
  const updateStart = useEditorStore((s) => s.updateStart);
  const updateMonitors = useEditorStore((s) => s.updateMonitors);

  // Start step: only task's own steps + own common steps, not global common
  const startStepOptions = [
    ...Object.keys(task.steps),
    ...Object.keys(task.common),
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      centered
      width={560}
      footer={null}
      styles={{ body: { maxHeight: "calc(80vh - 120px)", overflowY: "auto", paddingTop: 20 } }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1677ff] to-[#0958d9] flex items-center justify-center shadow-sm">
          <InfoCircleOutlined className="text-white text-sm" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#1a1a2e]">任务设置</div>
          <div className="text-[11px] text-[#8b8fa3]">{task.name}</div>
        </div>
      </div>

      {/* ── Basic info ── */}
      <section className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-[#1677ff]" />
          <span className="text-[13px] font-semibold text-[#1a1a2e]">基本信息</span>
        </div>

        <div className="bg-[#f8f9fb] rounded-xl p-4 border border-[#eef0f2]">
          {/* Row 1: name + version */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#8b8fa3] uppercase tracking-wide">名称</span>
              <Input
                value={task.name}
                readOnly
                variant="filled"
                className="!text-[13px] font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#8b8fa3] uppercase tracking-wide">版本</span>
              <Input
                value={task.version}
                readOnly
                variant="filled"
                className="!text-[13px] font-mono"
              />
            </div>
          </div>

          {/* Row 2: start step + author */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#8b8fa3] uppercase tracking-wide">
                起始步骤
                <Tooltip title="任务从该步骤开始执行">
                  <InfoCircleOutlined className="ml-1 text-[10px] text-[#c0c4cc]" />
                </Tooltip>
              </span>
              <Select
                className="w-full"
                size="middle"
                placeholder="选择第一个执行的步骤"
                allowClear
                value={task.start || undefined}
                options={startStepOptions.map((k) => ({ value: k, label: k }))}
                onChange={(v) => updateStart(v ?? "")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#8b8fa3] uppercase tracking-wide">作者</span>
              <Input
                value={task.author || ""}
                readOnly
                variant="filled"
                className="!text-[13px]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-[#8b8fa3] uppercase tracking-wide">描述</span>
            <Input.TextArea
              value={task.description}
              rows={3}
              placeholder="添加任务描述..."
              onChange={(e) => {
                useEditorStore.setState({
                  currentTask: { ...task, description: e.target.value },
                  isDirty: true,
                });
              }}
              className="!text-[13px]"
            />
          </div>
        </div>
      </section>

      {/* ── Monitor config ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-[#722ed1]" />
          <span className="text-[13px] font-semibold text-[#1a1a2e]">监控配置</span>
        </div>

        <div className="bg-[#f8f9fb] rounded-xl p-4 border border-[#eef0f2]">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#722ed110] flex items-center justify-center">
                <ReloadOutlined className="text-[13px] text-[#722ed1]" />
              </div>
              <span className="text-[12px] font-medium text-[#374151]">监控间隔</span>
            </div>
            <InputNumber
              value={task.monitors.interval ?? 1}
              min={0.1}
              step={0.1}
              size="middle"
              style={{ width: 90 }}
              addonAfter={<span className="text-[11px] text-[#8b8fa3]">秒</span>}
              onChange={(v) => updateMonitors({ ...task.monitors, interval: v ?? 1 })}
            />
            <span className="text-[11px] text-[#8b8fa3]">
              每隔指定秒数检查一次窗口状态
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex items-center gap-2.5 mt-1">
              <div className="w-7 h-7 rounded-lg bg-[#722ed110] flex items-center justify-center">
                <MonitorOutlined className="text-[13px] text-[#722ed1]" />
              </div>
              <span className="text-[12px] font-medium text-[#374151]">循环步骤</span>
            </div>
            <div className="flex-1">
              <LoopStepEditor
                steps={task.monitors.loop ?? []}
                available={stepNames}
                onChange={(loop) => updateMonitors({ ...task.monitors, loop })}
              />
            </div>
          </div>
        </div>
      </section>
    </Modal>
  );
};

export default TaskSettingsModal;
