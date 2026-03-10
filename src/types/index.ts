export enum TaskStatus {
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS'
}

export enum WorkerStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY'
}

export interface Task {
  _id: string
  name: string
  description: string | null
  type: 'command' | 'http'
  schedule: string
  enabled: boolean
  payload: any
  timeout_seconds: number | null
  max_retries: number | null
  created_at: string
  updated_at: string
}

export interface WorkerNode {
  id: string
  name: string
  ip: string
  status: WorkerStatus
  cpuUsage: number
  memoryUsage: number
  activeTasks: number
}

export interface TaskInstance {
  _id: string
  task_id: string
  scheduled_time: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  executor_id: string | null
  start_time: string | null
  end_time: string | null
  retry_count: number
  result: any
  created_at: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T | null
  message: string | null
}

export interface Stats {
  total_tasks: number
  enabled_tasks: number
  total_instances: number
  pending_instances: number
  running_instances: number
  success_instances: number
  failed_instances: number
}

export type ViewState = 'DASHBOARD' | 'TASKS' | 'WORKERS' | 'SETTINGS'
