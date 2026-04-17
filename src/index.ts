import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  GRAFANA: DurableObjectNamespace;
  CF_API_TOKEN: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
}

export class GrafanaContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "30m";

  override get envVars(): Record<string, string> {
    return {
      CF_API_TOKEN: (this.env as Env).CF_API_TOKEN,
      GF_SECURITY_ADMIN_PASSWORD: (this.env as Env).GF_SECURITY_ADMIN_PASSWORD,
    };
  }

  override onStart(): void {
    console.log("Grafana container started");
  }

  override onStop(): void {
    console.log("Grafana container stopped");
  }

  override onError(error: unknown): void {
    console.error("Grafana container error:", error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.GRAFANA, "grafana");
    return container.fetch(request);
  },
};
