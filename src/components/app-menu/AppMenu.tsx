import type { FC } from "react";
import "@/components/app-menu/index.css"
import { useNavigate } from 'react-router-dom'
import { Menu, Typography } from "antd";
import {
  DesktopOutlined,
  ProfileOutlined,
  SettingOutlined,
  BookOutlined,
  ReadOutlined,
} from '@ant-design/icons'


const {Title} = Typography;

interface Props {
  collapsed: boolean
}

const AppMenu: FC<Props> = ({ collapsed }) => {

  const navigate = useNavigate();

  const items = [
    {
      key: '/windows',
      icon: <DesktopOutlined/>,
      label: '窗口管理',
    },
    {
      key: '/task',
      icon: <ProfileOutlined/>,
      label: '任务管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined/>,
      label: '全局设置',
    },
    {
      key: '/docs',
      icon: <BookOutlined/>,
      label: '使用手册',
    },
    {
      key: '/logs',
      icon: <ReadOutlined/>,
      label: '系统日志',
    }
  ]

  return (
    <>
      <div className="flex items-center justify-center h-64px">
        {collapsed ? (
          <img src="/snowman.svg" className="h-32px w-32px" alt=""/>
        ) : (
          <Title level={4} className="![color:#1890ff]  m-x-0px m-y-0px">
            Elves Snow
          </Title>
        )}
      </div>
      <Menu
        className="h-[calc(100%-60px)]"
        theme="light"
        defaultSelectedKeys={[items[0].key]}
        mode="inline"
        onClick={({key}) => navigate(key)} items={items}/>
    </>
  )
}

export default AppMenu;