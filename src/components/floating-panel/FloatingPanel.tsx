import type { FC, MouseEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { Badge } from "antd"
import { ArrowDownOutlined, UnorderedListOutlined } from "@ant-design/icons"
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
  "rgba(22,119,255,0.08)",
  "rgba(82,196,26,0.08)",
  "rgba(250,140,22,0.08)",
  "rgba(114,46,209,0.08)",
  "rgba(19,194,194,0.08)",
]

const FloatingPanel: FC = () => {
  const taskList = useUserStore((s) => s.taskList)
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
          const sysStore = useUserStore.getState()
          const task = sysStore.taskList.find((t) => t._uid === swipingUid)
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

  const openConfig = (uid: number) => {
    const queue = useUserStore.getState().taskList
    const item = queue.find((t) => t._uid === uid)
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

  const handleCardMouseDown = (uid: number, e: React.MouseEvent) => {
    cardDraggingRef.current = true
    swiped.current = false
    swipeStartX.current = e.clientX / useResponsiveStore.getState().zoom
    setSwipingUid(uid)
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

  const toggle = () => {
    if (moved.current) {
      moved.current = false
      return
    }
    setExpanded((v) => !v)
  }

  return (
    <>
      {!expanded ? (
        <div
          className={`fixed z-[1000] flex items-center justify-center rounded-full cursor-pointer select-none ${draggingVisual ? "" : "transition-all duration-300"} hover:scale-110 active:scale-90`}
          style={{
            left: position.x,
            top: position.y,
            width: BALL_SIZE,
            height: BALL_SIZE,
            background: "linear-gradient(135deg, rgba(130, 100, 255, 0.5) 0%, rgba(70, 180, 255, 0.4) 50%, rgba(100, 220, 200, 0.35) 100%)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 32px rgba(100, 100, 255, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 4px rgba(0, 0, 0, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.45)",
          }}
          onMouseDown={handleMouseDown}
          onClick={toggle}
        >
          <Badge count={taskList.length} size="small" offset={[4, -4]}>
            <UnorderedListOutlined className="text-white text-lg leading-none" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }} />
          </Badge>
        </div>
      ) : (
        <div
          className="fixed z-[1000] bg-[#f8f9fb] rounded-2xl shadow-2xl border border-[#f0f0f0] select-none overflow-hidden"
          style={{ left: position.x, top: position.y, width: PANEL_WIDTH }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-move bg-white/80 backdrop-blur-sm border-b border-[#f0f0f0]"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1677ff] to-[#0958d9] flex items-center justify-center">
                <UnorderedListOutlined className="text-white text-xs" />
              </div>
              <span className="text-sm font-semibold text-[#1a1a2e] tracking-wide">任务队列</span>
              <span className="text-[11px] text-white font-medium ml-0.5 bg-[#1677ff] rounded-full px-1.5 py-0.5 leading-none">
                {taskList.length}
              </span>
            </div>
            <span
              className="text-[11px] text-[#bbb] cursor-pointer hover:text-[#1677ff] transition-colors flex items-center gap-0.5"
              onClick={toggle}
            >
              <ArrowDownOutlined className="text-[10px]" />
              收起
            </span>
          </div>

          {/* Task list */}
          <div className="p-3 max-h-[55vh] overflow-y-auto overflow-x-hidden">
            {taskList.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-[#d0d0d0] text-2xl mb-2">
                  <UnorderedListOutlined />
                </div>
                <p className="text-xs text-[#bbb] m-0">暂无任务</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {taskList.map((item, index) => (
                    <div
                      key={item._uid}
                      className="rounded-xl px-4 py-3 cursor-pointer select-none hover:shadow-md relative"
                      style={{
                        transition: swipingUid === item._uid ? 'none' : 'transform 200ms, box-shadow 200ms',
                        transform: swipingUid === item._uid ? `translateX(${swipeX}px)` : undefined,
                        backgroundColor: cardColors[index % cardColors.length],
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
                        border: "1px solid transparent",
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
                          style={{ backgroundColor: ["#1677ff", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2"][index % 5] }}
                        />
                        <span className="text-xs font-medium text-[#2d2d3a] truncate leading-normal">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  ))}
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
