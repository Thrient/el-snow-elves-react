import  { type FC } from "react";
import { useState } from "react";
import {
  ClearOutlined,
  CloseOutlined,
  DesktopOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Select, Space, Tag, Empty } from "antd";
import CircularSlider from "@/components/circular-slider/CircularSlider.tsx";
import type { Task } from "@/types/task.ts";
import { useCharacterStore } from "@/store/character.ts";
import HwndPreviewModal from "@/components/hwnd-preview-modal/HwndPreviewModal.tsx";
import { useUserStore } from "@/store/user-store.ts";
import { useTaskStore } from "@/store/task-store.ts";
import TaskConfigModal from "@/components/task-config-modal/TaskConfigModal.tsx";

const DOT_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2']

const WindowsPage: FC = () => {
  const userStore = useUserStore();
  const characterStore = useCharacterStore();
  const [modalOpen, setModalOpen] = useState(false);

  const [dragUid, setDragUid] = useState<number | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [configTask, setConfigTask] = useState<Task | null>(null);
  const [configUid, setConfigUid] = useState<number | null>(null);

  const selectedCharacter = characterStore.selectedHwnd
    ? characterStore.characters.find((c) => c.hwnd === characterStore.selectedHwnd)
    : undefined;

  const closeModal = () => {
    setModalOpen(false);
  };

  const bind = () => {
    setModalOpen(true);
  };

  const openConfig = (uid: number) => {
    if (!selectedCharacter) return;
    const item = selectedCharacter.executeList.find((i) => i._uid === uid);
    if (!item) return;

    const original = useTaskStore.getState().taskList.find((t) => t.id === item.id);
    if (original) {
      setConfigUid(uid);
      setConfigTask({
        ...original,
        values: { ...item.values },
      });
      setConfigOpen(true);
    }
  };

  const closeConfig = () => {
    setConfigOpen(false);
    setConfigTask(null);
    setConfigUid(null);
  };

  const handleConfigSave = (values: Record<string, unknown>) => {
    if (configUid !== null && selectedCharacter) {
      characterStore.updateExecuteValues(selectedCharacter.hwnd, configUid, values);
    }
    closeConfig();
  };

  const handleDragStart = (uid: number) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(uid));
    setDragUid(uid);
  };

  const handleDragEnd = () => {
    setDragUid(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetUid: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const sourceUid = Number(e.dataTransfer.getData("text/plain"));
    if (isNaN(sourceUid) || sourceUid === targetUid || !selectedCharacter) return;

    const uids = selectedCharacter.executeList.map((item) => item._uid);
    const sourceIdx = uids.indexOf(sourceUid);
    const targetIdx = uids.indexOf(targetUid);
    if (sourceIdx === -1 || targetIdx === -1) return;

    uids.splice(sourceIdx, 1);
    uids.splice(targetIdx, 0, sourceUid);

    characterStore.reorderExecute(selectedCharacter.hwnd, uids);
    setDragUid(null);
  };

  return (
    <>
      <div className="flex flex-col h-[calc(100%-48px)] bg-white rounded-lg mx-4 mb-4 p-4 shadow-sm">
        {/* ---- Top bar ---- */}
        <div className="flex justify-between items-center h-10 shrink-0 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-[#1677ff]" />
            <span className="text-base font-semibold text-[#1a1a2e] tracking-tight">
              <DesktopOutlined className="mr-2 text-[#1677ff]" />窗口管理
            </span>
          </div>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={bind}>
              绑定
            </Button>
            <Button
              danger
              icon={<MinusCircleOutlined />}
              disabled={!characterStore.selectedHwnd}
              onClick={() => {
                if (!characterStore.selectedHwnd) return;
                const hwnd = characterStore.selectedHwnd;
                window.pywebview?.api.emit("API:SCRIPT:UNBIND", hwnd).then(() => {
                  characterStore.remove(hwnd);
                });
              }}
            >
              解绑
            </Button>
          </Space>
        </div>

        {/* ---- Control bar ---- */}
        <div className="bg-[#f9fafb] rounded-xl p-3 flex items-center gap-3 flex-wrap shrink-0 border border-[#eef0f2]">
          <DesktopOutlined className="text-base text-[#8b8fa3]" />
          <span className="text-[13px] text-[#6b7280] whitespace-nowrap font-medium">选择窗口</span>
          <Select
            style={{ width: 220 }}
            placeholder="请选择游戏窗口"
            allowClear
            value={characterStore.selectedHwnd ?? undefined}
            onChange={(v) => characterStore.setSelectedHwnd(v ?? null)}
            onClear={() => characterStore.setSelectedHwnd(null)}
          >
            {characterStore.characters.map((character) => (
              <Select.Option key={character.hwnd} value={character.hwnd}>
                <Space>
                  <div className="h-full flex items-center gap-1">
                    {character.character ? (
                      <img className="h-4 rounded" src={character.character} alt="" />
                    ) : (
                      <DesktopOutlined className="text-xs text-gray-400" />
                    )}
                  </div>
                  <Tag color={character.running ? "green" : "default"} className="text-[11px] leading-none m-0">
                    {character.running ? "运行中" : "已停止"}
                  </Tag>
                </Space>
              </Select.Option>
            ))}
          </Select>

          <div className="w-px h-5 bg-[#e5e7eb] mx-0.5" />

          <Button
            type={selectedCharacter?.running ? "default" : "primary"}
            icon={selectedCharacter?.running ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            disabled={!characterStore.selectedHwnd}
            onClick={() => {
              if (!characterStore.selectedHwnd) return;
              const hwnd = characterStore.selectedHwnd;
              const wasRunning = selectedCharacter?.running;
              const action = wasRunning ? "API:SCRIPT:PAUSE" : "API:SCRIPT:RESUME";
              window.pywebview?.api.emit(action, hwnd).then(() => {
                const state = useCharacterStore.getState();
                const ch = state.characters.find((c) => c.hwnd === hwnd);
                if (ch) {
                  characterStore.update({ hwnd, running: !ch.running });
                }
              });
            }}
          >
            {selectedCharacter?.running ? "暂停" : "开始执行"}
          </Button>

          <Button
            icon={<ClearOutlined />}
            disabled={!selectedCharacter?.executeList.length}
            onClick={() => {
              if (characterStore.selectedHwnd) {
                characterStore.clearExecute(characterStore.selectedHwnd);
              }
            }}
          >
            清空列表
          </Button>

          <span className="text-xs text-[#8b8fa3] ml-auto">
            {selectedCharacter?.executeList.length ?? 0} 个待执行
          </span>
        </div>

        {/* ---- Content area ---- */}
        <div className="flex-1 min-h-0 mt-4">
          {!selectedCharacter ? (
            <div className="h-full flex items-center justify-center">
              <Empty description="请先绑定或选择游戏窗口" />
            </div>
          ) : (
            <div className="flex gap-5 h-full">
              {/* ---- Left: main panel ---- */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Status bar */}
                <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-[#eef0f2] bg-[#fafbfc]">
                  <span className="text-[11px] text-[#8b8fa3]">当前任务</span>
                  <span className={`text-[12px] truncate font-medium ${selectedCharacter.currentTask ? "text-[#374151]" : "text-[#b0b8c4]"}`}>
                    {selectedCharacter.currentTask ?? "无任务"}
                  </span>
                </div>

                {/* Action cards — add new cards here */}
                <div className="flex-1 flex flex-wrap gap-4 content-start">
                  {/* Opacity */}
                  <div className="w-fit flex items-center gap-4 px-5 py-4 rounded-xl border border-[#eef0f2] bg-white hover:border-[#d0d4dd] hover:shadow-sm transition-all duration-200">
                    <CircularSlider
                      size={72}
                      strokeWidth={7}
                      max={255}
                      value={selectedCharacter?.opacity ?? 255}
                      onChange={(v) => {
                        if (selectedCharacter) {
                          characterStore.update({ hwnd: selectedCharacter.hwnd, opacity: v });
                          window.pywebview?.api.emit("API:SCRIPT:SET_OPACITY", selectedCharacter.hwnd, v);
                        }
                      }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[13px] text-[#1a1a2e] font-semibold">透明度</span>
                      <span className="text-[11px] text-[#8b8fa3] tabular-nums">{selectedCharacter?.opacity ?? 255} / 255</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- Right: execute list ---- */}
              <div className="w-64 shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1a1a2e]">
                    <UnorderedListOutlined className="text-[#8b8fa3]" />
                    待执行任务
                  </div>
                  <span className="text-[11px] text-[#8b8fa3] bg-[#f5f5f7] px-2 py-0.5 rounded-full font-medium">
                    {selectedCharacter.executeList.length}
                  </span>
                </div>

                <div className="flex-1 rounded-xl border border-[#eef0f2] bg-[#fafbfc] overflow-y-auto">
                  {selectedCharacter.executeList.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <Empty description="暂无任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  ) : (
                    <div className="p-2 flex flex-col gap-1.5">
                      {selectedCharacter.executeList.map((item, idx) => (
                        <div
                          key={item._uid}
                          draggable
                          onDragStart={handleDragStart(item._uid)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop(item._uid)}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white border border-[#eef0f2] hover:border-[#d0d4dd] hover:shadow-sm transition-all duration-150 group cursor-grab active:cursor-grabbing"
                          style={{ opacity: dragUid === item._uid ? 0.4 : 1 }}
                          onClick={() => openConfig(item._uid)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: DOT_COLORS[idx % DOT_COLORS.length] }}
                            />
                            <span className="text-[12px] text-[#1a1a2e] truncate font-medium">{item.name}</span>
                            <Tag className="text-[10px] leading-none border-none rounded-sm px-1.5 py-0.5 m-0 text-[#999] bg-[#f5f5f5] font-mono">
                              v{item.version}
                            </Tag>
                          </div>
                          <span
                            className="flex items-center justify-center w-5 h-5 rounded-md text-[#ccc] hover:text-[#ff4d4f] hover:bg-[#fff1f0] cursor-pointer opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              characterStore.removeExecute(selectedCharacter.hwnd, item._uid);
                            }}
                          >
                            <CloseOutlined className="text-[11px]" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen ? (
        <HwndPreviewModal
          onClose={closeModal}
          onSelect={(hwnd: string) => {
            window.pywebview?.api.emit("API:SCRIPT:BIND", hwnd)
              .then(() => {
                characterStore.add({
                  character: "",
                  hwnd: hwnd,
                  running: true,
                  opacity: 255,
                  currentTask: null,
                  executeList: userStore.queue.map((t) => ({
                    id: t.id,
                    name: t.name,
                    version: t.version,
                    values: t.values,
                  })),
                });
                characterStore.setSelectedHwnd(hwnd);
              })
          }}
        />
      ) : null}

      <TaskConfigModal
        key={configUid ?? "none"}
        open={configOpen}
        task={configTask}
        onClose={closeConfig}
        onSave={handleConfigSave}
      />
    </>
  );
};

export default WindowsPage;
