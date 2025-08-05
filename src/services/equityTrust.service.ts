// services/equityTrust.service.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface EquityTrustConfig {
  subscriptionKey: string;
  clientId: string;
  clientSecret: string;
  resource: string;
  baseUrl: string;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AccountOpenRequest {
  requests: Array<{
    owner: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      ssn: string;
      married?: boolean;
      minor?: boolean;
      addresses: Array<{
        addressType: string;
        addressLine1: string;
        addressLine2?: string;
        addressLine3?: string;
        city: string;
        state: string;
        zipCode: string;
        primary: boolean;
      }>;
      phones: Array<{
        phoneType: string;
        phoneNumber: string;
        primary: boolean;
      }>;
      emailAddresses: Array<{
        email: string;
      }>;
    };
    preciousMetals: {
      segregated: boolean
    }
    goldLevelService: boolean;
    eSignature: boolean;
    accountType: string;
    beneficiaries?: Array<{
      firstName: string;
      lastName: string;
      percentage: number;
      dateOfBirth?: string;
      beneficiaryType: string;
      spouse: boolean;
    }>;
    fees: {
      currentFeePaymentMethod: string;
      futureFeePaymentMethod?: string;
    };
    funding: {
      fundingAmount: number;
      fundingMethod: string;
      contributionYear?: number;
    };
    statementPreference: string;
    investmentTypes: {
      Alternative?: boolean;
      Digital?: boolean;
      Metals?: boolean;
      Traditional?: boolean;
    };
    customerDueDiligence?: {
      accountPurpose: string;
      initialFundSource: {
        retirementFunds?: boolean;
        transfer?: boolean;
        rollover?: boolean;
        employmentWages?: boolean;
        investments?: boolean;
        inheritanceTrust?: boolean;
        other?: boolean;
      };
      identificationType: string;
      stateOfIssuance: string;
      idNumber: string;
      issueDate: string;
      expirationDate: string;
      initialFundSourceOtherDetails?: string;
      ongoingFundSource: {
        retirementFunds?: boolean;
        transfer?: boolean;
        rollover?: boolean;
        employmentWages?: boolean;
        investments?: boolean;
        inheritanceTrust?: boolean;
        other?: boolean;
      };
      ongoingFundSourceOtherDetails?: string;
      employmentStatus: string;
      employerName?: string;
      occupationCategory?: string;
      occupation?: string;
      employerAddress: {
        addressLine1: string;
        city: string;
        state: string;
        zipCode: string;
      }
    };
  }>;
}

interface AccountOpenResponse {
  response: Array<{
    accountNumber: string;
    activityId: string;
  }>;
}

interface DirectTradeRequest {
  requests: Array<{
    accountNumber: string;
    transactionType: string;
    investmentName: string;
    investmentAmount: number;
    investmentDescription?: string;
    payeeDetails?: {
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
    };
  }>;
}

interface DirectTradeResponse {
  response: Array<{
    activityId: string;
    status: string;
  }>;
}

interface ActivityResponse {
  response: Array<{
    activityId: string;
    accountNumber: string;
    status: string;
    activityType: string;
    submissionDate: string;
    lastUpdated: string;
  }>;
}

class EquityTrustService {
  private config: EquityTrustConfig;
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: EquityTrustConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Ocp-Apim-Subscription-Key': config.subscriptionKey,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to automatically include bearer token
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.ensureValidToken();
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, refresh and retry
          this.accessToken = null;
          this.tokenExpiry = null;
          await this.ensureValidToken();
          
          // Retry the original request
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
          return this.axiosInstance.request(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response: AxiosResponse<OAuthTokenResponse> = await axios.post(
        `${this.config.baseUrl}/oauth/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          resource: this.config.resource,
        }),
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.subscriptionKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw new Error('Failed to authenticate with Equity Trust API');
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || new Date() >= this.tokenExpiry) {
      await this.getAccessToken();
    }
  }

  async openAccount(request: AccountOpenRequest, apiVersion?: string): Promise<AccountOpenResponse> {
    try {
      const url = apiVersion ? `/accountopen/initialize?apiVersion=${apiVersion}` : '/accountopen/initialize';
      const response: AxiosResponse<AccountOpenResponse> = await this.axiosInstance.post(url, request);
      return response.data;
    } catch (error) {
      console.error('Error opening account:', error);
      throw this.handleApiError(error);
    }
  }

  async submitDirectTrade(request: DirectTradeRequest): Promise<DirectTradeResponse> {
    try {
      const response: AxiosResponse<DirectTradeResponse> = await this.axiosInstance.post(
        '/directtrade/submit',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting direct trade:', error);
      throw this.handleApiError(error);
    }
  }

  async getActivities(params: {
    accountNumber?: string;
    activityId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ActivityResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response: AxiosResponse<ActivityResponse> = await this.axiosInstance.get(
        `/activities?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting activities:', error);
      throw this.handleApiError(error);
    }
  }

  async getAccounts(accountNumber?: string): Promise<any> {
    try {
      const params = accountNumber ? { accountNumber: accountNumber } : {};
      const response = await this.axiosInstance.get(`/accounts/search?accountNumber=${accountNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error getting accounts:', error);
      throw this.handleApiError(error);
    }
  }

  async getAssets(accountNumber: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/assets', {
        params: { accountNumber }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting assets:', error);
      throw this.handleApiError(error);
    }
  }

  async getTransactions(accountNumber: string, fromDate?: string, toDate?: string): Promise<any> {
    try {
      const params: any = { accountNumber };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await this.axiosInstance.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw this.handleApiError(error);
    }
  }

  private handleApiError(error: any): Error {
    if (error.response?.data) {
      const apiError = error.response.data;
      if (apiError.errors && Array.isArray(apiError.errors)) {
        const errorMessages = apiError.errors.map((err: any) => err.message).join(', ');
        return new Error(`Equity Trust API Error: ${errorMessages}`);
      }
      if (apiError.message) {
        return new Error(`Equity Trust API Error: ${apiError.message}`);
      }
    }
    
    if (error.message) {
      return new Error(`Equity Trust API Error: ${error.message}`);
    }
    
    return new Error('Unknown Equity Trust API Error');
  }
}

export { EquityTrustService, type AccountOpenRequest, type DirectTradeRequest, type ActivityResponse };