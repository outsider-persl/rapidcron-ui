import request from '@/utils/request'
import type { ApiResponse, Stats, Task, TaskInstance } from '@/types'

export const statsApi = {
  getStats(): Promise<ApiResponse<Stats>> {
    return request.get('/stats')
  }
}

export const tasksApi = {
  getTasks(params?: { enabled?: boolean; page?: number; page_size?: number }): Promise<ApiResponse<{ tasks: Task[]; total: number }>> {
    return request.get('/tasks', { params })
  },

  getTask(id: string): Promise<ApiResponse<Task>> {
    return request.get(`/tasks/${id}`)
  },

  createTask(data: {
    name: string
    description?: string
    schedule: string
    task_type?: 'command' | 'http'
    command?: string
    url?: string
    enabled?: boolean
    timeout_seconds?: number
    max_retries?: number
    dependency_ids?: string[]
  }): Promise<ApiResponse<Task>> {
    return request.post('/tasks', data)
  },

  updateTask(id: string, data: Partial<{
    name: string
    description: string
    schedule: string
    task_type: 'command' | 'http'
    command: string
    url: string
    enabled: boolean
    timeout_seconds: number
    max_retries: number
    dependency_ids: string[]
  }>): Promise<ApiResponse<Task>> {
    return request.put(`/tasks/${id}`, data)
  },

  deleteTask(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/tasks/${id}`)
  },

  enableTask(id: string): Promise<ApiResponse<null>> {
    return request.post(`/tasks/${id}/enable`)
  },

  disableTask(id: string): Promise<ApiResponse<null>> {
    return request.post(`/tasks/${id}/disable`)
  },

  triggerTask(id: string, data?: { scheduled_time?: string | null }): Promise<ApiResponse<TaskInstance>> {
    return request.post(`/tasks/${id}/trigger`, data)
  }
}

export const instancesApi = {
  getInstances(params?: {
    task_id?: string
    status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{ instances: TaskInstance[]; total: number }>> {
    return request.get('/instances', { params })
  },

  getInstance(id: string): Promise<ApiResponse<TaskInstance>> {
    return request.get(`/instances/${id}`)
  }
}
