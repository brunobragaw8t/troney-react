import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { mcpHandler } from "./mcp";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({ path: "/api/mcp", method: "POST", handler: mcpHandler });
http.route({ path: "/api/mcp", method: "GET", handler: mcpHandler });
http.route({ path: "/api/mcp", method: "DELETE", handler: mcpHandler });

export default http;
