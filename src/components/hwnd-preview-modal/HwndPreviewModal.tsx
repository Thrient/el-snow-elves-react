import type { FC } from "react"
import { useEffect, useState } from "react"
import { Modal, Spin, Tooltip } from "antd"
import { LoadingOutlined } from "@ant-design/icons"

export interface HwndImage {
  hwnd: string
  base64: string
}

interface Props {
  open?: boolean
  onClose?: () => void
  onSelect?: (hwnd: string, base64: string) => void
}

const HwndPreviewModal: FC<Props> = (props) => {


  const {
    open = true,
    onClose = () => {},
    onSelect = () => {}
  } = props

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HwndImage[]>([])

  useEffect(() => {
    if (!open) return

    window.pywebview?.api.emit("API:SCRIPT:SEARCH")
      .then((result: HwndImage[]) => {
        setData(result ?? [])
        setLoading(false)
      })
  }, [open])

  const handleClick = (item: HwndImage) => {
    onClose()
    onSelect(item.hwnd, item.base64)
  }

  return (
    <Modal
      title="绑定窗口"
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      width={640}
    >
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin indicator={<LoadingOutlined spin />} size="large" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-h-[65vh] overflow-y-auto p-1">
          {data.map((item) => (
            <div
              key={item.hwnd}
              onClick={() => handleClick(item)}
              className="border border-[#e5e7eb] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#1677ff] hover:shadow-md"
            >
              <Tooltip title={`HWND: ${item.hwnd}`}>
                <img
                  src={item.base64}
                  alt={item.hwnd}
                  className="w-full h-auto block"
                />
              </Tooltip>
              <div className="flex justify-center px-3 py-2 text-xs text-[#666] bg-[#fafafa] border-t border-[#e5e7eb]">
                {item.hwnd}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default HwndPreviewModal
