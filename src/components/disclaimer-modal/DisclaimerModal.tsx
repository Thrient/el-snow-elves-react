import { Modal, Checkbox, Button, Typography, Space, Divider } from 'antd'
import { useState } from 'react'
import { useSysStore } from '@/store/sys-store'

const { Title, Paragraph, Text } = Typography

export default function DisclaimerModal() {
  const [checked, setChecked] = useState(false)
  const disclaimerAccepted = useSysStore((s) => s.disclaimerAccepted)
  const acceptDisclaimer = useSysStore((s) => s.acceptDisclaimer)

  return (
    <Modal
      open={!disclaimerAccepted}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      width={560}
      centered
      className="disclaimer-modal"
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="text-center">
          <Title level={3} className="!mb-1">
            免责声明
          </Title>
          <Text type="secondary" className="text-sm">
            请仔细阅读以下内容
          </Text>
        </div>

        <Divider className="!my-0" />

        <div
          className="text-left text-sm leading-relaxed flex flex-col gap-3 max-h-60 overflow-y-auto pr-1"
          style={{ color: 'var(--text)' }}
        >
          <Paragraph className="!mb-0">
            欢迎使用 <Text strong>时雪</Text>（Elves Snow）游戏辅助工具。在您使用本工具前，请仔细阅读并理解以下条款：
          </Paragraph>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                1.
              </Text>
              <Text>
                本工具仅供<Text strong>个人学习、研究和技术交流</Text>之用，不得用于任何商业用途。
              </Text>
            </div>

            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                2.
              </Text>
              <Text>
                使用者应自行确认使用本工具是否违反相关游戏的<Text strong>用户协议和服务条款</Text>。因违反游戏规则而产生的任何后果（包括但不限于账号警告、封禁、数据清除等），均由使用者自行承担。
              </Text>
            </div>

            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                3.
              </Text>
              <Text>
                本工具通过<Text strong>模拟用户操作</Text>实现自动化功能，不修改游戏客户端内存、不拦截或篡改游戏网络数据包。但部分游戏可能仍将其视为违规行为，请您在充分了解风险的前提下使用。
              </Text>
            </div>

            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                4.
              </Text>
              <Text>
                开发者<Text strong>不保证</Text>本工具的功能完全满足您的需求，也不保证其运行<Text strong>不受中断或无错误</Text>。本工具按"现状"提供，不提供任何明示或暗示的担保。
              </Text>
            </div>

            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                5.
              </Text>
              <Text>
                在任何情况下，开发者均<Text strong>不对</Text>因使用或无法使用本工具所造成的任何直接、间接、附带、特殊或后果性损害承担任何责任。
              </Text>
            </div>

            <div className="flex gap-2 items-start">
              <Text type="secondary" className="font-bold shrink-0">
                6.
              </Text>
              <Text>
                请<Text strong>合理、适度</Text>使用本工具，严禁将其用于任何违法违规活动。使用者应对自身行为负全部法律责任。
              </Text>
            </div>
          </div>
        </div>

        <Divider className="!my-0" />

        <Space direction="vertical" size="middle" className="w-full">
          <Checkbox
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="text-sm"
          >
            <span style={{ color: 'var(--text)' }}>
              我已阅读并知晓以上内容
            </span>
          </Checkbox>

          <Button
            type="primary"
            block
            size="large"
            disabled={!checked}
            onClick={acceptDisclaimer}
          >
            同意
          </Button>
        </Space>
      </div>
    </Modal>
  )
}
