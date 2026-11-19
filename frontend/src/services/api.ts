import {
  SystemMetrics,
  Project,
  Deployment,
  SystemLog,
  AiChatResponse,
  AiChatMessage
} from '../types';

const API_BASE = '/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('pocketdev_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('pocketdev_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('pocketdev_token');
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (res.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event('pocketdev_auth_expired'));
    throw new Error('Authentication required');
  }

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const text = await res.text();
      try {
        const errJson = JSON.parse(text);
        errorDetail = errJson.detail || errJson.message || text;
      } catch {
        errorDetail = text || errorDetail;
      }
    } catch {
      errorDetail = `Request failed with status ${res.status}`;
    }
    throw new Error(errorDetail);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  async login(username: string, password: string) {
    const res = await request<{ access_token: string; username: string; is_initial_password: boolean }>(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }
    );
    setAuthToken(res.access_token);
    return res;
  },

  async getInitialCredentials() {
    return request<{ initial_setup_required: boolean; username?: string; initial_password?: string }>(
      '/auth/initial-credentials'
    );
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return request<{ status: string; message: string }>('/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    });
  },

  // System
  async getMetrics(): Promise<SystemMetrics> {
    return request<SystemMetrics>('/system');
  },

  async getSystemLogs(limit: number = 50): Promise<SystemLog[]> {
    return request<SystemLog[]>(`/system/logs?limit=${limit}`);
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/projects');
  },

  async getProject(id: string): Promise<Project> {
    return request<Project>(`/projects/${id}`);
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return request<Project>(`/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async deleteProject(id: string): Promise<{ status: string }> {
    return request<{ status: string }>(`/projects/${id}`, {
      method: 'DELETE'
    });
  },

  async startProject(id: string): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>(`/projects/${id}/start`, {
      method: 'POST'
    });
  },

  async stopProject(id: string): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>(`/projects/${id}/stop`, {
      method: 'POST'
    });
  },

  async restartProject(id: string): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>(`/projects/${id}/restart`, {
      method: 'POST'
    });
  },

  async getProjectLogs(id: string, limit: number = 150): Promise<{ id: string; name: string; lines: string[]; total_lines: number }> {
    return request<{ id: string; name: string; lines: string[]; total_lines: number }>(`/projects/${id}/logs?limit=${limit}`);
  },

  // Deployments
  async deployGit(projectId: string, repoUrl: string, branch: string = 'main') {
    return request<Deployment>('/deployments/git', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        repo_url: repoUrl,
        branch,
        install_dependencies: true,
        restart_after_deploy: true
      })
    });
  },

  async deployZip(projectId: string, file: File) {
    const formData = new FormData();
    formData.append('project_id', projectId);
    formData.append('file', file);
    formData.append('install_dependencies', 'true');
    formData.append('restart_after_deploy', 'true');

    return request<Deployment>('/deployments/upload-zip', {
      method: 'POST',
      body: formData
    });
  },

  async getDeployments(projectId: string): Promise<Deployment[]> {
    return request<Deployment[]>(`/deployments/${projectId}`);
  },

  // AI Assistant
  async aiChat(message: string, projectId?: string, history: AiChatMessage[] = []): Promise<AiChatResponse> {
    return request<AiChatResponse>('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        project_id: projectId,
        conversation_history: history
      })
    });
  },

  async aiExecuteAction(actionId: string, confirmed: boolean): Promise<{ status: string; message: string }> {
    return request<{ status: string; message: string }>('/ai/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_id: actionId,
        confirmed
      })
    });
  }
};
