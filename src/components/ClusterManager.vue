<template>
  <div class="cluster-manager">
    <div class="cluster-manager-header">
      <h2 class="page-title">集群管理</h2>
      <div class="header-actions">
        <a-button type="primary" @click="showAddModal = true">
          <template #icon>
            <PlusOutlined />
          </template>
          添加节点
        </a-button>
      </div>
    </div>

    <div class="cluster-stats-card">
      <a-card title="集群统计" size="small">
        <a-row :gutter="[16, 16]">
          <a-col :span="6">
            <a-statistic title="总节点数" :value="clusterStats.total_nodes || 0" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="在线节点" :value="clusterStats.online_nodes || 0" prefix="" suffix="" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="主节点" :value="clusterStats.master_nodes || 0" />
          </a-col>
          <a-col :span="6">
            <a-statistic title="工作节点" :value="clusterStats.worker_nodes || 0" />
          </a-col>
        </a-row>
        <a-row :gutter="[16, 16]" style="margin-top: 16px">
          <a-col :span="12">
            <a-statistic title="CPU 使用率" :value="clusterStats.total_cpu_usage || 0" suffix="%" />
          </a-col>
          <a-col :span="12">
            <a-statistic title="内存使用率" :value="clusterStats.total_memory_usage || 0" suffix="%" />
          </a-col>
        </a-row>
      </a-card>
    </div>

    <a-card class="nodes-table-card">
      <a-table :columns="columns" :data-source="nodes" :loading="loading" row-key="node_id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'success' : 'error'">
              {{ record.status === 'active' ? '活跃' : '非活跃' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'metadata'">
            <a-tag :color="record.metadata === 'dispatcher' ? 'blue' : 'green'">
              {{ record.metadata === 'dispatcher' ? '调度器' : '执行器' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'cpu_usage'">
            <span>{{ record.cpu_usage.toFixed(2) }}%</span>
          </template>
          <template v-else-if="column.key === 'memory_usage'">
            <span>{{ record.memory_usage.toFixed(2) }}%</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-tooltip title="查看详情">
                <a-button type="text" @click="viewNode(record.node_id)">
                  <template #icon>
                    <EyeOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑">
                <a-button type="text" @click="editNode(record)">
                  <template #icon>
                    <EditOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除">
                <a-button type="text" danger @click="deleteNode(record.node_id)">
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

    <!-- 添加节点模态框 -->
    <a-modal v-model:open="showAddModal" title="添加节点" :footer="null" width="600px">
      <a-form :model="formState" :rules="rules" @finish="handleAddNode" layout="vertical">
        <a-form-item label="节点名称" name="name">
          <a-input v-model:value="formState.name" placeholder="例如：worker-1" />
        </a-form-item>

        <a-form-item label="IP 地址" name="ip">
          <a-input v-model:value="formState.ip" placeholder="例如：192.168.1.100" />
        </a-form-item>

        <a-form-item label="端口" name="port">
          <a-input-number v-model:value="formState.port" :min="1" :max="65535" style="width: 100%" />
        </a-form-item>

        <a-form-item label="角色" name="role">
          <a-select v-model:value="formState.role" placeholder="选择节点角色">
            <a-select-option value="master">主节点</a-select-option>
            <a-select-option value="worker">工作节点</a-select-option>
          </a-select>
        </a-form-item>

        <div class="form-actions">
          <a-button @click="showAddModal = false">取消</a-button>
          <a-button type="primary" html-type="submit">添加节点</a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- 编辑节点模态框 -->
    <a-modal v-model:open="showEditModal" title="编辑节点" :footer="null" width="600px">
      <a-form :model="formState" :rules="rules" @finish="handleEditNode" layout="vertical">
        <a-form-item label="节点名称" name="name">
          <a-input v-model:value="formState.name" placeholder="例如：worker-1" />
        </a-form-item>

        <a-form-item label="角色" name="role">
          <a-select v-model:value="formState.role" placeholder="选择节点角色">
            <a-select-option value="master">主节点</a-select-option>
            <a-select-option value="worker">工作节点</a-select-option>
          </a-select>
        </a-form-item>

        <div class="form-actions">
          <a-button @click="showEditModal = false">取消</a-button>
          <a-button type="primary" html-type="submit">保存修改</a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- 节点详情模态框 -->
    <a-modal v-model:open="showDetailModal" title="节点详情" :footer="null" width="600px">
      <div v-if="currentNode">
        <a-descriptions column="1">
          <a-descriptions-item label="节点 ID">{{ currentNode.node_id }}</a-descriptions-item>
          <a-descriptions-item label="节点名称">{{ currentNode.node_name }}</a-descriptions-item>
          <a-descriptions-item label="主机">{{ currentNode.host }}</a-descriptions-item>
          <a-descriptions-item label="端口">{{ currentNode.port }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="currentNode.status === 'active' ? 'success' : 'error'">
              {{ currentNode.status === 'active' ? '活跃' : '非活跃' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-tag :color="currentNode.metadata === 'dispatcher' ? 'blue' : 'green'">
              {{ currentNode.metadata === 'dispatcher' ? '调度器' : '执行器' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="CPU 使用率">{{ currentNode.cpu_usage.toFixed(2) }}%</a-descriptions-item>
          <a-descriptions-item label="内存使用率">{{ currentNode.memory_usage.toFixed(2) }}%</a-descriptions-item>
          <a-descriptions-item label="总内存">{{ currentNode.memory_total }}GB</a-descriptions-item>
          <a-descriptions-item label="活跃任务">{{ currentNode.active_tasks }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import type { ClusterNode, ClusterStats } from '../types'
import { clusterApi } from '../api'

const columns = [
  {
    title: '节点名称',
    key: 'node_name',
    dataIndex: 'node_name'
  },
  {
    title: '节点 ID',
    key: 'node_id',
    dataIndex: 'node_id',
    ellipsis: true
  },
  {
    title: '主机',
    key: 'host',
    dataIndex: 'host'
  },
  {
    title: '端口',
    key: 'port',
    dataIndex: 'port'
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status'
  },
  {
    title: '类型',
    key: 'metadata',
    dataIndex: 'metadata'
  },
  {
    title: 'CPU 使用率',
    key: 'cpu_usage',
    dataIndex: 'cpu_usage'
  },
  {
    title: '内存使用率',
    key: 'memory_usage',
    dataIndex: 'memory_usage'
  },
  {
    title: '活跃任务',
    key: 'active_tasks',
    dataIndex: 'active_tasks'
  },
  {
    title: '操作',
    key: 'actions',
    align: 'right' as const
  }
]

const nodes = ref<ClusterNode[]>([])
const clusterStats = ref<ClusterStats>({
  total_nodes: 0,
  online_nodes: 0,
  master_nodes: 0,
  worker_nodes: 0,
  total_cpu_usage: 0,
  total_memory_usage: 0
})
const loading = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDetailModal = ref(false)
const currentNode = ref<ClusterNode | null>(null)
const currentNodeId = ref('')

const formState = ref({
  name: '',
  ip: '',
  port: 8080,
  role: 'worker' as 'master' | 'worker'
})

const rules = {
  name: [{ required: true, message: '请输入节点名称' }],
  ip: [{ required: true, message: '请输入 IP 地址' }],
  port: [{ required: true, message: '请输入端口' }],
  role: [{ required: true, message: '请选择节点角色' }]
}

const loadNodes = async () => {
  loading.value = true
  try {
    const response = await clusterApi.getNodes()
    if (response.success && response.data) {
      nodes.value = response.data.nodes
    }
  } catch (error) {
    console.error('加载节点失败:', error)
    message.error('加载节点失败')
  } finally {
    loading.value = false
  }
}

const loadClusterStats = async () => {
  try {
    const response = await clusterApi.getClusterStats()
    if (response.success && response.data) {
      clusterStats.value = response.data
    }
  } catch (error) {
    console.error('加载集群统计信息失败:', error)
  }
}

const handleAddNode = async () => {
  try {
    await clusterApi.addNode({
      name: formState.value.name,
      ip: formState.value.ip,
      port: formState.value.port,
      role: formState.value.role
    })
    message.success('节点添加成功')
    showAddModal.value = false
    resetForm()
    await loadNodes()
    await loadClusterStats()
  } catch (error) {
    console.error('添加节点失败:', error)
    message.error('添加节点失败')
  }
}

const handleEditNode = async () => {
  try {
    await clusterApi.updateNode(currentNodeId.value, {
      name: formState.value.name,
      role: formState.value.role
    })
    message.success('节点更新成功')
    showEditModal.value = false
    resetForm()
    await loadNodes()
  } catch (error) {
    console.error('更新节点失败:', error)
    message.error('更新节点失败')
  }
}

const deleteNode = async (id: string) => {
  try {
    await clusterApi.removeNode(id)
    message.success('节点删除成功')
    await loadNodes()
    await loadClusterStats()
  } catch (error) {
    console.error('删除节点失败:', error)
    message.error('删除节点失败')
  }
}

const viewNode = async (id: string) => {
  try {
    const response = await clusterApi.getNode(id)
    if (response.success && response.data) {
      currentNode.value = response.data
      showDetailModal.value = true
    }
  } catch (error) {
    console.error('获取节点详情失败:', error)
    message.error('获取节点详情失败')
  }
}

const editNode = (node: ClusterNode) => {
  currentNodeId.value = node.node_id
  formState.value = {
    name: node.node_name,
    ip: node.host,
    port: node.port,
    role: node.metadata === 'dispatcher' ? 'master' : 'worker'
  }
  showEditModal.value = true
}

const resetForm = () => {
  formState.value = {
    name: '',
    ip: '',
    port: 8080,
    role: 'worker'
  }
}

onMounted(async () => {
  await loadNodes()
  await loadClusterStats()
})
</script>

<style scoped>
.cluster-manager {
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

.cluster-manager-header {
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

.cluster-stats-card {
  margin-bottom: 24px;
}

.nodes-table-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>