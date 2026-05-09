import { memo, type FC } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { StepNodeData } from "@/types/flow";
import { PlayCircleOutlined } from "@ant-design/icons";

const StepNode: FC<NodeProps & { data: StepNodeData }> = ({ data, selected }) => {
  const { stepName, action, description, isCommon, isStart } = data;
  const bg = selected ? "#eef2ff" : "#fff";
  const border = isCommon ? "#fa8c16" : selected ? "#1677ff" : "#d0d5dd";
  const label = typeof stepName === "string" ? stepName : "";

  return (
    <div
      className="rounded-xl border-2 px-4 py-3 shadow-md min-w-[140px] max-w-[200px] transition-colors flex flex-col items-center"
      style={{ background: bg, borderColor: border }}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#8b8fa3]" />

      <div className="flex items-center justify-center gap-1.5 min-w-0">
        {isStart && <PlayCircleOutlined className="text-[#52c41a] text-xs shrink-0" />}
        <span className="text-sm font-semibold text-[#1a1a2e] truncate" title={description || undefined}>{label}</span>
      </div>

      {action && (
        <div className="flex justify-center mt-1.5">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: isCommon ? "#fff7e6" : "#eef2ff",
              color: isCommon ? "#fa8c16" : "#1677ff",
            }}
          >{action}</span>
        </div>
      )}

      <Handle
        type="source" position={Position.Bottom} id="success"
        className="!w-3 !h-3 !bg-[#52c41a] !border-2 !border-white"
        style={{ left: "15%" }} title="成功" />
      <Handle
        type="source" position={Position.Bottom} id="failure"
        className="!w-3 !h-3 !bg-[#ff4d4f] !border-2 !border-white"
        style={{ left: "50%" }} title="失败" />
      <Handle
        type="source" position={Position.Bottom} id="next"
        className="!w-3 !h-3 !bg-[#8b8fa3] !border-2 !border-white"
        style={{ left: "85%" }} title="下一步" />
    </div>
  );
};

export default memo(StepNode);
