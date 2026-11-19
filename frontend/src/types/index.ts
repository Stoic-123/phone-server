export interface CpuInfo {
  usage_percent: number | null;
  cores: number;
  model: string;
  frequency_mhz: number | null;
}

export interface MemoryInfo {
  total_mb: number;
  used_mb: number;
  free_mb: number;
  available_mb: number;
  usage_percent: number;
}

export interface StorageInfo {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_percent: number;
  path: string;
}

export interface BatteryInfo {
  present: boolean;
  percentage: number | null;
  temperature_c: number | null;
  status: string | null;
  health: string | null;
}

export interface NetworkInfo {
  local_ip: string;
  hostname: string;
  interfaces: { name: string; ip: string }[];
  bytes_sent: number | null;
  bytes_recv: number | null;
}

export interface ServiceStatus {
  name: string;
  port: number | null;
  status: 'running' | 'stopped' | 'error';
  pid: number | null;
}

export interface SystemMetrics {
  online: boolean;
  device_model: string;
  android_version: string | null;
  kernel_version: string;
  uptime_seconds: number;
  uptime_human: string;
  cpu: CpuInfo;
  memory: MemoryInfo;
  storage: StorageInfo;
  battery: BatteryInfo;
  network: NetworkInfo;
  services: ServiceStatus[];
  is_termux: boolean;
  timestamp: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: 'python_fastapi' | 'python_flask' | 'python_generic' | 'nodejs_express' | 'nodejs_generic' | 'static_html';
  port: number;
  entrypoint: string;
  env_vars: Record<string, string>;
  status: 'running' | 'stopped' | 'error';
  auto_restart: boolean;
  pid: number | null;
  created_at: number;
  updated_at: number;
}

export interface Deployment {
  id: string;
  project_id: string;
  source_type: 'git' | 'zip';
  source_ref: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  log: string;
  created_at: number;
}

export interface SystemLog {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR';
  source: string;
  message: string;
  project_id: string | null;
  timestamp: number;
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface AiToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  requires_confirmation: boolean;
  action_id: string | null;
  description: string;
}

export interface AiChatResponse {
  reply: string;
  tool_call?: AiToolCall;
  suggested_actions: string[];
}
