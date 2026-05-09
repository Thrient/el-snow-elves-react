export const ACTION_OPTS = [
  { value: "touch",          label: "touch",          desc: "识别模板并点击" },
  { value: "exits",          label: "exits",          desc: "检测模板是否存在" },
  { value: "wait",           label: "wait",           desc: "等待模板出现" },
  { value: "wait_disappear", label: "wait_disappear", desc: "等待模板消失" },
  { value: "key_click",      label: "key_click",      desc: "发送按键" },
  { value: "mouse_click",    label: "mouse_click",    desc: "点击坐标" },
  { value: "set_character",  label: "set_character",  desc: "捕获角色头像" },
  { value: "{True}",         label: "{True}",         desc: "无条件通过" },
];

export const PARAM_META: Record<string, { label: string; color: string }> = {
  threshold:  { label: "匹配阈值",     color: "#ef4444" },
  seconds:    { label: "最大运行时间",  color: "#f59e0b" },
  k:          { label: "匹配灵敏度",    color: "#8b5cf6" },
  click_mode: { label: "点击方式",     color: "#06b6d4" },
  box:        { label: "匹配区域",     color: "#ec4899" },
  key:        { label: "按键名称",     color: "#3b82f6" },
  pos:        { label: "点击坐标",     color: "#10b981" },
  pre_delay:  { label: "操作前延迟",    color: "#f97316" },
  post_delay: { label: "操作后延迟",    color: "#84cc16" },
};

export const ACTION_PARAMS: Record<string, string[]> = {
  touch:          ["threshold", "click_mode", "box", "pos", "pre_delay", "post_delay", "seconds", "k"],
  exits:          ["threshold", "seconds"],
  wait:           ["threshold", "seconds"],
  wait_disappear: ["threshold", "seconds"],
  key_click:      ["key", "pre_delay", "post_delay"],
  mouse_click:    ["pos", "pre_delay", "post_delay"],
  set_character:  [],
  "{True}":       [],
};

export const ACTIONS_WITH_TEMPLATES = new Set(["touch", "exits", "wait", "wait_disappear"]);
export const PLAIN_VALUE_PARAMS = new Set(["threshold", "seconds", "k", "pos", "box", "pre_delay", "post_delay"]);

export const BUILTIN_VARS: { value: string; label: string }[] = [
  { value: "{result}",  label: "{result} — 步骤返回值" },
];

export interface EditorCtx {
  stepKeys: string[];
  variableOptions: { value: string; label: string }[];
  stepParamsMap: Record<string, Record<string, unknown>>;
  hwnd: string;
}
