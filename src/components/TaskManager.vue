<template>
  <div class="task-manager">
    <div class="task-manager-header">
      <h2 class="page-title">定时任务</h2>
      <div class="header-actions">
        <a-input-search v-model:value="searchTerm" placeholder="搜索任务..." style="width: 250px" allow-clear />
        <a-button type="primary" @click="showCreateModal = true">
          <template #icon>
            <PlusOutlined />
          </template>
          新建任务
        </a-button>
      </div>
    </div>

    <a-card class="tasks-table-card">
      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" :pagination="{ pageSize: 10 }"
        row-key="_id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div>
              <div class="task-name">{{ record.name }}</div>
              <div class="task-description">{{ record.description || '-' }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'schedule'">
            <a-tag color="default">{{ record.schedule }}</a-tag>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-tag :color="record.enabled ? 'success' : 'warning'">
              {{ record.enabled ? '已启用' : '已禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-tooltip :title="record.enabled ? '禁用' : '启用'">
                <a-button type="text" @click="toggleTask(record)">
                  <template #icon>
                    <PauseOutlined v-if="record.enabled" />
                    <PlayCircleOutlined v-else />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" danger @click="deleteTask(record._id)">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="showCreateModal" title="新建任务" :footer="null" width="600px">
      <a-form :model="formState" :rules="rules" @finish="handleCreateTask" layout="vertical">
        <div class="ai-helper">
          <div class="ai-helper-header">
            <BulbOutlined class="ai-icon" />
            <span class="ai-helper-title">AI 助手</span>
          </div>
          <a-input-search v-model:value="aiPrompt" placeholder="例如：每周日凌晨3点执行数据库清理" enter-button="生成"
            :loading="aiGenerating" @search="handleAiGenerate" class="ai-input" />
          <p class="ai-helper-hint">
            描述您的需求，我会自动填充下面的技术细节。
          </p>
        </div>

        <a-form-item label="任务名称" name="name">
          <a-input v-model:value="formState.name" placeholder="例如：数据库备份" />
        </a-form-item>

        <a-form-item label="任务类型" name="task_type">
          <a-select v-model:value="formState.task_type" placeholder="选择任务类型">
            <a-select-option value="command">命令</a-select-option>
            <a-select-option value="http">HTTP 请求</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Cron 表达式" name="schedule">
          <a-input v-model:value="formState.schedule" placeholder="例如：0 0 * * 0" class="cron-input" />
        </a-form-item>

        <a-form-item v-if="formState.task_type === 'command'" label="命令" name="command">
          <a-input v-model:value="formState.command" placeholder="例如：echo 'Hello World'" />
        </a-form-item>

        <a-form-item v-if="formState.task_type === 'http'" label="URL" name="url">
          <a-input v-model:value="formState.url" placeholder="例如：https://api.example.com/webhook" />
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="formState.description" placeholder="描述此任务的用途..." :rows="3" />
        </a-form-item>

        <a-form-item label="超时时间（秒）" name="timeout_seconds">
          <a-input-number v-model:value="formState.timeout_seconds" :min="1" :max="3600" style="width: 100%" />
        </a-form-item>

        <a-form-item label="最大重试次数" name="max_retries">
          <a-input-number v-model:value="formState.max_retries" :min="0" :max="10" style="width: 100%" />
        </a-form-item>

        <a-form-item>
          <a-checkbox v-model:checked="formState.enabled">启用此任务</a-checkbox>
        </a-form-item>

        <div class="form-actions">
          <a-button @click="showCreateModal = false">取消</a-button>
          <a-button type="primary" html-type="submit">创建任务</a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseOutlined,
  DeleteOutlined,
  BulbOutlined
} from '@ant-design/icons-vue'
import type { Task } from '../types'
import { tasksApi } from '../api'

const columns = [
  {
    title: '任务名称',
    key: 'name',
    dataIndex: 'name'
  },
  {
    title: '调度时间 (Cron)',
    key: 'schedule',
    dataIndex: 'schedule'
  },
  {
    title: '类型',
    key: 'type',
    dataIndex: 'type'
  },
  {
    title: '状态',
    key: 'enabled',
    dataIndex: 'enabled'
  },
  {
    title: '操作',
    key: 'actions',
    align: 'right' as const
  }
]

const tasks = ref<Task[]>([])
const searchTerm = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const aiPrompt = ref('')
const aiGenerating = ref(false)

const formState = reactive({
  name: '',
  task_type: 'command' as 'command' | 'http',
  schedule: '',
  command: '',
  url: '',
  description: '',
  timeout_seconds: 30,
  max_retries: 3,
  enabled: true
})

const rules = {
  name: [{ required: true, message: '请输入任务名称' }],
  schedule: [{ required: true, message: '请输入 Cron 表达式' }],
  task_type: [{ required: true, message: '请选择任务类型' }]
}

const filteredTasks = computed(() => {
  return tasks.value.filter(task =>
    task.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    task._id.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const loadTasks = async () => {
  loading.value = true
  try {
    const response = await tasksApi.getTasks()
    if (response.success && response.data) {
      tasks.value = response.data.tasks
    }
  } catch (error) {
    console.error('加载任务失败:', error)
    message.error('加载任务失败')
  } finally {
    loading.value = false
  }
}

const toggleTask = async (task: Task) => {
  try {
    if (task.enabled) {
      await tasksApi.disableTask(task._id)
      message.success('任务已禁用')
    } else {
      await tasksApi.enableTask(task._id)
      message.success('任务已启用')
    }
    await loadTasks()
  } catch (error) {
    console.error('切换任务状态失败:', error)
    message.error('切换任务状态失败')
  }
}

const deleteTask = async (id: string) => {
  try {
    await tasksApi.deleteTask(id)
    message.success('任务已删除')
    await loadTasks()
  } catch (error) {
    console.error('删除任务失败:', error)
    message.error('删除任务失败')
  }
}

const handleAiGenerate = async () => {
  if (!aiPrompt.value.trim()) return
  aiGenerating.value = true
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: aiPrompt.value })
    })
    const data = await response.json()
    if (data.success) {
      formState.name = data.data.name
      formState.schedule = data.data.schedule
      formState.description = data.data.description
      formState.command = data.data.command || ''
      formState.url = data.data.url || ''
      message.success('任务配置生成成功')
    }
  } catch (error) {
    console.error('生成任务配置失败:', error)
    message.error('生成任务配置失败')
  } finally {
    aiGenerating.value = false
  }
}

const handleCreateTask = async () => {
  try {
    const response = await tasksApi.createTask(formState)
    if (response.success) {
      message.success('任务创建成功')
      showCreateModal.value = false
      Object.assign(formState, {
        name: '',
        task_type: 'command',
        schedule: '',
        command: '',
        url: '',
        description: '',
        timeout_seconds: 30,
        max_retries: 3,
        enabled: true
      })
      aiPrompt.value = ''
      await loadTasks()
    }
  } catch (error) {
    console.error('创建任务失败:', error)
    message.error('创建任务失败')
  }
}

loadTasks()
</script>

<style scoped>
.task-manager {
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

.task-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tasks-table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.task-name {
  font-weight: 500;
  color: #1f2937;
}

.task-description {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-helper {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.ai-helper-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-icon {
  color: #6366f1;
  font-size: 16px;
}

.ai-helper-title {
  font-size: 14px;
  font-weight: 500;
  color: #4338ca;
}

.ai-input {
  margin-bottom: 8px;
}

.ai-helper-hint {
  font-size: 12px;
  color: #6366f1;
  margin: 0;
}

.cron-input {
  font-family: 'Courier New', monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
