
export interface ContainerInfo {
  Command: string;
  CreatedAt: string;
  ExitCode: number;
  Health: string | null;
  ID: string;
  Image: string;
  Name: string;
  Names: string[];
  State: 'running' | 'exited' | 'restarting' | 'paused' | 'created' | 'dead';
  Status: string;
  Service: string;
}

export interface RealStatus {
  status: 'running' | 'partially_running' | 'stopped' | 'not_found' | 'unknown' | 'error';
  containers: ContainerInfo[];
  running?: number;
  total?: number;
  error?: string;
}

export interface Service {
  id: number;
  name: string;
  path: string;
  enabled: number;
  status: string;
  created_at: string;
  updated_at: string;
  real_status: RealStatus;
  yaml_content?: string;
}

export interface ValidationSummary {
  consistent_count?: number;
  inconsistent_count?: number;
  orphaned_count?: number;
  consistency_percentage?: number;
  valid_count?: number;
  invalid_count?: number;
  enabled_healthy_count?: number;
  validation_percentage?: number;
}

export interface ValidationResult {
  total: number;
  summary: ValidationSummary;
  consistent?: any[];
  inconsistent?: any[];
  orphaned_folders?: any[];
  valid?: any[];
  invalid?: any[];
  suggested_fixes?: any[];
}

// New System Types
export interface CPUInfo {
  physical_cores: number;
  logical_cores: number;
  usage_percent: number;
  model: string;
  architecture: string;
  load_average_1min: number;
}

export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  usage_percent: number;
}

export interface DiskInfo {
  device: string;
  mountpoint: string;
  total: number;
  used: number;
  usage_percent: number;
}

export interface NetworkInterfaceInfo {
  name: string;
  ip_address: string;
  is_up: boolean;
  bytes_sent: number;
  bytes_recv: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  status: string;
  cpu_percent: number;
  memory_percent: number;
  memory_rss: number;
  username?: string;
}

export interface DockerGlobalInfo {
  version: string;
  containers_total: number;
  containers_running: number;
  images_total: number;
  images_size: number;
  is_docker_available: boolean;
}

export interface SystemMetrics {
  timestamp: string;
  cpu: { percent: number; cores: number; load_average: number[] };
  memory: { total: number; used: number; percent: number };
  network: { bytes_sent: number; bytes_recv: number };
  formatted: {
    cpu_percent: string;
    memory_percent: string;
    memory_used: string;
    memory_total: string;
    network_sent: string;
    network_recv: string;
  };
}

export interface AuthResult {
  authenticated: boolean;
  message: string;
  client_ip: string;
}
