import "dotenv/config";

const SODIUM_API_URL = process.env.SODIUM_API_URL || "https://api.sodiumhq.com";
const SODIUM_API_KEY = process.env.SODIUM_API_KEY;
const SODIUM_TENANT = process.env.SODIUM_TENANT;

interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined>;
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

  private buildUrl(path: string, query?: Record<string, string | number | boolean | string[] | undefined>): string {
    const url = new URL(path, this.baseUrl);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, v));
        } else {
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

  private async binaryRequest(options: Omit<RequestOptions, "body">): Promise<string> {
    const url = this.buildUrl(options.path, options.query);

    const response = await fetch(url, {
      method: options.method,
      headers: {
        "x-api-key": this.apiKey,
        "Accept": "application/pdf",
      },
    });

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
      throw { message: errorMessage, statusCode: response.status } as ApiError;
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
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

  // ==================== CLIENT SERVICES ====================

  async listClientServices(clientCode: string) {
    const response = await this.request<PaginatedResponse<ClientBillableService>>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/services/clientbillableservice`),
    });
    return response.data;
  }

  async getClientService(clientCode: string, serviceCode: string) {
    return this.request<ClientBillableService>({
      method: "GET",
      path: this.tenantPath(`/clients/${clientCode}/services/clientbillableservice/${serviceCode}`),
    });
  }

  async createClientService(clientCode: string, data: CreateClientServiceRequest) {
    return this.request<ClientBillableService>({
      method: "POST",
      path: this.tenantPath(`/clients/${clientCode}/services/clientbillableservice`),
      body: data,
    });
  }

  async updateClientService(clientCode: string, serviceCode: string, data: UpdateClientServiceRequest) {
    return this.request<ClientBillableService>({
      method: "PUT",
      path: this.tenantPath(`/clients/${clientCode}/services/clientbillableservice/${serviceCode}`),
      body: data,
    });
  }

  // ==================== ENGAGEMENTS ====================

  async listEngagements(query?: {
    offset?: number;
    limit?: number;
    search?: string;
    status?: EngagementStatus;
    sortBy?: "Client" | "Code" | "Date" | "Status" | "NumberOfServices" | "AnnualValue";
    sortDesc?: boolean;
  }) {
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

  async getEngagementEmails(code: string) {
    return this.request<EngagementEmail[]>({
      method: "GET",
      path: this.tenantPath(`/engagements/${code}/email`),
    });
  }

  async uploadEngagementProposalPdf(code: string, pdfContent: string) {
    return this.request<void>({
      method: "POST",
      path: this.tenantPath(`/engagements/${code}/pdf/proposal`),
      body: { pdfContent },
    });
  }

  async downloadEngagementProposalPdf(code: string): Promise<string> {
    return this.binaryRequest({
      method: "GET",
      path: this.tenantPath(`/engagements/${code}/pdf/proposal`),
    });
  }

  async uploadEngagementLoePdf(code: string, pdfContent: string) {
    return this.request<void>({
      method: "POST",
      path: this.tenantPath(`/engagements/${code}/pdf/letter-of-engagement`),
      body: { pdfContent },
    });
  }

  async downloadEngagementLoePdf(code: string): Promise<string> {
    return this.binaryRequest({
      method: "GET",
      path: this.tenantPath(`/engagements/${code}/pdf/letter-of-engagement`),
    });
  }

  // ==================== SERVICES ====================

  async listServices(query?: {
    search?: string;
    category?: ServiceCategory;
    clientType?: ClientType;
    isArchived?: boolean;
    offset?: number;
    limit?: number;
    sortBy?: "Name" | "Category" | "AccountingCode";
    sortDesc?: boolean;
  }) {
    const response = await this.request<PaginatedResponse<BillableService>>({
      method: "GET",
      path: this.tenantPath("/services"),
      query,
    });
    return response.data;
  }

  async getService(code: string) {
    return this.request<BillableService>({
      method: "GET",
      path: this.tenantPath(`/services/${code}`),
    });
  }

  // ==================== DOCUMENT TEMPLATES ====================

  async listDocumentTemplates(query?: {
    search?: string;
    type?: TemplateType;
    isActive?: boolean;
    offset?: number;
    limit?: number;
    sortBy?: "Name" | "UpdatedDate";
    sortDesc?: boolean;
  }) {
    const response = await this.request<PaginatedResponse<DocumentTemplate>>({
      method: "GET",
      path: this.tenantPath("/document-templates"),
      query,
    });
    return response.data;
  }

  async getDocumentTemplate(code: string) {
    return this.request<DocumentTemplate>({
      method: "GET",
      path: this.tenantPath(`/document-templates/${code}`),
    });
  }

  // ==================== ENGAGEMENT SETTINGS ====================

  async getEngagementSettings() {
    return this.request<EngagementSettings>({
      method: "GET",
      path: this.tenantPath("/practice/engagement-settings"),
    });
  }

  // ==================== SERVICE PACKAGES ====================

  async listServicePackages(query?: {
    search?: string;
    service?: string[];
    offset?: number;
    limit?: number;
    sortBy?: "Name";
    sortDesc?: boolean;
  }) {
    const response = await this.request<PaginatedResponse<ServicePackage>>({
      method: "GET",
      path: this.tenantPath("/service-packages"),
      query,
    });
    return response.data;
  }

  async getServicePackage(code: string) {
    return this.request<ServicePackage>({
      method: "GET",
      path: this.tenantPath(`/service-packages/${code}`),
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

// ==================== SHARED ENUMS ====================

export type ServiceCategory =
  | "Other"
  | "CoreAccounting"
  | "Tax"
  | "Payroll"
  | "CompanySecretarial"
  | "Advisory"
  | "SoftwareAndTraining";

export type ClientType =
  | "PrivateLimitedCompany"
  | "PublicLimitedCompany"
  | "LimitedLiabilityPartnership"
  | "Partnership"
  | "Individual"
  | "Trust";

export type TemplateType = "Proposal" | "EngagementLetter" | "ProfessionalClearanceLetter";

export type EngagementStatus = "Unsent" | "Sent" | "Viewed" | "Accepted" | "Rejected";
export type EngagementType = "ProposalAndEngagementLetter" | "EngagementLetter";

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
  acceptanceSignature?: string;
  manuallyAccepted?: boolean;
}

export type BillingFrequency = "OneOff" | "Annual" | "Quarterly" | "Monthly";
export type ServiceStatus = "Active" | "Inactive" | "Paused" | "Proposed";

export interface ProposalService {
  code: string;
  billableService?: { code: string; name: string };
  billingFrequency?: BillingFrequency;
  price?: number;
  overridePricing?: boolean;
  priceAdjustmentPercentage?: number;
  calculatedPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: ServiceStatus;
  pricingAnswers?: Record<string, string>;
}

export interface Engagement {
  code: string;
  guid?: string;
  client?: EngagementClient;
  date?: string;
  status?: EngagementStatus;
  type?: EngagementType;
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
  proposalServices?: ProposalService[];
  link?: string;
}

export interface CreateEngagementRequest {
  clientCode: string;
  date: string;
  type: EngagementType;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  proposalTemplateCode?: string;
  lofETemplateCode?: string;
  clientBillableServiceCodes?: string[];
}

export interface UpdateEngagementRequest {
  clientCode: string;
  date: string;
  status?: EngagementStatus;
  type?: EngagementType;
  manuallyAccepted?: boolean;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientEmail?: string;
  proposalTemplateCode?: string;
  lofETemplateCode?: string;
  clientBillableServiceCodes?: string[];
}

export interface EngagementEmail {
  messageId?: string;
  sentDate?: string;
  subject?: string;
  toRecipients?: string[];
  status?: string;
}

// ==================== CLIENT SERVICES ====================

export interface ClientBillableService {
  code?: string;
  billableService?: { code: string; name: string };
  billingFrequency?: BillingFrequency;
  price?: number;
  overridePricing?: boolean;
  priceAdjustmentPercentage?: number;
  calculatedPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: ServiceStatus;
  pricingAnswers?: Record<string, string>;
  createdDate?: string;
}

export interface CreateClientServiceRequest {
  billableServiceCode: string;
  billingFrequency: BillingFrequency;
  startDate: string;
  status: ServiceStatus;
  price?: number;
  overridePricing?: boolean;
  priceAdjustmentPercentage?: number;
  endDate?: string;
  managedByUserCode?: string;
  pricingAnswers?: Record<string, string>;
}

export interface UpdateClientServiceRequest {
  billableServiceCode: string;
  billingFrequency: BillingFrequency;
  startDate: string;
  status: ServiceStatus;
  price?: number;
  overridePricing?: boolean;
  priceAdjustmentPercentage?: number;
  endDate?: string;
  managedByUserCode?: string;
  pricingAnswers?: Record<string, string>;
}

// ==================== SERVICES ====================

export interface PricingFactorOption {
  name?: string;
  value?: number;
}

export interface PricingFactor {
  description?: string;
  options?: PricingFactorOption[];
}

export interface PricingRevenueRangeOverride {
  revenueRangeCode?: string;
  overridePrice?: number;
  overrideDescription?: string;
}

export interface ServicePricingOption {
  frequency?: BillingFrequency;
  price?: number;
  revenueRangeOverrides?: PricingRevenueRangeOverride[];
}

export interface BillableService {
  code?: string;
  name?: string;
  description?: string;
  isArchived?: boolean;
  accountingCode?: string;
  category?: ServiceCategory;
  clientTypes?: ClientType[];
  pricing?: ServicePricingOption[];
  pricingFactors?: PricingFactor[];
  createdDate?: string;
  updatedDate?: string;
}

// ==================== DOCUMENT TEMPLATES ====================

export interface DocumentTemplate {
  code?: string;
  name?: string;
  type?: TemplateType;
  description?: string;
  isActive?: boolean;
  defaultDesignTheme?: { code?: string; name?: string };
  createdDate?: string;
  updatedDate?: string;
}

// ==================== ENGAGEMENT SETTINGS ====================

export interface EngagementSettings {
  code?: string;
  introContentBlock?: { code?: string; name?: string };
  thankYouContentBlock?: { code?: string; name?: string };
  emailContentBlock?: { code?: string; name?: string };
  acceptanceTask?: { code?: string; name?: string };
  notifyClientManagerOnAcceptance?: boolean;
  notifyPartnerOnAcceptance?: boolean;
  designTheme?: { code?: string; name?: string };
  showPracticeName?: boolean;
  attachPDFs?: boolean;
  thankYouEmailContentBlock?: { code?: string; name?: string };
  requestDdMandate?: boolean;
  signaturePageContentBlock?: { code?: string; name?: string };
}

// ==================== SERVICE PACKAGES ====================

export interface ServicePackageItem {
  billableServiceCode?: string;
  billableServiceName?: string;
  billingFrequency?: BillingFrequency;
  overridePricing?: boolean;
  price?: number;
  pricingAnswers?: Record<string, string>;
}

export interface ServicePackage {
  code?: string;
  name?: string;
  description?: string;
  isArchived?: boolean;
  totalAnnualValue?: number;
  numberOfServices?: number;
  items?: ServicePackageItem[];
  createdDate?: string;
  updatedDate?: string;
}

// Export singleton getter
export function getSodiumClient(): SodiumClient {
  return SodiumClient.getInstance();
}
