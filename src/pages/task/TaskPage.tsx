import type { FC } from "react";
import { useState } from "react";
import {
  PlusOutlined, EditOutlined, ProfileOutlined,
} from "@ant-design/icons";
import { Button, Space, Table, Tag } from "antd";
import TaskConfigModal from "@/components/task-config-modal/TaskConfigModal.tsx";
import type { ColumnsType } from "antd/es/table";
import type { Task } from "@/types/task.ts";
import { useUserStore } from "@/store/user-store.ts";
import { useTaskStore } from "@/store/task-store.ts";

const TaskPage: FC = () => {
  const appendTask = useUserStore((s) => s.appendTask);
  const taskList = useTaskStore((s) => s.taskList);
  const loading = useTaskStore((s) => s.loading);
  const updateTaskValues = useTaskStore((s) => s.updateTaskValues);

  const [configOpen, setConfigOpen] = useState(false);
  const [configTask, setConfigTask] = useState<Task | null>(null);

  const openConfig = (task: Task) => {
    setConfigTask(task);
    setConfigOpen(true);
  };

  const closeConfig = () => {
    setConfigTask(null);
    setConfigOpen(false);
  };

  const handleConfigSave = (values: Record<string, unknown>) => {
    if (configTask) {
      updateTaskValues(configTask.name, values);
    }
    closeConfig();
  };

  const columns: ColumnsType<Task> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '配置项',
      key: 'config',
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {Object.entries(record.values).map(([key, value], i) => (
            <Tag
              key={key}
              className="h-6 leading-6 rounded-md text-white border-none flex items-center"
              style={{ backgroundColor: ['#1677ff', '#13c2c2', '#2f54eb', '#722ed1', '#fa8c16', '#52c41a'][i % 6] }}
            >{`${key}: ${String(value)}`}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined/>}
            onClick={() => appendTask({
              id: record.id,
              name: record.name,
              description: record.description,
              version: record.version,
              author: record.author,
              values: { ...record.values },
            })}
          >
            添加任务
          </Button>
          <Button
            size="small"
            icon={<EditOutlined/>}
            onClick={() => openConfig(record)}
          >
            配置
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="flex flex-col h-full bg-white rounded-lg m-x-4 p-xy m-b-4 shadow-md">
      <div className="flex justify-between items-center h-40px shrink-0">
        <span className="text-lg font-bold text-[#1a1a2e]">
          <ProfileOutlined className="mr-2"/>任务管理
        </span>
      </div>

      <div className="flex-1 min-h-0 pt-4">
        <Table
          columns={columns}
          dataSource={taskList}
          rowKey="name"
          size="middle"
          pagination={false}
          loading={loading}
        />
      </div>

      <TaskConfigModal
        key={configTask?.name ?? "none"}
        open={configOpen}
        task={configTask}
        onClose={closeConfig}
        onSave={handleConfigSave}
      />
    </div>
  )
}

export default TaskPage;
