<template>
  <div class="worker-monitor">
    <div class="worker-monitor-header">
      <h2 class="page-title">集群节点</h2>
      <a-space>
        <a-tag color="success">
          <template #icon>
            <WifiOutlined />
          </template>
          活跃：{{ onlineWorkers }}
        </a-tag>
        <a-tag color="default">
          <template #icon>
            <CloudServerOutlined />
          </template>
          总计：{{ workers.length }}
        </a-tag>
      </a-space>
    </div>

    <a-spin :spinning="loading">
      <a-row :gutter="[16, 16]">
        <a-col v-for="worker in workers" :key="worker.node_id" :xs="24" :sm="12" :xl="8">
          <a-card :class="['worker-card', { 'worker-offline': worker.status !== 'active' }]" hoverable>
            <div class="worker-header">
              <div class="worker-info">
                <div class="worker-icon" :class="{ 'icon-offline': worker.status !== 'active' }">
                  <CloudServerOutlined />
                </div>
                <div class="worker-details">
                  <h3 class="worker-name">{{ worker.node_name }}</h3>
                  <p class="worker-ip">{{ worker.host }}:{{ worker.port }}</p>
                </div>
              </div>
              <a-tag :color="getStatusColor(worker.status)">
                <template #icon>
                  <WifiOutlined v-if="worker.status === 'active'" />
                  <WifiOutlined v-else />
                </template>
                {{ getStatusText(worker.status) }}
              </a-tag>
            </div>

            <a-divider class="worker-divider" />

            <div class="worker-metrics">
              <div class="metric">
                <v-chart :option="getCpuGaugeOption(worker.cpu_usage)" autoresize class="gauge-chart" />
                <span class="metric-label">CPU</span>
              </div>
              <div class="metric">
                <v-chart :option="getMemoryGaugeOption(worker.memory_usage)" autoresize class="gauge-chart" />
                <span class="metric-label">Memory</span>
              </div>
            </div>

            <div class="worker-footer">
              <span class="footer-label">活跃任务</span>
              <a-tag>{{ worker.active_tasks }}</a-tag>
            </div>

            <div class="worker-metadata">
              <span class="metadata-label">类型</span>
              <a-tag :color="worker.metadata === 'dispatcher' ? 'blue' : 'green'">
                {{ worker.metadata === 'dispatcher' ? '调度器' : '执行器' }}
              </a-tag>
            </div>

            <div v-if="worker.status === 'active'" class="worker-status-bar">
              <div class="status-bar-fill"></div>
            </div>
          </a-card>
        </a-col>
        <a-col v-if="workers.length === 0 && !loading" :xs="24">
          <a-empty description="暂无集群节点数据" />
        </a-col>
      </a-row>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { WifiOutlined, CloudServerOutlined } from '@ant-design/icons-vue'
import VChart from 'vue-echarts'
import type { ClusterNode } from '../types'
import { clusterApi } from '../api'

use([CanvasRenderer, PieChart])

const workers = ref<ClusterNode[]>([])
const loading = ref(false)

const onlineWorkers = computed(() => workers.value.filter(w => w.status === 'active').length)

const getStatusColor = (status: 'active' | 'inactive') => {
  const colors: Record<string, string> = {
    'active': 'success',
    'inactive': 'default'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: 'active' | 'inactive') => {
  const texts: Record<string, string> = {
    'active': '活跃',
    'inactive': '非活跃'
  }
  return texts[status] || '未知'
}

const getCpuGaugeOption = (value: number) => {
  const percentage = Math.round(value)
  return {
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        startAngle: 90,
        endAngle: -270,
        data: [
          { value: 100 - percentage, itemStyle: { color: '#f1f5f9' } },
          { value: percentage, itemStyle: { color: percentage > 80 ? '#ef4444' : '#3b82f6' } }
        ],
        label: {
          show: true,
          position: 'center',
          formatter: () => `${percentage}%`,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#374151'
        },
        labelLine: { show: false },
        emphasis: { disabled: true }
      }
    ]
  }
}

const getMemoryGaugeOption = (value: number) => {
  const percentage = Math.round(value)
  return {
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        startAngle: 90,
        endAngle: -270,
        data: [
          { value: 100 - percentage, itemStyle: { color: '#f1f5f9' } },
          { value: percentage, itemStyle: { color: '#8b5cf6' } }
        ],
        label: {
          show: true,
          position: 'center',
          formatter: () => `${percentage}%`,
          fontSize: 12,
          fontWeight: 'bold',
          color: '#374151'
        },
        labelLine: { show: false },
        emphasis: { disabled: true }
      }
    ]
  }
}

const loadWorkers = async () => {
  loading.value = true
  try {
    const response = await clusterApi.getNodes()
    if (response.success && response.data) {
      workers.value = response.data.nodes
    } else {
      // 后端服务未实现时使用模拟数据
      workers.value = [
        {
          node_name: 'executor-8081',
          node_id: 'worker-41fbb72e-aecc-43a0-a328-f82d495fb278',
          host: 'localhost',
          port: 8081,
          status: 'active',
          cpu_usage: 46.82,
          memory_usage: 12.76,
          memory_total: 16,
          active_tasks: 0,
          metadata: 'executor'
        },
        {
          node_name: 'rapidcron-dispatcher',
          node_id: '22082c60-f016-42e3-8690-13162991d198',
          host: '127.0.0.1',
          port: 8080,
          status: 'active',
          cpu_usage: 0.0,
          memory_usage: 0.0,
          memory_total: 0,
          active_tasks: 0,
          metadata: 'dispatcher'
        }
      ]
      console.warn('使用模拟数据，后端服务未实现集群节点接口')
    }
  } catch (error) {
    console.error('加载集群节点失败:', error)
    // 网络错误时使用模拟数据
    workers.value = [
      {
        node_name: 'executor-8081',
        node_id: 'worker-41fbb72e-aecc-43a0-a328-f82d495fb278',
        host: 'localhost',
        port: 8081,
        status: 'active',
        cpu_usage: 46.82,
        memory_usage: 12.76,
        memory_total: 16,
        active_tasks: 0,
        metadata: 'executor'
      },
      {
        node_name: 'rapidcron-dispatcher',
        node_id: '22082c60-f016-42e3-8690-13162991d198',
        host: '127.0.0.1',
        port: 8080,
        status: 'active',
        cpu_usage: 0.0,
        memory_usage: 0.0,
        memory_total: 0,
        active_tasks: 0,
        metadata: 'dispatcher'
      }
    ]
    console.warn('使用模拟数据，网络错误或后端服务不可用')
  } finally {
    loading.value = false
  }
}

let intervalId: number | null = null

onMounted(() => {
  loadWorkers()
  // 每10秒刷新一次数据
  intervalId = window.setInterval(loadWorkers, 10000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
.worker-monitor {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.worker-monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.worker-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.worker-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.worker-offline {
  opacity: 0.7;
  filter: grayscale(100%);
}

.worker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.worker-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.worker-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #dbeafe;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.worker-icon.icon-offline {
  background: #f3f4f6;
  color: #9ca3af;
}

.worker-details {
  flex: 1;
}

.worker-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.worker-ip {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  font-family: 'Courier New', monospace;
}

.worker-divider {
  margin: 16px 0;
}

.worker-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.gauge-chart {
  width: 64px;
  height: 64px;
}

.metric-label {
  font-size: 12px;
  color: #6b7280;
}

.worker-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.worker-metadata {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.metadata-label {
  font-size: 14px;
  color: #6b7280;
}

.footer-label {
  font-size: 14px;
  color: #6b7280;
}

.worker-status-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #f3f4f6;
  overflow: hidden;
}

.status-bar-fill {
  height: 100%;
  background: #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
