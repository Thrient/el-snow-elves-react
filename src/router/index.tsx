/* eslint-disable react-refresh/only-export-components */
import { createHashRouter, Navigate } from 'react-router-dom'
import MainLayout from "@/layouts/MainLayout.tsx";
import { lazy, Suspense } from "react";


const WindowsPage = lazy(() => import('@/pages/windows/WindowsPage'));
const TaskPage = lazy(() => import('@/pages/task/TaskPage'));
const TaskEditorPage = lazy(() => import('@/pages/task-editor/TaskEditorPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const DocsPage = lazy(() => import('@/pages/docs/DocsPage'));
const LogsPage = lazy(() => import('@/pages/logs/LogsPage'));


export const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout/>,
    children: [
      {
        path: '/',
        element: <Navigate to="/windows" replace/>
      },
      {
        path: '/windows',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <WindowsPage/>
          </Suspense>
        )
      },
      {
        path: '/task',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <TaskPage/>
          </Suspense>
        )
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <SettingsPage/>
          </Suspense>
        )
      },
      {
        path: '/docs',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <DocsPage/>
          </Suspense>
        )
      },
      {
        path: '/task-editor',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <TaskEditorPage/>
          </Suspense>
        )
      },
      {
        path: '/logs',
        element: (
          <Suspense fallback={<div>加载中...</div>}>
            <LogsPage/>
          </Suspense>
        )
      }
    ]

  }
])