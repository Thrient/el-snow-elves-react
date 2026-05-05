import { type FC, useEffect, useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { useTaskStore } from "@/store/task-store";
import { waitForPywebview } from "@/utils/pywebview.ts";
import { Layout } from "antd";
import AppHeader from "@/components/app-header/AppHeader.tsx";
import DisclaimerModal from "@/components/disclaimer-modal/DisclaimerModal.tsx";
import FloatingPanel from "@/components/floating-panel/FloatingPanel.tsx";
import AppMenu from "@/components/app-menu/AppMenu.tsx";
import { Outlet } from 'react-router-dom'


const {Header, Sider, Content} = Layout


const MainLayout: FC = () => {

  const [collapsed, setCollapsed] = useState<boolean>(false)

  useEffect(() => {
    const init = async () => {
      await waitForPywebview()
      useSettingsStore.getState().loadSettings()
      useTaskStore.getState().loadTasks()
    }
    init()
  }, [])

  return (
    <>
      <FloatingPanel />
      <DisclaimerModal />
      <Layout className='h-full'>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          theme='light'
          className='bg-white'
          width={160}
        >
          <AppMenu collapsed={collapsed}/>
        </Sider>
        <Layout>
          <Header className="bg-white">
            <AppHeader/>
          </Header>
          <Content className="bg-white">
            <Outlet/>
          </Content>
        </Layout>
      </Layout>
    </>
  )
}


export default MainLayout