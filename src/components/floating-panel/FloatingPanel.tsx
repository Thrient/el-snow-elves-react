import type { FC, MouseEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { Badge } from "antd"
import { ArrowDownOutlined, UnorderedListOutlined, InboxOutlined } from "@ant-design/icons"
import { useUserStore } from "@/store/user-store.ts"
import { useCharacterStore } from "@/store/character.ts"
import { useTaskStore } from "@/store/task-store.ts"
import { useResponsiveStore } from "@/store/responsive-store.ts"
import type { Task } from "@/types/task.ts"
import TaskConfigModal from "@/components/task-config-modal/TaskConfigModal.tsx"

const PANEL_WIDTH = 260
const BALL_SIZE = 40
const EDGE_THRESHOLD = 80
const SWIPE_THRESHOLD = 80

const cardColors = [
  "rgba(22,119,255,0.06)",
  "rgba(82,196,26,0.06)",
  "rgba(250,140,22,0.06)",
  "rgba(114,46,209,0.06)",
  "rgba(19,194,194,0.06)",
]

const cardBorderColors = [
  "rgba(22,119,255,0.12)",
  "rgba(82,196,26,0.12)",
  "rgba(250,140,22,0.12)",
  "rgba(114,46,209,0.12)",
  "rgba(19,194,194,0.12)",
]

const dotColors = ["#1677ff", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2"]

const FloatingPanel: FC = () => {
  const queue = useUserStore((s) => s.queue)
  const [expanded, setExpanded] = useState(false)
  const [position, setPosition] = useState({ x: 16, y: 120 })
  const posRef = useRef(position)
  const dragging = useRef(false)
  const [draggingVisual, setDraggingVisual] = useState(false)
  const offset = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  const [configOpen, setConfigOpen] = useState(false)
  const [configTask, setConfigTask] = useState<Task | null>(null)
  const [configUid, setConfigUid] = useState<number | null>(null)

  const updateTaskValues = useUserStore((s) => s.updateTaskValues)
  const removeTask = useUserStore((s) => s.removeTask)

  const [swipingUid, setSwipingUid] = useState<number | null>(null)
  const [swipeX, setSwipeX] = useState(0)
  const swipeXRef = useRef(0)
  const cardDraggingRef = useRef(false)
  const swipeStartX = useRef(0)
  const swiped = useRef(false)

  // ---- Card swipe handlers ----
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!cardDraggingRef.current || swipingUid === null) return
      const dx = e.clientX / useResponsiveStore.getState().zoom - swipeStartX.current
      swiped.current = true
      const clamped = Math.max(-180, Math.min(dx, 180))
      swipeXRef.current = clamped
      setSwipeX(clamped)
    }

    const handleMouseUp = () => {
      if (!cardDraggingRef.current) return
      cardDraggingRef.current = false
      if (swipingUid !== null) {
        const finalX = swipeXRef.current
        if (finalX > SWIPE_THRESHOLD) {
          removeTask(swipingUid)
        } else if (finalX < -SWIPE_THRESHOLD) {
          const userState = useUserStore.getState()
          const task = userState.queue.find((t) => t._uid === swipingUid)
          if (task) {
            const charStore = useCharacterStore.getState()
            if (charStore.selectedHwnd) {
              charStore.pushExecute(charStore.selectedHwnd, {
                id: task.id,
                name: task.name,
                version: task.version,
                values: task.values,
              })
            }
          }
        }
      }
      setSwipingUid(null)
      setSwipeX(0)
      swipeXRef.current = 0
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [swipingUid, removeTask])

  // ---- Panel drag handlers ----
  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (!dragging.current) return
      moved.current = true
      const z = useResponsiveStore.getState().zoom
      const next = {
        x: e.clientX / z - offset.current.x,
        y: e.clientY / z - offset.current.y,
      }
      posRef.current = next
      setPosition(next)
    }

    const handleMouseUp = () => {
      if (!dragging.current) return
      dragging.current = false
      setDraggingVisual(false)

      setPosition((prev) => {
        const z = useResponsiveStore.getState().zoom
        const w = expanded ? PANEL_WIDTH : BALL_SIZE
        const maxX = window.innerWidth / z - w - 8
        let x = Math.max(0, Math.min(prev.x, maxX))

        if (x < EDGE_THRESHOLD) x = 0
        else if (x > maxX - EDGE_THRESHOLD) x = maxX

        const y = Math.max(0, Math.min(prev.y, window.innerHeight / z - 60))
        const snapped = { x, y }
        posRef.current = snapped
        return snapped
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [expanded])

  // ---- Click handlers ----
  const toggle = () => {
    if (moved.current) {
      moved.current = false
      return
    }
    setExpanded((v) => !v)
  }

  const handleMouseDown = (e: MouseEvent) => {
    dragging.current = true
    setDraggingVisual(true)
    moved.current = false
    const z = useResponsiveStore.getState().zoom
    offset.current = {
      x: e.clientX / z - posRef.current.x,
      y: e.clientY / z - posRef.current.y,
    }
  }

  const handleCardMouseDown = (uid: number, e: React.MouseEvent) => {
    cardDraggingRef.current = true
    swiped.current = false
    swipeStartX.current = e.clientX / useResponsiveStore.getState().zoom
    setSwipingUid(uid)
  }

  // ---- Config modal ----
  const openConfig = (uid: number) => {
    const itemQueue = useUserStore.getState().queue
    const item = itemQueue.find((t) => t._uid === uid)
    if (!item) return
    const taskStore = useTaskStore.getState()
    const original = taskStore.taskList.find((t) => t.id === item.id)
    if (original) {
      setConfigTask({ ...original, values: item.values })
      setConfigUid(uid)
      setConfigOpen(true)
    }
  }

  const closeConfig = () => {
    setConfigOpen(false)
    setConfigTask(null)
    setConfigUid(null)
  }

  const handleConfigSave = (values: Record<string, unknown>) => {
    if (configUid !== null) {
      updateTaskValues(configUid, values)
    }
    closeConfig()
  }

  const swipeIndicator = (x: number) => {
    if (x > 40) return { bg: "rgba(255,77,79,0.08)", text: "删除", color: "#ff4d4f" }
    if (x < -40) return { bg: "rgba(22,119,255,0.08)", text: "添加到窗口", color: "#1677ff" }
    return null
  }

  return (
    <>
      {/* ---- Collapsed: floating ball ---- */}
      {!expanded ? (
        <div className="fixed z-[1000]" style={{ left: position.x, top: position.y }}>
          {/* Pulse ring when has items */}
          {queue.length > 0 && (
            <div
              className="absolute rounded-full animate-pulse"
              style={{
                left: -4, top: -4,
                width: BALL_SIZE + 8, height: BALL_SIZE + 8,
                border: "1.5px solid rgba(100,140,255,0.25)",
                animation: "pulse-ring 2.5s ease-out infinite",
              }}
            />
          )}

          <div
            className={`relative flex items-center justify-center rounded-full cursor-pointer select-none ${
              draggingVisual ? "" : "transition-all duration-300 hover:scale-110 active:scale-95"
            }`}
            style={{
              width: BALL_SIZE,
              height: BALL_SIZE,
              background: "linear-gradient(145deg, rgba(120,145,255,0.5) 0%, rgba(80,165,255,0.4) 35%, rgba(110,215,205,0.35) 100%)",
              backdropFilter: "blur(18px) saturate(160%)",
              WebkitBackdropFilter: "blur(18px) saturate(160%)",
              boxShadow: [
                "0 4px 24px rgba(80,100,220,0.22)",
                "0 1px 4px rgba(80,100,220,0.12)",
                "inset 0 1px 0 rgba(255,255,255,0.6)",
                "inset 0 -2px 3px rgba(0,0,0,0.03)",
              ].join(", "),
              border: "1px solid rgba(255,255,255,0.55)",
            }}
            onMouseDown={handleMouseDown}
            onClick={toggle}
          >
            <Badge
              count={queue.length}
              size="small"
              offset={[3, -5]}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
            >
              <UnorderedListOutlined
                className="text-white text-[17px] leading-none"
                style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.18))" }}
              />
            </Badge>
          </div>
        </div>
      ) : (
        /* ---- Expanded: queue panel ---- */
        <div
          className="fixed z-[1000] rounded-2xl shadow-2xl border select-none overflow-hidden animate-fadeIn"
          style={{
            left: position.x,
            top: position.y,
            width: PANEL_WIDTH,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px) saturate(150%)",
            WebkitBackdropFilter: "blur(20px) saturate(150%)",
            borderColor: "rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-move border-b"
            style={{ borderColor: "rgba(0,0,0,0.05)", background: "rgba(255,255,255,0.6)" }}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1677ff] to-[#0958d9] flex items-center justify-center shadow-sm">
                <UnorderedListOutlined className="text-white text-[11px]" />
              </div>
              <span className="text-[13px] font-semibold text-[#1a1a2e] tracking-tight">任务队列</span>
              <span className="text-[10px] text-white font-semibold bg-[#1677ff] rounded-full px-1.5 py-0.5 leading-none">
                {queue.length}
              </span>
            </div>
            <span
              className="text-[11px] text-[#bbb] cursor-pointer hover:text-[#1677ff] transition-colors flex items-center gap-1"
              onClick={toggle}
            >
              <ArrowDownOutlined className="text-[10px]" />
              收起
            </span>
          </div>

          {/* Task list */}
          <div className="p-3 max-h-[55vh] overflow-y-auto overflow-x-hidden">
            {queue.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-[#e0e0e0] text-2xl mb-3">
                  <InboxOutlined />
                </div>
                <p className="text-[12px] text-[#bbb] m-0">暂无任务</p>
                <p className="text-[11px] text-[#d0d0d0] mt-1 m-0">在任务管理中添加</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {queue.map((item, index) => {
                  const indicator = swipingUid === item._uid ? swipeIndicator(swipeX) : null
                  return (
                    <div key={item._uid} className="relative overflow-hidden rounded-xl">
                      {/* Swipe action indicator */}
                      {indicator && (
                        <div
                          className="absolute inset-0 rounded-xl flex items-center px-4 text-[11px] font-semibold transition-opacity duration-100"
                          style={{
                            backgroundColor: indicator.bg,
                            color: indicator.color,
                            justifyContent: swipeX > 0 ? "flex-start" : "flex-end",
                          }}
                        >
                          {indicator.text}
                        </div>
                      )}

                      <div
                        className="rounded-xl px-4 py-3 cursor-pointer select-none relative"
                        style={{
                          transition: swipingUid === item._uid ? "none" : "transform 180ms ease, box-shadow 180ms ease",
                          transform: swipingUid === item._uid ? `translateX(${swipeX}px)` : undefined,
                          backgroundColor: cardColors[index % cardColors.length],
                          border: `1px solid ${cardBorderColors[index % cardBorderColors.length]}`,
                        }}
                        onClick={() => {
                          if (swiped.current) {
                            swiped.current = false
                            return
                          }
                          openConfig(item._uid)
                        }}
                        onMouseDown={(e) => handleCardMouseDown(item._uid, e)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dotColors[index % dotColors.length] }}
                          />
                          <span className="text-[12px] font-medium text-[#1a1a2e] truncate leading-normal">
                            {item.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <TaskConfigModal
        key={configUid ?? "none"}
        open={configOpen}
        task={configTask}
        onClose={closeConfig}
        onSave={handleConfigSave}
      />
    </>
  )
}

export default FloatingPanel
