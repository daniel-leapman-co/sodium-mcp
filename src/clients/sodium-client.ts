import "dotenv/config";

const SODIUM_API_URL = process.env.SODIUM_API_URL || "https://api.sodiumhq.com";
const SODIUM_API_KEY = process.env.SODIUM_API_KEY;
const SODIUM_TENANT = process.env.SODIUM_TENANT;

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

interface ApiError {
  message: string;
  statusCode: number;
}

// API returns paginated responses wrapped in this structure
interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export class SodiumClient {
  private static instance: SodiumClient | null = null;
  private apiKey: string;
  private tenant: string;
  private baseUrl: string;

  private constructor() {
    if (!SODIUM_API_KEY) {
      throw new Error("SODIUM_API_KEY environment variable is required");
    }
    if (!SODIUM_TENANT) {
      throw new Error("SODIUM_TENANT environment variable is required");
    }
    this.apiKey = SODIUM_API_KEY;
    this.tenant = SODIUM_TENANT;
    this.baseUrl = SODIUM_API_URL;
  }

  public static getInstance(): SodiumClient {
    if (!SodiumClient.instance) {
      SodiumClient.instance = new SodiumClient();
    }
    return SodiumClient.instance;
  }

  public getTenant(): string {
    return this.tenant;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);

    const headers: Record<string, string> = {
      "x-api-key": this.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    };

    const fetchOptions: RequestInit = {
      method: options.method,
      headers,
    };

    if (options.body && (options.method === "POST" || options.method === "PUT")) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json() as { message?: string };
        if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Use default error message
      }

      const error: ApiError = {
        message: errorMessage,
        statusCode: response.status,
      };
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // Helper method to construct tenant-scoped paths
  private tenantPath(path: string): string {
    return `/tenants/${this.tenant}${path}`;
  }

  // ==================== CLIENTS ====================

  async listClients(query?: { offset?: number; limit?: number; search?: string }) {
    const response = await this.request<PaginatedResponse<Client>>({
      method: "GET",
      path: this.tenantPath("/clients"),
      query,
    });
    return response.data;
  }

  async getClient(code: string) {
    return this.request<Client>({
      method: "GET",
      path: this.tenantPath(`/clients/${code}`),
    });
  }

  async createClient(data: CreateClientRequest) {
    return this.request<Client>({
      method: "POST",
      path: this.tenantPath("/clients"),
      body: data,
    });
  }

  async updateClient(code: string, data: UpdateClientRequest) {
    return this.request<Client>({
      method: "PUT",
      path: this.tenantPath(`/clients/${code}`),
      body: data,
    });
  }

  async deleteClient(code: string) {
    return this.request<void>({
      method: "DELETE",
      path: this.tenantPath(`/clients/${code}`),
    });
  }

  // ==================== CLIENT CONTACTS ====================

  async listClientContacts(clientCode: string) {
    const response = await this.request<PaginatedResponse<ClientContact>>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/clientcontact`),
    });
    return response.data;
  }

  async getClientContact(clientCode: string, contactCode: string) {
    return this.request<ClientContact>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/clientcontact/${contactCode}`),
    });
  }

  async createClientContact(clientCode: string, data: CreateClientContactRequest) {
    return this.request<ClientContact>({
      method: "POST",
      path: this.tenantPath(`/clients/${clientCode}/clientcontact`),
      body: data,
    });
  }

  async updateClientContact(clientCode: string, contactCode: string, data: UpdateClientContactRequest) {
    return this.request<ClientContact>({
      method: "PUT",
      path: this.tenantPath(`/clients/${clientCode}/clientcontact/${contactCode}`),
      body: data,
    });
  }

  async deleteClientContact(clientCode: string, contactCode: string) {
    return this.request<void>({
      method: "DELETE",
      path: this.tenantPath(`/clients/${clientCode}/clientcontact/${contactCode}`),
    });
  }

  // ==================== CLIENT NOTES ====================

  async listClientNotes(clientCode: string) {
    const response = await this.request<PaginatedResponse<ClientNote>>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/clientnote`),
    });
    return response.data;
  }

  async getClientNote(clientCode: string, noteCode: string) {
    return this.request<ClientNote>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/clientnote/${noteCode}`),
    });
  }

  async createClientNote(clientCode: string, data: CreateClientNoteRequest) {
    return this.request<ClientNote>({
      method: "POST",
      path: this.tenantPath(`/clients/${clientCode}/clientnote`),
      body: data,
    });
  }

  async updateClientNote(clientCode: string, noteCode: string, data: UpdateClientNoteRequest) {
    return this.request<ClientNote>({
      method: "PUT",
      path: this.tenantPath(`/clients/${clientCode}/clientnote/${noteCode}`),
      body: data,
    });
  }

  async deleteClientNote(clientCode: string, noteCode: string) {
    return this.request<void>({
      method: "DELETE",
      path: this.tenantPath(`/clients/${clientCode}/clientnote/${noteCode}`),
    });
  }

  // ==================== TASKS ====================

  async listTasks(query?: { offset?: number; limit?: number; clientCode?: string }) {
    const response = await this.request<PaginatedResponse<Task>>({
      method: "GET",
      path: this.tenantPath("/tasks"),
      query,
    });
    return response.data;
  }

  async getTask(code: string) {
    return this.request<Task>({
      method: "GET",
      path: this.tenantPath(`/tasks/${code}`),
    });
  }

  async createTask(data: CreateTaskRequest) {
    return this.request<Task>({
      method: "POST",
      path: this.tenantPath("/tasks"),
      body: data,
    });
  }

  async updateTask(code: string, data: UpdateTaskRequest) {
    return this.request<Task>({
      method: "PUT",
      path: this.tenantPath(`/tasks/${code}`),
      body: data,
    });
  }

  async deleteTask(code: string) {
    return this.request<void>({
      method: "DELETE",
      path: this.tenantPath(`/tasks/${code}`),
    });
  }

  // ==================== ENGAGEMENTS ====================

  async listEngagements(query?: { offset?: number; limit?: number }) {
    const response = await this.request<PaginatedResponse<Engagement>>({
      method: "GET",
      path: this.tenantPath("/engagements"),
      query,
    });
    return response.data;
  }

  async getEngagement(code: string) {
    return this.request<Engagement>({
      method: "GET",
      path: this.tenantPath(`/engagements/${code}`),
    });
  }

  async createEngagement(data: CreateEngagementRequest) {
    return this.request<Engagement>({
      method: "POST",
      path: this.tenantPath("/engagements"),
      body: data,
    });
  }

  async updateEngagement(code: string, data: UpdateEngagementRequest) {
    return this.request<Engagement>({
      method: "PUT",
      path: this.tenantPath(`/engagements/${code}`),
      body: data,
    });
  }

  async deleteEngagement(code: string) {
    return this.request<void>({
      method: "DELETE",
      path: this.tenantPath(`/engagements/${code}`),
    });
  }

  async sendEngagementEmail(code: string) {
    return this.request<void>({
      method: "POST",
      path: this.tenantPath(`/engagements/${code}/email`),
    });
  }
}

// ==================== TYPE DEFINITIONS ====================

export interface UserRef {
  code: string;
  name: string;
}

export interface ContactPreferences {
  post?: boolean;
  telephone?: boolean;
  email?: boolean;
  sms?: boolean;
}

export interface Client {
  code: string;
  name: string;
  type?: string;
  status?: string;
  manager?: UserRef;
  partner?: UserRef;
  revenueRangeCode?: string;
  accountingCustomerCode?: string;
  contactPreferences?: ContactPreferences;
  pclSent?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateClientRequest {
  name: string;
  type?: string;
}

export interface UpdateClientRequest {
  name?: string;
  type?: string;
  status?: string;
}

export interface ClientContact {
  code: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  isPrimary?: boolean;
}

export interface CreateClientContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  isPrimary?: boolean;
}

export interface UpdateClientContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type?: string;
  isPrimary?: boolean;
}

export interface ClientNote {
  code: string;
  content: string;
  isPinned?: boolean;
  createdAt?: string;
  createdBy?: string;
}

export interface CreateClientNoteRequest {
  content: string;
  isPinned?: boolean;
}

export interface UpdateClientNoteRequest {
  content?: string;
  isPinned?: boolean;
}

export interface Task {
  code: string;
  name: string;
  description?: string;
  status?: string;
  dueDate?: string;
  clientCode?: string;
  assignedTo?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaskRequest {
  name: string;
  description?: string;
  dueDate?: string;
  clientCode?: string;
  assignedTo?: string;
  category?: string;
}

export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  assignedTo?: string;
  category?: string;
}

export interface EngagementClient {
  code: string;
  name: string;
}

export interface EngagementTemplate {
  code: string;
  name: string;
}

export interface EngagementAcceptance {
  acceptedDate?: string;
  acceptedIpAddress?: string;
  manuallyAccepted?: boolean;
}

export interface Engagement {
  code: string;
  guid?: string;
  client?: EngagementClient;
  date?: string;
  status?: string;
  type?: string;
  typeName?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  hasProposalPdf?: boolean;
  hasLofEPdf?: boolean;
  proposalTemplate?: EngagementTemplate;
  lofETemplate?: EngagementTemplate;
  acceptance?: EngagementAcceptance;
  lastViewed?: string;
  annualValue?: number;
  numberOfServices?: number;
  link?: string;
}

export interface CreateEngagementRequest {
  clientCode: string;
}

export interface UpdateEngagementRequest {
  status?: string;
}

export interface EngagementService {
  serviceCode: string;
  fee?: number;
}

// Export singleton getter
export function getSodiumClient(): SodiumClient {
  return SodiumClient.getInstance();
}
