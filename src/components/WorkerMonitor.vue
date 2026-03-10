<template>
  <div class="worker-monitor">
    <div class="worker-monitor-header">
      <h2 class="page-title">集群节点</h2>
      <a-space>
        <a-tag color="success">
          <template #icon>
            <WifiOutlined />
          </template>
          在线：{{ onlineWorkers }}
        </a-tag>
        <a-tag color="default">
          <template #icon>
            <CloudServerOutlined />
          </template>
          总计：{{ workers.length }}
        </a-tag>
      </a-space>
    </div>

    <a-row :gutter="[16, 16]">
      <a-col v-for="worker in workers" :key="worker.id" :xs="24" :sm="12" :xl="8">
        <a-card :class="['worker-card', { 'worker-offline': worker.status === 'OFFLINE' }]" hoverable>
          <div class="worker-header">
            <div class="worker-info">
              <div class="worker-icon" :class="{ 'icon-offline': worker.status === 'OFFLINE' }">
                <CloudServerOutlined />
              </div>
              <div class="worker-details">
                <h3 class="worker-name">{{ worker.name }}</h3>
                <p class="worker-ip">{{ worker.ip }}</p>
              </div>
            </div>
            <a-tag :color="getStatusColor(worker.status)">
              <template #icon>
                <WifiOutlined v-if="worker.status !== 'OFFLINE'" />
                <WifiOutlined v-else />
              </template>
              {{ getStatusText(worker.status) }}
            </a-tag>
          </div>

          <a-divider class="worker-divider" />

          <div class="worker-metrics">
            <div class="metric">
              <v-chart :option="getCpuGaugeOption(worker.cpuUsage)" autoresize class="gauge-chart" />
              <span class="metric-label">CPU</span>
            </div>
            <div class="metric">
              <v-chart :option="getMemoryGaugeOption(worker.memoryUsage)" autoresize class="gauge-chart" />
              <span class="metric-label">Memory</span>
            </div>
          </div>

          <div class="worker-footer">
            <span class="footer-label">活跃任务</span>
            <a-tag>{{ worker.activeTasks }}</a-tag>
          </div>

          <div v-if="worker.status !== 'OFFLINE'" class="worker-status-bar">
            <div class="status-bar-fill"></div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import { WifiOutlined, CloudServerOutlined } from '@ant-design/icons-vue'
import VChart from 'vue-echarts'
import type { WorkerNode } from '../types'
import { WorkerStatus } from '../types'

use([CanvasRenderer, PieChart])

const workers = ref<WorkerNode[]>([
  { id: 'w-1', name: 'worker-us-east-1a', ip: '10.0.1.23', status: WorkerStatus.ONLINE, cpuUsage: 45, memoryUsage: 8192, activeTasks: 3 },
  { id: 'w-2', name: 'worker-us-east-1b', ip: '10.0.1.24', status: WorkerStatus.BUSY, cpuUsage: 88, memoryUsage: 14500, activeTasks: 8 },
  { id: 'w-3', name: 'worker-us-east-1c', ip: '10.0.1.25', status: WorkerStatus.ONLINE, cpuUsage: 12, memoryUsage: 4096, activeTasks: 1 },
  { id: 'w-4', name: 'worker-us-west-2a', ip: '10.0.2.10', status: WorkerStatus.OFFLINE, cpuUsage: 0, memoryUsage: 0, activeTasks: 0 }
])

const onlineWorkers = computed(() => workers.value.filter(w => w.status !== 'OFFLINE').length)

const getStatusColor = (status: WorkerStatus) => {
  const colors: Record<WorkerStatus, string> = {
    [WorkerStatus.ONLINE]: 'success',
    [WorkerStatus.BUSY]: 'warning',
    [WorkerStatus.OFFLINE]: 'default'
  }
  return colors[status] || 'default'
}

const getStatusText = (status: WorkerStatus) => {
  const texts: Record<WorkerStatus, string> = {
    [WorkerStatus.ONLINE]: '在线',
    [WorkerStatus.BUSY]: '忙碌',
    [WorkerStatus.OFFLINE]: '离线'
  }
  return texts[status] || '未知'
}

const getCpuGaugeOption = (value: number) => ({
  series: [
    {
      type: 'pie',
      radius: ['60%', '80%'],
      center: ['50%', '50%'],
      startAngle: 90,
      endAngle: -270,
      data: [
        { value: value, itemStyle: { color: value > 80 ? '#ef4444' : '#3b82f6' } },
        { value: 100 - value, itemStyle: { color: '#f1f5f9' } }
      ],
      label: {
        show: true,
        position: 'center',
        formatter: '{c}%',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151'
      },
      labelLine: { show: false },
      emphasis: { disabled: true }
    }
  ]
})

const getMemoryGaugeOption = (value: number) => {
  const percentage = Math.round((value / 16000) * 100)
  return {
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        center: ['50%', '50%'],
        startAngle: 90,
        endAngle: -270,
        data: [
          { value: percentage, itemStyle: { color: '#8b5cf6' } },
          { value: 100 - percentage, itemStyle: { color: '#f1f5f9' } }
        ],
        label: {
          show: true,
          position: 'center',
          formatter: '{c}%',
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

let intervalId: number | null = null

onMounted(() => {
  intervalId = window.setInterval(() => {
    workers.value = workers.value.map(w => {
      if (w.status === 'OFFLINE') return w

      const cpuChange = Math.floor(Math.random() * 10) - 5
      const newCpu = Math.max(0, Math.min(100, w.cpuUsage + cpuChange))

      let newStatus = w.status
      if (newCpu > 80) newStatus = WorkerStatus.BUSY
      else newStatus = WorkerStatus.ONLINE

      return {
        ...w,
        cpuUsage: newCpu,
        status: newStatus,
        memoryUsage: Math.max(1024, Math.min(16000, w.memoryUsage + (Math.random() * 200 - 100)))
      }
    })
  }, 2000)
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
