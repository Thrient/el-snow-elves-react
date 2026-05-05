import type { FC } from "react";
import { useCallback, useEffect, useState } from "react";
import { AutoComplete, Button, Modal, Select, Space, Spin } from "antd";
import { FileOutlined, DownloadOutlined, SaveOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/user-store.ts";
import { useSysStore } from "@/store/sys-store.ts";
import { callApi, waitForPywebview } from "@/utils/pywebview.ts";

const ConfigHeader: FC = () => {
  const [configFiles, setConfigFiles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [loadingConfig, setLoadingConfig] = useState(false)
  const sysStore = useSysStore()
  const userStore = useUserStore()

  const fetchConfigFiles = useCallback(async () => {
    try {
      await waitForPywebview()
      const result = await callApi<string[]>("API:SCRIPT:LOAD:CONFIG:LIST")
      setConfigFiles(result ?? [])
    } catch {
      setConfigFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigFiles()
  }, [fetchConfigFiles])

  useEffect(() => {
    if (!loading && sysStore.currentConfig && configFiles.includes(sysStore.currentConfig)) {
      setLoadingConfig(true)
      loadConfig(sysStore.currentConfig)
    }
  }, [loading, configFiles, sysStore.currentConfig])

  const loadConfig = async (name: string) => {
    try {
      const result = await callApi<Record<string, unknown>>("API:SCRIPT:LOAD:CONFIG", name)
      if (result) {
        userStore.loadConfig(result)
      }
    } catch { /* empty */ } finally {
      setLoadingConfig(false)
    }
  }

  const handleSaveClick = () => {
    setSaveModalOpen(true)
  }

  const handleSaveConfirm = () => {
    if (!saveName.trim()) return
    setSaving(true)
    setSaveModalOpen(false)
    const state = useUserStore.getState()
    const payload: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(state)) {
      if (typeof value !== "function") {
        payload[key] = value
      }
    }
    window.pywebview?.api.emit("API:SCRIPT:SAVE:CONFIG", saveName, payload).then(() => {
      setSaving(false)
    })
  }

  return (
    <>
      <Space size='middle'>
        <FileOutlined className="text-lg text-[#1677ff]"/>
        <Spin spinning={loading || loadingConfig} size="small">
          <Select
            className='w-180px'
            placeholder="配置文件"
            value={sysStore.currentConfig}
            notFoundContent={loading ? "加载中..." : "暂无配置文件"}
            onChange={(value) => {
              setLoadingConfig(true)
              sysStore.setCurrentConfig(value)
              loadConfig(value)
            }}
          >
            {configFiles.map((file) => (
              <Select.Option key={file} value={file}>{file}</Select.Option>
            ))}
          </Select>
        </Spin>
        <Button
          icon={<DownloadOutlined/>}
          onClick={() => {
            setLoading(true)
            fetchConfigFiles()
          }}
          loading={loading}
        >
          刷新
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSaveClick}
          loading={saving}
        >
          保存
        </Button>
      </Space>

      <Modal
        title="保存配置"
        open={saveModalOpen}
        onOk={handleSaveConfirm}
        onCancel={() => setSaveModalOpen(false)}
        okButtonProps={{ disabled: !saveName.trim() }}
        okText="保存"
        cancelText="取消"
      >
        <div className="mt-4">
          <AutoComplete
            className="w-full"
            placeholder="输入配置文件名"
            value={saveName}
            onChange={setSaveName}
            options={configFiles.map((file) => ({ value: file }))}
          />
        </div>
      </Modal>
    </>
  )
}

export default ConfigHeader;