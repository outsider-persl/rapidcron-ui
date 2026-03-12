<template>
  <div class="log-manager">
    <div class="log-header">
      <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <a-tab-pane key="execution" tab="执行日志" />
        <a-tab-pane key="dispatch" tab="分发日志" />
      </a-tabs>
      <div class="log-search">
        <!-- 执行日志搜索表单 -->
        <a-form v-if="activeTab === 'execution'" layout="inline" :model="executionSearchForm"
          @submit.prevent="searchLogs">
          <a-form-item label="任务ID">
            <a-input v-model:value="executionSearchForm.task_id" placeholder="请输入任务ID" />
          </a-form-item>
          <a-form-item label="实例ID">
            <a-input v-model:value="executionSearchForm.instance_id" placeholder="请输入实例ID" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="executionSearchForm.status" placeholder="请选择状态" style="width: 120px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="pending">待执行</a-select-option>
              <a-select-option value="running">运行中</a-select-option>
              <a-select-option value="success">成功</a-select-option>
              <a-select-option value="failed">失败</a-select-option>
              <a-select-option value="cancelled">已取消</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="触发方式">
            <a-select v-model:value="executionSearchForm.triggered_by" placeholder="请选择触发方式" style="width: 120px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="scheduler">调度器</a-select-option>
              <a-select-option value="manual">手动</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">查询</a-button>
            <a-button style="margin-left: 8px" @click="resetForm">重置</a-button>
          </a-form-item>
        </a-form>

        <!-- 分发日志搜索表单 -->
        <a-form v-else layout="inline" :model="dispatchSearchForm" @submit.prevent="searchLogs">
          <a-form-item label="开始时间">
            <a-date-picker v-model:value="dispatchSearchForm.start_time" placeholder="选择开始时间" show-time />
          </a-form-item>
          <a-form-item label="结束时间">
            <a-date-picker v-model:value="dispatchSearchForm.end_time" placeholder="选择结束时间" show-time />
          </a-form-item>
          <a-form-item label="是否有错误">
            <a-select v-model:value="dispatchSearchForm.has_error" placeholder="请选择" style="width: 120px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="true">是</a-select-option>
              <a-select-option value="false">否</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">查询</a-button>
            <a-button style="margin-left: 8px" @click="resetForm">重置</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- 执行日志表格 -->
    <a-table v-if="activeTab === 'execution'" :columns="executionColumns" :data-source="executionLogs"
      :loading="loading" :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: handlePaginationChange
      }" :row-key="(record: Log) => formatId(record._id)" bordered :scroll="{ x: 'max-content' }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
        </template>
        <template v-else-if="column.key === 'output_summary'">
          <a-tooltip :title="record.output_summary">
            <span>{{ record.output_summary.length > 50 ? record.output_summary.substring(0, 50) + '...' :
              record.output_summary }}</span>
          </a-tooltip>
        </template>
        <template v-else-if="column.key === 'error_message'">
          <a-tooltip :title="record.error_message">
            <span>{{ record.error_message ? (record.error_message.length > 50 ? record.error_message.substring(0, 50) +
              '...' : record.error_message) : '-' }}</span>
          </a-tooltip>
        </template>
        <template
          v-else-if="column.key === 'scheduled_time' || column.key === 'start_time' || column.key === 'end_time'">
          <span>{{ formatDate(record[column.key]) }}</span>
        </template>
      </template>
    </a-table>

    <!-- 分发日志表格 -->
    <a-table v-else :columns="dispatchColumns" :data-source="dispatchLogs" :loading="loading" :pagination="{
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      onChange: handlePaginationChange
    }" :row-key="(record: DispatchLog) => formatId(record._id)" bordered :scroll="{ x: 'max-content' }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'has_error'">
          <a-tag :color="record.has_error ? 'error' : 'success'">{{ record.has_error ? '是' : '否' }}</a-tag>
        </template>
        <template v-else-if="column.key === 'error'">
          <a-tooltip :title="record.error">
            <span>{{ record.error ? (record.error.length > 50 ? record.error.substring(0, 50) + '...' : record.error) :
              '-' }}</span>
          </a-tooltip>
        </template>
        <template
          v-else-if="column.key === 'scan_time' || column.key === 'scan_window_start' || column.key === 'scan_window_end'">
          <span>{{ formatDate(record[column.key]) }}</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Log, DispatchLog } from '../types'
import { logsApi } from '../api'

const activeTab = ref('execution')
const loading = ref(false)
const executionLogs = ref<Log[]>([])
const dispatchLogs = ref<DispatchLog[]>([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

const executionSearchForm = ref({
  task_id: '',
  instance_id: '',
  status: '' as '' | 'pending' | 'running' | 'success' | 'failed' | 'cancelled',
  triggered_by: '' as '' | 'scheduler' | 'manual'
})

const dispatchSearchForm = ref({
  start_time: null as any,
  end_time: null as any,
  has_error: '' as '' | 'true' | 'false'
})

const executionColumns = computed(() => [
  {
    title: '日志ID',
    dataIndex: '_id',
    key: '_id',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      // Ant Design Vue 的 customRender 传入的是一个对象，包含 text、value、record 等属性
      return formatId(obj.value)
    }
  },
  {
    title: '任务ID',
    dataIndex: 'task_id',
    key: 'task_id',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatId(obj.value)
    }
  },
  {
    title: '任务名称',
    dataIndex: 'task_name',
    key: 'task_name',
    width: 150,
    resizable: true
  },
  {
    title: '实例ID',
    dataIndex: 'instance_id',
    key: 'instance_id',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatId(obj.value)
    }
  },
  {
    title: '计划执行时间',
    dataIndex: 'scheduled_time',
    key: 'scheduled_time',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '开始执行时间',
    dataIndex: 'start_time',
    key: 'start_time',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '结束执行时间',
    dataIndex: 'end_time',
    key: 'end_time',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '执行时长(ms)',
    dataIndex: 'duration_ms',
    key: 'duration_ms',
    width: 120,
    resizable: true
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    resizable: true
  },
  {
    title: '输出摘要',
    dataIndex: 'output_summary',
    key: 'output_summary',
    width: 200,
    resizable: true
  },
  {
    title: '错误消息',
    dataIndex: 'error_message',
    key: 'error_message',
    width: 200,
    resizable: true
  },
  {
    title: '触发方式',
    dataIndex: 'triggered_by',
    key: 'triggered_by',
    width: 120,
    resizable: true
  }
])

const dispatchColumns = computed(() => [
  {
    title: '日志ID',
    dataIndex: '_id',
    key: '_id',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatId(obj.value)
    }
  },
  {
    title: '扫描时间',
    dataIndex: 'scan_time',
    key: 'scan_time',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '扫描窗口开始',
    dataIndex: 'scan_window_start',
    key: 'scan_window_start',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '扫描窗口结束',
    dataIndex: 'scan_window_end',
    key: 'scan_window_end',
    width: 180,
    resizable: true,
    customRender: (obj: any) => {
      return formatDate(obj.value)
    }
  },
  {
    title: '总任务数',
    dataIndex: 'total_tasks',
    key: 'total_tasks',
    width: 120,
    resizable: true
  },
  {
    title: '启用任务数',
    dataIndex: 'enabled_tasks',
    key: 'enabled_tasks',
    width: 120,
    resizable: true
  },
  {
    title: '分发实例数',
    dataIndex: 'dispatched_instances',
    key: 'dispatched_instances',
    width: 120,
    resizable: true
  },
  {
    title: '是否有错误',
    dataIndex: 'has_error',
    key: 'has_error',
    width: 100,
    resizable: true
  },
  {
    title: '错误信息',
    dataIndex: 'error',
    key: 'error',
    width: 300,
    resizable: true
  }
])

const getStatusColor = (status: string) => {
  switch (status) {
    case 'success': return 'success'
    case 'failed': return 'error'
    case 'running': return 'processing'
    case 'pending': return 'warning'
    case 'cancelled': return 'default'
    default: return 'default'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'success': return '成功'
    case 'failed': return '失败'
    case 'running': return '运行中'
    case 'pending': return '待执行'
    case 'cancelled': return '已取消'
    default: return status
  }
}

const formatId = (id: any) => {
  if (!id) return '-'
  if (typeof id === 'string') return id
  if (id.$oid) return id.$oid
  return JSON.stringify(id)
}

const formatDate = (date: any) => {
  if (!date) return '-'
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    return dateObj.toLocaleString()
  }
  if (date.$date) {
    if (date.$date.$numberLong) {
      const timestamp = parseInt(date.$date.$numberLong)
      const dateObj = new Date(timestamp)
      return dateObj.toLocaleString()
    }
  }
  return '-'
}

const loadLogs = async () => {
  loading.value = true
  try {
    if (activeTab.value === 'execution') {
      const params = {
        task_id: executionSearchForm.value.task_id || undefined,
        instance_id: executionSearchForm.value.instance_id || undefined,
        status: executionSearchForm.value.status || undefined,
        triggered_by: executionSearchForm.value.triggered_by || undefined,
        page: pagination.value.current,
        page_size: pagination.value.pageSize
      }

      const response = await logsApi.getExecutionLogs(params)
      if (response.success && response.data) {
        executionLogs.value = response.data.items
        pagination.value.total = response.data.total
      }
    } else {
      const params = {
        start_time: dispatchSearchForm.value.start_time ? dispatchSearchForm.value.start_time.toISOString() : undefined,
        end_time: dispatchSearchForm.value.end_time ? dispatchSearchForm.value.end_time.toISOString() : undefined,
        has_error: dispatchSearchForm.value.has_error ? dispatchSearchForm.value.has_error === 'true' : undefined,
        page: pagination.value.current,
        page_size: pagination.value.pageSize
      }

      const response = await logsApi.getDispatchLogs(params)
      if (response.success && response.data) {
        dispatchLogs.value = response.data.items
        pagination.value.total = response.data.total
      }
    }
  } catch (error) {
    console.error('加载日志失败:', error)
    message.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

const searchLogs = () => {
  pagination.value.current = 1
  loadLogs()
}

const resetForm = () => {
  if (activeTab.value === 'execution') {
    executionSearchForm.value = {
      task_id: '',
      instance_id: '',
      status: '' as '' | 'pending' | 'running' | 'success' | 'failed' | 'cancelled',
      triggered_by: '' as '' | 'scheduler' | 'manual'
    }
  } else {
    dispatchSearchForm.value = {
      start_time: null,
      end_time: null,
      has_error: '' as '' | 'true' | 'false'
    }
  }
  pagination.value.current = 1
  loadLogs()
}

const handlePaginationChange = (current: number, pageSize: number) => {
  pagination.value.current = current
  pagination.value.pageSize = pageSize
  loadLogs()
}

const handleTabChange = (key: string) => {
  activeTab.value = key
  pagination.value.current = 1
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.log-manager {
  padding: 24px;
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

.log-header {
  margin-bottom: 24px;
}

.log-search {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}
</style>