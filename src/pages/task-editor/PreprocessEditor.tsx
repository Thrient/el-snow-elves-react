import type { FC } from "react";
import { Switch, InputNumber, Divider, Tooltip } from "antd";
import { BulbOutlined } from "@ant-design/icons";

export interface PreprocessConfig {
  binarize?: boolean;
  binarize_threshold?: number;
  binarize_invert?: boolean;
  adaptive?: boolean;
  adaptive_block?: number;
  adaptive_c?: number;
}

interface Props {
  value: PreprocessConfig | undefined;
  onChange: (v: PreprocessConfig) => void;
  onRemove?: () => void;
}

const fieldDoc: Record<string, { label: string; tip: string; range?: string }> = {
  binarize:           { label: "二值化",              tip: "将灰度图转为纯黑白，消除纹理干扰。阈值由下方「固定阈值」控制，0 时自动用 OTSU" },
  binarize_threshold: { label: "固定阈值",            tip: "二值化的阈值。0 = OTSU 自动计算；设为 100-180 手动控制。值越大黑色越多", range: "0 = 自动" },
  binarize_invert:    { label: "反转颜色",            tip: "黑变白、白变黑。适合亮色目标在暗色背景上的场景" },
  adaptive:           { label: "自适应阈值",          tip: "将图像分块独立计算阈值，适合光照不均、渐变背景。启用后二值化失效" },
  adaptive_block:     { label: "自适应块大小",        tip: "分块大小（像素）。越小越敏感但噪声越多，需为奇数", range: "9 ~ 15" },
  adaptive_c:         { label: "自适应常数",          tip: "从每块均值中减去的值。越大匹配越宽松，越小越严格", range: "2 ~ 5" },
};

const PreprocessEditor: FC<Props> = ({ value, onChange, onRemove }) => {
  const cfg = value ?? {};

  const update = (k: keyof PreprocessConfig, v: unknown) => {
    const next = { ...cfg, [k]: v };
    // 清理无意义的默认值
    if (k === "binarize_threshold" && v === 0) delete next.binarize_threshold;
    if (k === "adaptive_block" && v === 11) delete next.adaptive_block;
    if (k === "adaptive_c" && v === 2) delete next.adaptive_c;
    // 清理空对象
    const keys = Object.keys(next).filter(kk => next[kk as keyof PreprocessConfig] !== false && next[kk as keyof PreprocessConfig] !== undefined);
    if (keys.length === 0) {
      onChange(undefined as unknown as PreprocessConfig);
    } else {
      onChange(next);
    }
  };

  const Row: FC<{ field: keyof PreprocessConfig; control: React.ReactNode }> = ({ field, control }) => {
    const doc = fieldDoc[field];
    return (
      <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#f9fafb] transition-colors">
        <Tooltip title={doc.tip} placement="left">
          <div className="flex items-center gap-1.5 cursor-help">
            <span className="text-[12px] text-[#374151] select-none">{doc.label}</span>
            {doc.range && (
              <span className="text-[10px] text-[#c0c4cc] font-mono">{doc.range}</span>
            )}
          </div>
        </Tooltip>
        {control}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-dashed bg-white" style={{ borderColor: "rgba(139,92,246,0.3)", background: "linear-gradient(135deg, rgba(139,92,246,0.04), #fff)" }}>
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <span className="flex items-center justify-center w-5 h-5 rounded-md shrink-0 text-[13px]" style={{ background: "rgba(139,92,246,0.12)", color: "#8b5cf6" }}>
          <BulbOutlined />
        </span>
        <span className="text-[12px] font-semibold text-[#1a1a2e]">图像预处理</span>
        <span className="text-[10px] text-[#8b8fa3] ml-auto">选填，不设则不处理</span>
        {onRemove && (
          <button onClick={onRemove}
            className="text-[#c0c4cc] hover:text-[#ff4d4f] transition-colors text-xs shrink-0 border-0 bg-transparent cursor-pointer">×</button>
        )}
      </div>
      <div className="px-3.5 pb-3 space-y-1 pt-2">

      {/* 二值化 */}
      <div className="rounded-md border border-[#e8e0f0] bg-white px-1">
        <Row field="binarize" control={
          <Switch size="small" checked={cfg.binarize ?? false}
            onChange={(v) => update("binarize", v || undefined)} />
        } />
        {cfg.binarize && (
          <>
            <Divider className="!my-0" style={{ borderColor: "#e8e0f0" }} />
            <Row field="binarize_threshold" control={
              <InputNumber size="small" min={0} max={255} step={5}
                style={{ width: 72 }}
                value={cfg.binarize_threshold ?? 0}
                onChange={(v) => update("binarize_threshold", v ?? 0)} />
            } />
          </>
        )}
      </div>

      {/* 反转 */}
      <div className="rounded-md border border-[#e8e0f0] bg-white px-1">
        <Row field="binarize_invert" control={
          <Switch size="small" checked={cfg.binarize_invert ?? false}
            onChange={(v) => update("binarize_invert", v || undefined)} />
        } />
      </div>

      {/* 自适应 */}
      <div className="rounded-md border border-[#e8e0f0] bg-white px-1">
        <Row field="adaptive" control={
          <Switch size="small" checked={cfg.adaptive ?? false}
            onChange={(v) => update("adaptive", v || undefined)} />
        } />
        {cfg.adaptive && (
          <>
            <Divider className="!my-0" style={{ borderColor: "#e8e0f0" }} />
            <Row field="adaptive_block" control={
              <InputNumber size="small" min={5} max={31} step={2}
                style={{ width: 72 }}
                value={cfg.adaptive_block ?? 11}
                onChange={(v) => update("adaptive_block", v ?? 11)} />
            } />
            <Divider className="!my-0" style={{ borderColor: "#e8e0f0" }} />
            <Row field="adaptive_c" control={
              <InputNumber size="small" min={0} max={10}
                style={{ width: 72 }}
                value={cfg.adaptive_c ?? 2}
                onChange={(v) => update("adaptive_c", v ?? 2)} />
            } />
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default PreprocessEditor;
