let config: { apiKey?: string; model?: string } = {};

export function setRuntimeConfig(v: { apiKey?: string; model?: string }) {
  config = { ...config, ...v };
}

export function getRuntimeConfig() {
  return config;
}


