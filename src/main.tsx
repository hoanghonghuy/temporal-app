import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider"; // NEW: Import ThemeProvider
import './globals.css'

import { MainLayout } from './components/MainLayout';
import { CalendarPage } from './pages/CalendarPage';
import { ToolsPage } from './pages/ToolsPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: "tools", element: <ToolsPage /> },
    ],
  },
], {
  // basename: "/temporal-app/"
  basename: import.meta.env.BASE_URL
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* NEW: Bọc toàn bộ ứng dụng trong ThemeProvider */}
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)