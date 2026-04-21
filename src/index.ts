import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

interface Env {
  GRAFANA: DurableObjectNamespace;
  CF_API_TOKEN: string;
  GF_SECURITY_ADMIN_PASSWORD: string;
}

export class GrafanaContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "4h";
  envVars = {
    CF_API_TOKEN: env.CF_API_TOKEN,
    GF_SECURITY_ADMIN_PASSWORD: env.GF_SECURITY_ADMIN_PASSWORD,
  };

  override onStart() {
    console.log("Grafana container started");
  }

  override onStop() {
    console.log("Grafana container stopped");
  }

  override onError(error: unknown) {
    console.error("Grafana container error:", error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.GRAFANA, "grafana");
    await container.startAndWaitForPorts();
    return container.fetch(request);
  },
};
