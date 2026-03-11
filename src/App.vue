<template>
  <div class="app-container">
    <a-layout style="min-height: 100vh">
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :width="collapsed ? 80 : 256"
        class="sidebar">
        <div class="logo">
          <ApiOutlined :style="{ fontSize: collapsed ? '24px' : '28px' }" />
          <span v-if="!collapsed" class="logo-text">RapidCron</span>
        </div>
        <a-menu v-model:selectedKeys="selectedKeys" theme="light" mode="inline" :inline-collapsed="collapsed">
          <a-menu-item key="DASHBOARD" @click="currentView = 'DASHBOARD'">
            <template #icon>
              <DashboardOutlined />
            </template>
            仪表盘
          </a-menu-item>
          <a-menu-item key="TASKS" @click="currentView = 'TASKS'">
            <template #icon>
              <UnorderedListOutlined />
            </template>
            任务调度
          </a-menu-item>
          <a-menu-item key="WORKERS" @click="currentView = 'WORKERS'">
            <template #icon>
              <CloudServerOutlined />
            </template>
            集群节点
          </a-menu-item>
          <a-menu-item key="CLUSTER" @click="currentView = 'CLUSTER'">
            <template #icon>
              <ClusterOutlined />
            </template>
            集群管理
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="SETTINGS" @click="currentView = 'SETTINGS'">
            <template #icon>
              <SettingOutlined />
            </template>
            系统设置
          </a-menu-item>
        </a-menu>
        <div class="sidebar-footer">
          <a-button type="text" class="sign-out-btn">
            <template #icon>
              <LogoutOutlined />
            </template>
            <span v-if="!collapsed">退出登录</span>
          </a-button>
        </div>
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="header">
          <div class="header-left">
            <a-button type="text" @click="collapsed = !collapsed" class="trigger">
              <MenuUnfoldOutlined v-if="collapsed" />
              <MenuFoldOutlined v-else />
            </a-button>
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="header-right">
            <a-badge :count="3" :offset="[-5, 5]">
              <a-button type="text" shape="circle" class="notification-btn">
                <BellOutlined />
              </a-button>
            </a-badge>
            <a-divider type="vertical" />
            <div class="user-container">
              <a-avatar class="user-avatar">AU</a-avatar>
              <div class="user-info">
                <div class="user-name">管理员</div>
                <div class="user-role">运维工程师</div>
              </div>
            </div>
          </div>
        </a-layout-header>
        <a-layout-content class="content">
          <div class="content-wrapper">
            <Dashboard v-if="currentView === 'DASHBOARD'" />
            <TaskManager v-if="currentView === 'TASKS'" />
            <WorkerMonitor v-if="currentView === 'WORKERS'" />
            <ClusterManager v-if="currentView === 'CLUSTER'" />
            <div v-if="currentView === 'SETTINGS'" class="settings-placeholder">
              <a-result title="系统设置" sub-title="系统配置设置将在此处，允许您管理API密钥、通知首选项和集群扩展策略。">
                <template #icon>
                  <SettingOutlined style="font-size: 64px; color: #d9d9d9;" />
                </template>
              </a-result>
            </div>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  CloudServerOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ApiOutlined,
  ClusterOutlined
} from '@ant-design/icons-vue'
import Dashboard from './components/Dashboard.vue'
import TaskManager from './components/TaskManager.vue'
import WorkerMonitor from './components/WorkerMonitor.vue'
import ClusterManager from './components/ClusterManager.vue'
import type { ViewState } from './types'

const collapsed = ref(false)
const currentView = ref<ViewState>('DASHBOARD')
const selectedKeys = ref(['DASHBOARD'])

const pageTitle = computed(() => {
  const titles: Record<ViewState, string> = {
    DASHBOARD: '系统概览',
    TASKS: '任务管理',
    WORKERS: '集群健康',
    CLUSTER: '集群管理',
    SETTINGS: '系统配置'
  }
  return titles[currentView.value]
})
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  color: #1890ff;
  border-bottom: 1px solid #f0f0f0;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  margin-left: 8px;
  color: #1f2937;
}

.sidebar-footer {
  margin-top: auto;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.sign-out-btn {
  width: 100%;
  color: #6b7280;
}

.sign-out-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.user-avatar {
  background: #dbeafe;
  color: #2563eb;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  line-height: 32px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  line-height: 1.2;
}

.content {
  flex: 1;
  overflow-y: auto;
  background: #f9fafb;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.settings-placeholder {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 48px;
  text-align: center;
}
</style>
