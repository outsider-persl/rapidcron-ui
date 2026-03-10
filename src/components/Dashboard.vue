<template>
  <div class="dashboard">
    <a-row :gutter="[16, 16]">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">活跃任务</div>
              <div class="stat-value">{{ activeTasks }}</div>
            </div>
            <div class="stat-icon stat-icon-blue">
              <RiseOutlined />
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">健康节点</div>
              <div class="stat-value">{{ onlineWorkers }}/{{ workers.length }}</div>
            </div>
            <div class="stat-icon stat-icon-green">
              <CloudServerOutlined />
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">任务失败 (24h)</div>
              <div class="stat-value">{{ failedTasks }}</div>
            </div>
            <div class="stat-icon stat-icon-amber">
              <WarningOutlined />
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">平均执行时间</div>
              <div class="stat-value">450ms</div>
            </div>
            <div class="stat-icon stat-icon-indigo">
              <ClockCircleOutlined />
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" class="dashboard-row">
      <a-col :xs="24" :lg="16">
        <a-card title="执行吞吐量" class="chart-card">
          <v-chart :option="chartOption" autoresize />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="8">
        <a-card title="系统健康" class="health-card">
          <div class="health-metrics">
            <div class="metric">
              <div class="metric-header">
                <span class="metric-label">CPU 使用率 (集群)</span>
                <span class="metric-value">45%</span>
              </div>
              <a-progress :percent="45" stroke-color="#3b82f6" :show-info="false" />
            </div>
            <div class="metric">
              <div class="metric-header">
                <span class="metric-label">内存使用率</span>
                <span class="metric-value">62%</span>
              </div>
              <a-progress :percent="62" stroke-color="#8b5cf6" :show-info="false" />
            </div>
            <div class="metric">
              <div class="metric-header">
                <span class="metric-label">队列深度</span>
                <span class="metric-value">124</span>
              </div>
              <a-progress :percent="25" stroke-color="#fbbf24" :show-info="false" />
            </div>
          </div>

          <a-divider />

          <div class="alerts-section">
            <h4 class="alerts-title">最近告警</h4>
            <div class="alert alert-error">
              <WarningOutlined class="alert-icon" />
              <span>检测到 Worker-04 延迟过高，请检查网络。</span>
            </div>
            <div class="alert alert-info">
              <RiseOutlined class="alert-icon" />
              <span>计划维护窗口将在2小时后开始。</span>
            </div>
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
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  RiseOutlined,
  CloudServerOutlined,
  WarningOutlined,
  ClockCircleOutlined
} from '@ant-design/icons-vue'
import type { Task, WorkerNode } from '../types'
import { WorkerStatus } from '../types'
import { statsApi } from '../api'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const tasks = ref<Task[]>([])
const workers = ref<WorkerNode[]>([])
const stats = ref<any>(null)

const activeTasks = computed(() => tasks.value.filter(t => t.enabled).length)
const failedTasks = computed(() => stats.value?.failed_instances || 0)
const onlineWorkers = computed(() => workers.value.filter(w => w.status === WorkerStatus.ONLINE || w.status === WorkerStatus.BUSY).length)

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
    textStyle: {
      fontSize: 12
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'],
    axisLine: {
      lineStyle: {
        color: '#64748b'
      }
    },
    axisLabel: {
      color: '#64748b',
      fontSize: 12
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#64748b'
      }
    },
    axisLabel: {
      color: '#64748b',
      fontSize: 12
    },
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    }
  },
  series: [
    {
      name: 'Success',
      type: 'line',
      smooth: true,
      data: [40, 30, 45, 80, 60, 75, 90],
      itemStyle: {
        color: '#10b981'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ]
        }
      }
    },
    {
      name: 'Failed',
      type: 'line',
      smooth: true,
      data: [2, 1, 0, 5, 3, 1, 0],
      itemStyle: {
        color: '#ef4444'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
            { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
          ]
        }
      }
    }
  ]
}))

let intervalId: number | null = null

const loadStats = async () => {
  try {
    const response = await statsApi.getStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadWorkers = async () => {
  try {
    workers.value = [
      { id: 'w-1', name: 'worker-us-east-1a', ip: '10.0.1.23', status: WorkerStatus.ONLINE, cpuUsage: 45, memoryUsage: 8192, activeTasks: 3 },
      { id: 'w-2', name: 'worker-us-east-1b', ip: '10.0.1.24', status: WorkerStatus.BUSY, cpuUsage: 88, memoryUsage: 14500, activeTasks: 8 },
      { id: 'w-3', name: 'worker-us-east-1c', ip: '10.0.1.25', status: WorkerStatus.ONLINE, cpuUsage: 12, memoryUsage: 4096, activeTasks: 1 },
      { id: 'w-4', name: 'worker-us-west-2a', ip: '10.0.2.10', status: WorkerStatus.OFFLINE, cpuUsage: 0, memoryUsage: 0, activeTasks: 0 }
    ]
  } catch (error) {
    console.error('加载工作节点失败:', error)
  }
}

const loadTasks = async () => {
  try {
    tasks.value = [
      { _id: '1', name: '数据清理', description: '删除7天以上的临时文件', type: 'command', schedule: '0 0 * * *', enabled: true, payload: {}, timeout_seconds: 300, max_retries: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { _id: '2', name: '邮件摘要', description: '向用户发送每日摘要', type: 'command', schedule: '0 8 * * *', enabled: false, payload: {}, timeout_seconds: 300, max_retries: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { _id: '3', name: '索引优化', description: '重新索引搜索集群', type: 'command', schedule: '0 2 * * 0', enabled: true, payload: {}, timeout_seconds: 300, max_retries: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { _id: '4', name: '日志轮转', description: '将应用日志轮转到S3', type: 'command', schedule: '0 0 1 * *', enabled: true, payload: {}, timeout_seconds: 300, max_retries: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ]
  } catch (error) {
    console.error('加载任务失败:', error)
  }
}

onMounted(() => {
  loadStats()
  loadWorkers()
  loadTasks()

  intervalId = window.setInterval(() => {
    workers.value = workers.value.map(w => {
      if (w.status === WorkerStatus.OFFLINE) return w

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
.dashboard {
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

.stat-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
}

.stat-icon-blue {
  background: #3b82f6;
}

.stat-icon-green {
  background: #10b981;
}

.stat-icon-amber {
  background: #f59e0b;
}

.stat-icon-indigo {
  background: #6366f1;
}

.dashboard-row {
  margin-top: 24px;
}

.chart-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.chart-card :deep(.ant-card-head) {
  border-bottom: 1px solid #e5e7eb;
}

.chart-card :deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.health-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.health-card :deep(.ant-card-head) {
  border-bottom: 1px solid #e5e7eb;
}

.health-card :deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.health-metrics {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.metric-label {
  color: #6b7280;
}

.metric-value {
  font-weight: 500;
  color: #1f2937;
}

.alerts-section {
  margin-top: 32px;
}

.alerts-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.alert-info {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
