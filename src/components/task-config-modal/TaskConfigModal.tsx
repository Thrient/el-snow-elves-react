import { useState } from "react"
import type { FC } from "react"
import { Modal } from "antd"
import type { Task } from "@/types/task.ts"
import SettingsField from "@/components/settings-field/SettingsField"

interface Props {
  open: boolean
  task: Task | null
  onClose: () => void
  onSave: (values: Record<string, unknown>) => void
}

const TaskConfigModal: FC<Props> = ({ open, task, onClose, onSave }) => {
  const [formValues, setFormValues] = useState<Record<string, unknown>>(
    () => task?.values ?? {}
  )

  const handleOk = () => {
    onSave(formValues)
    onClose()
  }

  if (!task) return null

  const { layout } = task

  return (
    <Modal title={`配置 - ${task.name}`} open={open} onCancel={onClose} onOk={handleOk} centered>
      <div
        className="grid gap-x-4 gap-y-3 mt-4"
        style={{ gridTemplateColumns: `repeat(24, 1fr)` }}
      >
        {layout.map((row, rowIndex) => {
          let col = 1
          return row.map((cell) => {
            const start = col
            col += cell.span ?? 1
            return (
              <div
                key={cell.store ?? cell.text ?? rowIndex}
                style={{
                  gridRow: rowIndex + 1,
                  gridColumn: `${start} / span ${cell.span ?? 1}`,
                }}
              >
                <SettingsField
                  cell={cell}
                  value={cell.store ? formValues[cell.store] : undefined}
                  onChange={cell.store
                    ? (v) => setFormValues((prev) => ({ ...prev, [cell.store as string]: v }))
                    : () => {}
                  }
                />
              </div>
            )
          })
        })}
      </div>
    </Modal>
  )
}

export type { Props as TaskConfigModalProps }
export default TaskConfigModal
