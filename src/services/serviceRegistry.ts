import { ServiceConfig } from '../types';

export const serviceRegistry: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth',
    baseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    timeout: 30000,
    retries: 3,
    healthCheck: '/health'
  },
  transcriber: {
    name: 'transcriber',
    baseUrl: process.env.TRANSCRIBER_SERVICE_URL || 'http://localhost:3002',
    timeout: 60000,
    retries: 2,
    healthCheck: '/health'
  },
  compliance: {
    name: 'compliance',
    baseUrl: process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3003',
    timeout: 45000,
    retries: 3,
    healthCheck: '/health'
  }
};

export const getServiceConfig = (serviceName: string): ServiceConfig | null => {
  return serviceRegistry[serviceName] || null;
};

export const getAllServices = (): ServiceConfig[] => {
  return Object.values(serviceRegistry);
};

export const isServiceRegistered = (serviceName: string): boolean => {
  return serviceName in serviceRegistry;
};
