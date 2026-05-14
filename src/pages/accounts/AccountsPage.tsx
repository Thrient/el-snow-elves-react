import { useState, useEffect, useRef, type FC } from "react";
import { Button, Input, Modal, Popconfirm, Table, message, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, DeleteOutlined, PlayCircleOutlined, ReloadOutlined, UserOutlined } from "@ant-design/icons";
import { useAccountStore } from "@/store/account-store";
import type { Account } from "@/store/account-store";

const AccountsPage: FC = () => {
  const accounts = useAccountStore((s) => s.accounts);
  const loading = useAccountStore((s) => s.loading);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);

  useEffect(() => { loadAccounts(); }, []);

  // ---- 录制 ----
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [recordName, setRecordName] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState<string>("");

  const startRecording = async () => {
    if (!recordName.trim()) return;
    setRecording(true);
    setRecordStatus("启动代理中...");
    try {
      await window.pywebview?.api.emit("API:ACCOUNT:RECORD:START", recordName.trim());
      setRecordStatus(`正在录制 — 请在游戏中手动登录账号「${recordName.trim()}」`);
    } catch {
      setRecordStatus("启动失败");
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      const result = await window.pywebview?.api.emit("API:ACCOUNT:RECORD:STOP", recordName.trim());
      if (result?.account) {
        message.success(`账号「${result.account}」已保存`);
        loadAccounts();
      } else if (result?.error) {
        message.error(result.error);
      }
    } catch { /* */ }
    setRecording(false);
    setRecordModalOpen(false);
    setRecordName("");
  };

  const closeRecord = () => {
    if (recording) {
      stopRecording();
    } else {
      setRecordModalOpen(false);
      setRecordName("");
    }
  };

  // ---- 回放 ----
  const [replaying, setReplaying] = useState<string>("");

  const handleReplay = async (name: string) => {
    setReplaying(name);
    try {
      await window.pywebview?.api.emit("API:ACCOUNT:REPLAY:START", name);
      message.info(`正在回放「${name}」——请在游戏中触发登录`);
    } catch { setReplaying(""); }
  };

  const stopReplay = async () => {
    try {
      await window.pywebview?.api.emit("API:ACCOUNT:REPLAY:STOP");
    } catch { /* */ }
    setReplaying("");
  };

  // ---- 轮询自动结束 ----
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (recording || replaying) {
      pollRef.current = setInterval(async () => {
        const status = await window.pywebview?.api.emit("API:ACCOUNT:RECORD:STATUS");
        if (status?.status === "done") {
          if (recording) stopRecording();
          if (replaying) stopReplay();
        }
      }, 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [recording, replaying]);

  // ---- 删除 ----
  const handleDelete = async (name: string) => {
    try {
      await window.pywebview?.api.emit("API:ACCOUNT:DELETE", name);
      message.success("已删除");
      loadAccounts();
    } catch { /* */ }
  };

  const columns: ColumnsType<Account> = [
    {
      title: "账号名",
      dataIndex: "name",
      key: "name",
      width: 160,
      render: (name: string) => (
        <span className="font-medium text-[#1a1a2e]">{name}</span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (ts: number) => (
        <span className="text-xs text-[#8b8fa3]">
          {ts ? new Date(ts).toLocaleString("zh-CN") : "—"}
        </span>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<PlayCircleOutlined />}
            loading={replaying === record.name}
            onClick={() => handleReplay(record.name)}
          />
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => { setRecordName(record.name); setRecordModalOpen(true); }}
            title="重新录制"
          />
          <Popconfirm
            title="确定删除此账号？"
            onConfirm={() => handleDelete(record.name)}
            okText="删除"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg mx-4 mb-4 p-4 shadow-sm">
      <div className="flex items-center justify-between h-10 shrink-0 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 rounded-full bg-[#1677ff]" />
          <span className="text-base font-semibold text-[#1a1a2e] tracking-tight">
            <UserOutlined className="mr-2 text-[#1677ff]" />
            账号管理
          </span>
          <span className="text-xs text-[#8b8fa3] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
            {accounts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRecordModalOpen(true)}>
            录入账号
          </Button>
          {replaying && (
            <Button danger onClick={stopReplay}>
              停止回放
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="name"
          size="middle"
          pagination={false}
          loading={loading}
          locale={{ emptyText: "" }}
        />
      </div>

      <Modal
        title="录入账号"
        open={recordModalOpen}
        onCancel={closeRecord}
        footer={
          recording
            ? [<Button key="stop" danger onClick={stopRecording}>停止录制</Button>]
            : [
                <Button key="cancel" onClick={closeRecord}>取消</Button>,
                <Button key="start" type="primary" onClick={startRecording} disabled={!recordName.trim()}>
                  开始录制
                </Button>,
              ]
        }
        width={420}
      >
        <div className="flex flex-col gap-3 mt-2">
          <Input
            placeholder="输入账号名称（如：主号）"
            value={recordName}
            onChange={(e) => setRecordName(e.target.value)}
            disabled={recording}
          />
          {recording && (
            <div className="flex items-center gap-2 text-sm text-[#8b8fa3]">
              <Spin size="small" />
              <span>{recordStatus}</span>
            </div>
          )}
          <div className="text-xs text-[#bbb]">
            录制时请先在游戏中手动登录一次，代理会自动捕获登录凭证。
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AccountsPage;
