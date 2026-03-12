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

export interface ClusterNode {
  node_name: string
  node_id: string
  host: string
  port: number
  status: 'active' | 'inactive'
  cpu_usage: number
  memory_usage: number
  memory_total: number
  active_tasks: number
  metadata: string
}

export interface ClusterStats {
  total_nodes: number
  online_nodes: number
  master_nodes: number
  worker_nodes: number
  total_cpu_usage: number
  total_memory_usage: number
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
  _id: { $oid: string }
  task_id: { $oid: string }
  scheduled_time: { $date: { $numberLong: string } }
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  executor_id: string | null
  start_time: { $date: { $numberLong: string } } | null
  end_time: { $date: { $numberLong: string } } | null
  retry_count: number
  result: any
  triggered_by: 'scheduler' | 'manual'
  created_at: { $date: { $numberLong: string } }
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

export interface Log {
  _id: string
  task_id: string
  task_name: string
  instance_id: string
  scheduled_time: string
  start_time: string
  end_time: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  duration_ms: number
  output_summary: string
  error_message: string | null
  triggered_by: 'scheduler' | 'manual'
}

export interface DispatchLog {
  _id: any
  scan_time: any
  scan_window_start: any
  scan_window_end: any
  total_tasks: number
  enabled_tasks: number
  dispatched_instances: number
  error?: string
  has_error?: boolean
}

export type ViewState = 'DASHBOARD' | 'TASKS' | 'WORKERS' | 'SETTINGS' | 'LOGS'
