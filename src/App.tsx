import { ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'
import zhCN from 'antd/locale/zh_CN'
import { router } from "@/router";
import "@/store/index";


function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router}/>
    </ConfigProvider>
  )
}

export default App
