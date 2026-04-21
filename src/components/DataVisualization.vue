<template>
  <div class="visualization-page">
    <a-row :gutter="[12, 12]" class="metric-row">
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="metric-card">
          <div class="metric-label">任务总数</div>
          <div class="metric-value">{{ summary?.total_tasks ?? 0 }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="metric-card">
          <div class="metric-label">启用任务</div>
          <div class="metric-value">{{ summary?.enabled_tasks ?? 0 }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="metric-card">
          <div class="metric-label">任务实例总数</div>
          <div class="metric-value">{{ summary?.total_instances ?? 0 }}</div>
        </a-card>
      </a-col>
      <a-col :xs="24" :sm="12" :lg="6">
        <a-card class="metric-card">
          <div class="metric-label">今日新增实例</div>
          <div class="metric-value">{{ summary?.today_instances ?? 0 }}</div>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[12, 12]">
      <a-col :xs="24" :lg="12">
        <a-card title="任务状态图" class="chart-card">
          <v-chart :option="barChartOption" autoresize class="chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="近七日任务趋势" class="chart-card">
          <v-chart :option="lineChartOption" autoresize class="chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="任务类型占比" class="chart-card">
          <v-chart :option="taskTypePieOption" autoresize class="chart" />
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="触发方式占比" class="chart-card">
          <v-chart :option="triggerPieOption" autoresize class="chart" />
        </a-card>
      </a-col>
      <a-col :xs="24">
        <a-card title="近七日分发实例数量" class="chart-card">
          <v-chart :option="dispatchBarOption" autoresize class="chart chart-large" />
        </a-card>
      </a-col>
    </a-row>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { Stats } from '../types'

interface DailyTrendItem {
  date: string
  success: number
  failed: number
  running: number
  pending: number
  manual_triggered: number
  scheduler_triggered: number
  dispatched_instances: number
}

interface VisualizationSummary {
  total_tasks: number
  enabled_tasks: number
  total_instances: number
  today_instances: number
  command_tasks: number
  http_tasks: number
  manual_triggered_total: number
  scheduler_triggered_total: number
  dispatch_instances_total: number
  status_distribution: Stats
  daily_trend: DailyTrendItem[]
}

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TitleComponent
])

const summary = ref<VisualizationSummary | null>(null)
const trend = computed<DailyTrendItem[]>(() => summary.value?.daily_trend ?? [])

const barChartOption = computed(() => {
  const distribution = summary.value?.status_distribution
  const success = distribution?.success_instances ?? 0
  const failed = distribution?.failed_instances ?? 0
  const running = distribution?.running_instances ?? 0
  const pending = distribution?.pending_instances ?? 0

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['成功', '失败', '运行中', '待执行']
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: [success, failed, running, pending],
        barWidth: '45%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (params: { dataIndex: number }) => {
            const colors = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']
            return colors[params.dataIndex] ?? '#3b82f6'
          }
        },
        colorBy: 'data'
      }
    ]
  }
})

const lineChartOption = computed(() => {
  const labels = trend.value.map(item => item.date)
  const successTrend = trend.value.map(item => item.success)
  const failedTrend = trend.value.map(item => item.failed)
  const runningTrend = trend.value.map(item => item.running)

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['成功任务', '失败任务', '运行中任务'] },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '成功任务',
        type: 'line',
        smooth: true,
        data: successTrend,
        areaStyle: { opacity: 0.12 },
        color: '#10b981'
      },
      {
        name: '失败任务',
        type: 'line',
        smooth: true,
        data: failedTrend,
        areaStyle: { opacity: 0.1 },
        color: '#ef4444'
      },
      {
        name: '运行中任务',
        type: 'line',
        smooth: true,
        data: runningTrend,
        areaStyle: { opacity: 0.08 },
        color: '#f59e0b'
      }
    ]
  }
})

const taskTypePieOption = computed(() => {
  const commandCount = summary.value?.command_tasks ?? 0
  const httpCount = summary.value?.http_tasks ?? 0
  const total = commandCount + httpCount
  const data = total > 0
    ? [
      { value: commandCount, name: 'Command' },
      { value: httpCount, name: 'HTTP' }
    ]
    : [{ value: 1, name: '暂无数据' }]

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10
    },
    series: [
      {
        name: '任务类型',
        type: 'pie',
        radius: ['45%', '70%'],
        data,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        color: ['#6366f1', '#06b6d4', '#94a3b8']
      }
    ]
  }
})

const triggerPieOption = computed(() => {
  const manual = summary.value?.manual_triggered_total ?? 0
  const scheduler = summary.value?.scheduler_triggered_total ?? 0
  const total = manual + scheduler
  const data = total > 0
    ? [
      { value: scheduler, name: '调度器触发' },
      { value: manual, name: '手动触发' }
    ]
    : [{ value: 1, name: '暂无数据' }]

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10
    },
    series: [
      {
        name: '触发方式',
        type: 'pie',
        radius: ['45%', '70%'],
        data,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        color: ['#3b82f6', '#f97316', '#94a3b8']
      }
    ]
  }
})

const dispatchBarOption = computed(() => {
  const labels = trend.value.map(item => item.date)
  const data = trend.value.map(item => item.dispatched_instances)
  const maxValue = Math.max(...data, 1)

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '分发实例',
        type: 'bar',
        data,
        barWidth: '45%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (params: { value: number }) => {
            const ratio = Math.max(0, Math.min(1, params.value / maxValue))
            const alpha = 0.35 + ratio * 0.65
            return `rgba(139, 92, 246, ${alpha.toFixed(2)})`
          }
        },
        colorBy: 'data'
      }
    ]
  }
})

const buildMockSummary = (): VisualizationSummary => {
  const dailyTrend: DailyTrendItem[] = [
    { date: '04/14', success: 62, failed: 8, running: 6, pending: 12, manual_triggered: 9, scheduler_triggered: 79, dispatched_instances: 84 },
    { date: '04/15', success: 75, failed: 11, running: 5, pending: 10, manual_triggered: 13, scheduler_triggered: 88, dispatched_instances: 97 },
    { date: '04/16', success: 71, failed: 7, running: 9, pending: 14, manual_triggered: 7, scheduler_triggered: 94, dispatched_instances: 103 },
    { date: '04/17', success: 86, failed: 13, running: 7, pending: 9, manual_triggered: 15, scheduler_triggered: 100, dispatched_instances: 112 },
    { date: '04/18', success: 93, failed: 16, running: 10, pending: 12, manual_triggered: 19, scheduler_triggered: 112, dispatched_instances: 129 },
    { date: '04/19', success: 88, failed: 10, running: 12, pending: 18, manual_triggered: 22, scheduler_triggered: 106, dispatched_instances: 124 },
    { date: '04/20', success: 96, failed: 14, running: 11, pending: 16, manual_triggered: 27, scheduler_triggered: 110, dispatched_instances: 131 }
  ]

  const statusDistribution = {
    total_tasks: 218,
    enabled_tasks: 173,
    total_instances: 1800,
    pending_instances: 91,
    running_instances: 60,
    success_instances: 1298,
    failed_instances: 351
  }

  return {
    total_tasks: 218,
    enabled_tasks: 173,
    total_instances: 1800,
    today_instances: 137,
    command_tasks: 126,
    http_tasks: 92,
    manual_triggered_total: 348,
    scheduler_triggered_total: 1452,
    dispatch_instances_total: 780,
    status_distribution: statusDistribution,
    daily_trend: dailyTrend
  }
}

summary.value = buildMockSummary()

</script>

<style scoped>
.visualization-page {
  animation: fadeIn 0.25s ease-in;
}

.metric-row {
  margin-bottom: 4px;
}

.metric-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.metric-card :deep(.ant-card-body) {
  padding: 14px 16px;
}

.metric-label {
  font-size: 12px;
  color: #64748b;
}

.metric-value {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
  font-weight: 650;
  color: #1f2937;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-card {
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.chart-card :deep(.ant-card-head) {
  border-bottom: 1px solid #e5e7eb;
}

.chart-card :deep(.ant-card-head-title) {
  font-size: 15px;
  font-weight: 600;
}

.chart-card :deep(.ant-card-body) {
  padding: 12px;
}

.chart {
  height: 250px;
}

.chart-large {
  height: 290px;
}

@media (max-width: 992px) {
  .chart {
    height: 230px;
  }

  .chart-large {
    height: 260px;
  }
}
</style>
