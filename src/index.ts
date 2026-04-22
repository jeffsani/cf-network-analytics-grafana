import { Container, getContainer } from "@cloudflare/containers";
import { env } from "cloudflare:workers";

interface Env {
  GRAFANA: DurableObjectNamespace;
  CF_API_TOKEN: string;
}

export class GrafanaContainer extends Container {
  defaultPort = 3000;
  sleepAfter = "4h";
  envVars = {
    CF_API_TOKEN: env.CF_API_TOKEN,
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

const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|eot|svg|png|ico|map)(\?|$)/;
const STATIC_TTL = 60 * 60 * 24; // 24 hours

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Redirect bare root to the dashboard in kiosk mode
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(
        `${url.origin}/d/cf-network-analytics?kiosk`,
        302
      );
    }

    const isStatic = STATIC_EXTENSIONS.test(url.pathname);

    // Serve cacheable static assets from edge cache when possible
    if (isStatic && request.method === "GET") {
      const cache = caches.default;
      const cached = await cache.match(request);
      if (cached) return cached;

      const container = getContainer(env.GRAFANA, "grafana");
      await container.startAndWaitForPorts();
      const response = await container.fetch(request);

      if (response.ok) {
        const cacheable = new Response(response.body, response);
        cacheable.headers.set(
          "Cache-Control",
          `public, max-age=${STATIC_TTL}`
        );
        ctx.waitUntil(cache.put(request, cacheable.clone()));
        return cacheable;
      }
      return response;
    }

    const container = getContainer(env.GRAFANA, "grafana");
    await container.startAndWaitForPorts();
    return container.fetch(request);
  },
};
