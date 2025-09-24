import { useState, useEffect, useCallback } from 'react';
import { configurationsApi } from '../services/api';
import { Configuration, ConfigurationValue } from '../types';

export const useConfigurations = () => {
  const [configurations, setConfigurations] = useState<Record<string, Configuration>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configs = await configurationsApi.getAll();
      const configMap = Array.isArray(configs) 
        ? configs.reduce((acc, config) => {
            acc[config.key] = config;
            return acc;
          }, {} as Record<string, Configuration>)
        : {};
      setConfigurations(configMap);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load configurations');
      console.error('Failed to load configurations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getConfigValues = useCallback((key: string): ConfigurationValue[] => {
    const config = configurations[key];
    return config?.values?.filter(v => v.isActive) || [];
  }, [configurations]);

  const getConfigLabels = useCallback((key: string): Array<{ value: string; label: string }> => {
    return getConfigValues(key).map(v => ({ value: v.value, label: v.label }));
  }, [getConfigValues]);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  return {
    configurations,
    loading,
    error,
    fetchConfigurations,
    getConfigValues,
    getConfigLabels
  };
};

export const useConfiguration = (key: string) => {
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguration = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await configurationsApi.getByKey(key);
      setConfiguration(config);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to load configuration: ${key}`);
      console.error(`Failed to load configuration ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const getValues = useCallback((): ConfigurationValue[] => {
    return configuration?.values?.filter(v => v.isActive) || [];
  }, [configuration]);

  const getLabels = useCallback((): Array<{ value: string; label: string }> => {
    return getValues().map(v => ({ value: v.value, label: v.label }));
  }, [getValues]);

  useEffect(() => {
    fetchConfiguration();
  }, [fetchConfiguration]);

  return {
    configuration,
    loading,
    error,
    fetchConfiguration,
    getValues,
    getLabels
  };
};