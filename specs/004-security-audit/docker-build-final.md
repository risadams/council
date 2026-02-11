 Container clarity-council-mcp Stopping 
 Container clarity-council-mcp Stopped 
 Container clarity-council-mcp Removing 
 Container clarity-council-mcp Removed 
 Network risadams_default Removing 
 Network risadams_default Removed 
 Image risadams/clarity-council:1.0.0 Building 
#1 [internal] load local bake definitions
#1 reading from stdin 519B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 1.82kB done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:25-bookworm-slim
#3 DONE 0.0s

#4 [internal] load .dockerignore
#4 transferring context: 189B done
#4 DONE 0.0s

#5 [builder 1/8] FROM docker.io/library/node:25-bookworm-slim
#5 DONE 0.0s

#6 [internal] load build context
#6 transferring context: 3.24kB 0.1s done
#6 DONE 0.1s

#7 [stage-1  9/11] COPY server/healthcheck.js ./healthcheck.js
#7 CACHED

#8 [builder 7/8] COPY server/scripts ./scripts
#8 CACHED

#9 [stage-1  5/11] COPY server/scripts ./scripts
#9 CACHED

#10 [builder 5/8] COPY server/src ./src
#10 CACHED

#11 [stage-1  8/11] COPY --from=builder /app/dist/schemas ./dist/schemas
#11 CACHED

#12 [builder 2/8] WORKDIR /app
#12 CACHED

#13 [builder 4/8] RUN npm ci
#13 CACHED

#14 [builder 8/8] RUN npm run build
#14 CACHED

#15 [stage-1  4/11] COPY server/package*.json ./
#15 CACHED

#16 [stage-1  7/11] COPY --from=builder /app/dist ./dist
#16 CACHED

#17 [builder 3/8] COPY server/package*.json ./
#17 CACHED

#18 [stage-1  6/11] RUN npm ci --omit=dev
#18 CACHED

#19 [stage-1  3/11] RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
#19 CACHED

#20 [builder 6/8] COPY server/tsconfig.json ./
#20 CACHED

#21 [stage-1 10/11] RUN mkdir -p /app/certs
#21 CACHED

#22 [stage-1 11/11] RUN openssl req -x509 -newkey rsa:2048 -keyout /app/certs/key.pem -out /app/certs/cert.pem     -days 365 -nodes -subj "/CN=localhost"
#22 CACHED

#23 exporting to image
#23 exporting layers done
#23 writing image sha256:b0242375a74ccb52543d1dd0cfc2047142938fe312923bc19cd711395579f94a done
#23 naming to docker.io/risadams/clarity-council:1.0.0 done
#23 DONE 0.0s

#24 resolving provenance for metadata file
#24 DONE 0.0s
 Image risadams/clarity-council:1.0.0 Built 
 Network risadams_default Creating 
 Network risadams_default Created 
 Container clarity-council-mcp Creating 
 Container clarity-council-mcp Created 
 Container clarity-council-mcp Starting 
 Container clarity-council-mcp Started 
copied server "clarity-council" from catalog "A:\council\servers\clarity-council\server.yaml" to "risadams"
Tip: Γ£ô Server enabled. To view all enabled servers, use docker mcp server ls

=== Project-wide MCP Configurations (A:\council) ===
 [31mΓùÅ[0m claude-code: disconnected
 [31mΓùÅ[0m cursor: no mcp configured
 [31mΓùÅ[0m kiro: no mcp configured
 [32mΓùÅ[0m vscode: connected
   MCP_DOCKER: Docker MCP Catalog (gateway server) (stdio)
You might have to restart 'vscode'.
Tip: Your client is now connected! Use docker mcp tools ls to see your available tools

