import  { type FC } from "react";
import { useState } from "react";
import {
  CameraOutlined,
  ClearOutlined,
  CloseOutlined,
  DesktopOutlined,
  MinusCircleOutlined,
  PictureOutlined,
  PlayCircleOutlined,
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

const WindowsPage: FC = () => {
  const userStore = useUserStore();
  const characterStore = useCharacterStore();
  const [modalOpen, setModalOpen] = useState(false);

  const [screenshotFlash, setScreenshotFlash] = useState(false);
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
      <div className="flex flex-col h-[calc(100%-48px)] bg-white rounded-lg m-x-4 p-xy m-b-4 shadow-md ">
        {/* Top bar */}
        <div className="flex justify-between items-center h-40px shrink-0">
          <span className="text-lg font-bold text-[#1a1a2e]">
            <DesktopOutlined /> 窗口管理
          </span>

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

        <div className="bg-[#f9fafbff] rounded-lg p-3 flex items-center gap-2 flex-wrap shrink-0">
          <DesktopOutlined className="text-lg" />
          <span className="text-sm whitespace-nowrap">选择游戏窗口：</span>
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
                      <img className="h-4" src={character.character} alt="" />
                    ) : (
                      <span className="flex items-center gap-1">
                        <DesktopOutlined
                          className="text-xs text-gray-400"
                          style={{ transform: "translateY(1px)" }}
                        />
                        <span className="text-xs text-gray-400">暂无截图</span>
                      </span>
                    )}
                  </div>
                  <Tag color={character.running ? "green" : "default"}>
                    {character.running ? "运行中" : "已停止"}
                  </Tag>
                </Space>
              </Select.Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!characterStore.selectedHwnd}
            onClick={() => {
              if (!characterStore.selectedHwnd) return;
              const hwnd = characterStore.selectedHwnd;
              const wasRunning = selectedCharacter?.running;
              // TODO: call backend API to start/stop execution, then update status
              window.pywebview?.api.emit(wasRunning ? "API:SCRIPT:PAUSE" : "API:SCRIPT:RESUME", hwnd).then(() => {
                const char = characterStore.characters.find((c) => c.hwnd === hwnd);
                if (char) {
                  characterStore.update({ ...char, running: !wasRunning, currentTask: wasRunning ? null : char.currentTask });
                }
              });
            }}
          >
            {selectedCharacter?.running ? "停止运行" : "开始执行"}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              if (characterStore.selectedHwnd) {
                characterStore.clearExecute(characterStore.selectedHwnd);
              }
            }}
          >
            清空列表
          </Button>
          <span className="text-xs text-gray-400">
            共 {selectedCharacter?.executeList.length ?? 0} 个任务
          </span>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 mt-4">
          {!selectedCharacter ? (
            <div className="h-full flex items-center justify-center">
              <Empty description="请先选择游戏窗口" />
            </div>
          ) : (
            <div className="flex gap-5 h-full">
              {/* Left: main panel */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Preview card */}
                <div className="relative flex-1 min-h-0 rounded-xl border border-[#eef0f2] bg-[#f9fafb] overflow-hidden group">
                  {selectedCharacter.preview ? (
                    <img
                      src={selectedCharacter.preview}
                      alt="game preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#f0f2f5] flex items-center justify-center">
                        <PictureOutlined className="text-2xl text-[#b0b8c4]" />
                      </div>
                      <span className="text-sm text-[#b0b8c4]">窗口预览</span>
                    </div>
                  )}
                  {/* HWND badge overlay */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-sm text-xs text-white font-mono">
                    {selectedCharacter.hwnd}
                  </div>
                  {/* Status dot */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                    <span className={`w-2 h-2 rounded-full ${selectedCharacter.running ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-xs text-white">{selectedCharacter.running ? "运行中" : "已停止"}</span>
                  </div>
                </div>

                {/* Action cards row */}
                <div className="flex gap-4 shrink-0">
                  {/* Screenshot card */}
                  <div
                    className={`flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border transition-all cursor-pointer select-none ${
                      screenshotFlash
                        ? "border-[#1677ff] bg-[#eef2ff] scale-97 shadow-[0_0_0_3px_rgba(22,119,255,0.15)]"
                        : "border-[#eef0f2] bg-white hover:border-[#dde0e6] hover:shadow-sm"
                    }`}
                    onClick={() => {
                      if (!characterStore.selectedHwnd) return;
                      setScreenshotFlash(true);
                      setTimeout(() => setScreenshotFlash(false), 200);
                      window.pywebview?.api.emit("API:SCRIPT:SCREENSHOT", characterStore.selectedHwnd);
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#eef2ff] flex items-center justify-center shrink-0">
                      <CameraOutlined className="text-lg text-[#1677ff]" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-[#1a1a2e] font-medium">截图</span>
                      <span className="text-xs text-[#8b8fa3]">捕获当前窗口画面</span>
                    </div>
                  </div>

                  {/* Opacity card */}
                  <div className="flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border border-[#eef0f2] bg-white hover:border-[#dde0e6] hover:shadow-sm transition-all">
                    <CircularSlider
                      size={48}
                      strokeWidth={5}
                      max={255}
                      value={selectedCharacter?.opacity ?? 255}
                      onChange={(v) => {
                        if (selectedCharacter) {
                          characterStore.update({ ...selectedCharacter, opacity: v });
                          window.pywebview?.api.emit("API:SCRIPT:SET_OPACITY", selectedCharacter.hwnd, v);
                        }
                      }}
                    />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-[#1a1a2e] font-medium">透明度</span>
                      <span className="text-xs text-[#8b8fa3]">{selectedCharacter?.opacity ?? 255} / 255</span>
                    </div>
                  </div>

                  {/* Current task card */}
                  <div className="flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border border-[#eef0f2] bg-white hover:border-[#dde0e6] hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-lg bg-[#f0faf4] flex items-center justify-center shrink-0">
                      <PlayCircleOutlined className="text-lg text-[#52c41a]" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm text-[#1a1a2e] font-medium">当前任务</span>
                      <span className="text-xs text-[#8b8fa3] truncate">{selectedCharacter.currentTask ?? "无任务"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: task list */}
              <div className="w-64 shrink-0 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#1a1a2e]">
                    <UnorderedListOutlined />
                    待执行任务
                  </div>
                  <span className="text-xs text-[#8b8fa3] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
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
                      {selectedCharacter.executeList.map((item) => (
                        <div
                          key={item._uid}
                          draggable
                          onDragStart={handleDragStart(item._uid)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop(item._uid)}
                          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white border border-[#f0f0f0] hover:border-[#e0e2e6] hover:shadow-sm transition-all group cursor-grab active:cursor-grabbing"
                          style={{
                            opacity: dragUid === item._uid ? 0.4 : 1,
                          }}
                          onClick={() => openConfig(item._uid)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  ["#1677ff", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2"][
                                    item._uid % 5
                                  ],
                              }}
                            />
                            <span className="text-xs text-[#2d2d3a] truncate">{item.name}</span>
                            <Tag className="text-[10px] leading-none border-none rounded-sm px-1 py-0.5 m-0 text-[#999] bg-[#f5f5f5]">
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
                            <CloseOutlined className="text-xs" />
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
          onSelect={(hwnd: string, base64: string) => {
            window.pywebview?.api.emit("API:SCRIPT:BIND", hwnd)
              .then(() => {
                characterStore.add({
                  character: "",
                  preview: base64,
                  hwnd: hwnd,
                  running: true,
                  opacity: 255,
                  currentTask: null,
                  executeList: userStore.taskList.map((t) => ({
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
