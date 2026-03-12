import request from '@/utils/request'
import type { ApiResponse, Stats, Task, TaskInstance, ClusterNode, ClusterStats, Log, DispatchLog } from '@/types'

export const statsApi = {
  getStats(): Promise<ApiResponse<Stats>> {
    return request.get('/tasks/stats')
  }
}

export const tasksApi = {
  getTasks(params?: { enabled?: boolean; page?: number; page_size?: number }): Promise<ApiResponse<{ items: Task[]; total: number; page: number; page_size: number; total_pages: number }>> {
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

  triggerTask(id: string, data?: { scheduled_time?: number | null }): Promise<ApiResponse<TaskInstance>> {
    return request.post(`/tasks/${id}/trigger`, data)
  }
}

export const instancesApi = {
  getInstances(params?: {
    task_id?: string
    status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{ items: TaskInstance[]; total: number; page: number; page_size: number; total_pages: number }>> {
    return request.get('/tasks/instances', { params })
  },

  getInstance(id: string): Promise<ApiResponse<TaskInstance>> {
    return request.get(`/tasks/instances/${id}`)
  }
}

export const clusterApi = {
  getNodes(): Promise<ApiResponse<{ nodes: ClusterNode[]; total_nodes: number; active_nodes: number }>> {
    return request.get('/clusters/info')
  },

  getNode(id: string): Promise<ApiResponse<ClusterNode>> {
    return request.get(`/clusters/${id}`)
  },

  getClusterStats(): Promise<ApiResponse<ClusterStats>> {
    return request.get('/clusters/stats')
  },

  addNode(data: { name: string; ip: string; port: number; role: 'master' | 'worker' }): Promise<ApiResponse<ClusterNode>> {
    return request.post('/clusters', data)
  },

  removeNode(id: string): Promise<ApiResponse<null>> {
    return request.delete(`/clusters/${id}`)
  },

  updateNode(id: string, data: Partial<{ name: string; role: 'master' | 'worker' }>): Promise<ApiResponse<ClusterNode>> {
    return request.put(`/clusters/${id}`, data)
  }
}

export const logsApi = {
  // 执行日志
  getExecutionLogs(params?: {
    task_id?: string
    instance_id?: string
    status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
    triggered_by?: 'scheduler' | 'manual'
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{ items: Log[]; total: number; page: number; page_size: number; total_pages: number }>> {
    return request.get('/execution/logs', { params })
  },

  getExecutionLog(id: string): Promise<ApiResponse<Log>> {
    return request.get(`/execution/logs/${id}`)
  },

  // 分发日志
  getDispatchLogs(params?: {
    start_time?: string
    end_time?: string
    has_error?: boolean
    page?: number
    page_size?: number
  }): Promise<ApiResponse<{ items: DispatchLog[]; total: number; page: number; page_size: number; total_pages: number }>> {
    return request.get('/dispatch/logs', { params })
  },

  getDispatchLog(id: string): Promise<ApiResponse<DispatchLog>> {
    return request.get(`/dispatch/logs/${id}`)
  }
}
