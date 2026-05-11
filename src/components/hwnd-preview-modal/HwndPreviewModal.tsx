import type { FC } from "react"
import { useEffect, useState } from "react"
import { Modal, Spin, Empty } from "antd"
import { DesktopOutlined, LoadingOutlined } from "@ant-design/icons"

export interface HwndImage {
  hwnd: string
  base64: string
}

interface Props {
  open?: boolean
  onClose?: () => void
  onSelect?: (hwnd: string) => void
}

const HwndPreviewModal: FC<Props> = (props) => {
  const {
    open = true,
    onClose = () => {},
    onSelect = () => {},
  } = props

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HwndImage[]>([])

  useEffect(() => {
    if (!open) return

    setLoading(true)
    window.pywebview?.api.emit("API:SCRIPT:SEARCH")
      .then((result: HwndImage[]) => {
        setData(result ?? [])
        setLoading(false)
      })
  }, [open])

  const handleClick = (item: HwndImage) => {
    onClose()
    onSelect(item.hwnd)
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 rounded-full bg-[#1677ff]" />
          <span className="text-[15px] font-semibold text-[#1a1a2e] tracking-tight">绑定窗口</span>
          {!loading && (
            <span className="text-[11px] text-[#8b8fa3] bg-[#f5f5f7] px-2 py-0.5 rounded-full font-medium">
              {data.length} 个可用
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      centered
      footer={null}
      width={680}
      classNames={{ body: "!pt-3 !pb-4" }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spin indicator={<LoadingOutlined spin className="!text-3xl !text-[#1677ff]" />} />
          <span className="text-[13px] text-[#8b8fa3]">正在搜索可绑定窗口...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16">
          <Empty
            image={<DesktopOutlined className="!text-4xl !text-[#d0d0d0]" />}
            description={
              <span className="text-[13px] text-[#b0b8c4]">
                未发现可绑定的游戏窗口
              </span>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {data.map((item) => (
            <div
              key={item.hwnd}
              onClick={() => handleClick(item)}
              className="group rounded-xl overflow-hidden cursor-pointer border border-[#eef0f2] bg-white transition-all duration-200 hover:border-[#1677ff] hover:shadow-[0_4px_16px_rgba(22,119,255,0.1)] hover:-translate-y-0.5"
            >
              <div className="relative overflow-hidden">
                <img
                  src={item.base64}
                  alt={item.hwnd}
                  className="w-full h-auto block transition-transform duration-300 group-hover:scale-105"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#1677ff]/0 group-hover:bg-[#1677ff]/5 transition-colors duration-200 flex items-center justify-center">
                  <span className="text-white text-[12px] font-semibold bg-[#1677ff] px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md">
                    选择此窗口
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#fafbfc] border-t border-[#eef0f2] group-hover:bg-[#eef2ff] transition-colors duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-[11px] text-[#6b7280] font-mono tracking-wide truncate group-hover:text-[#1677ff] transition-colors">
                  {item.hwnd}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default HwndPreviewModal
