# MCP Server for Lazy Map API

> Create a Model Context Protocol (MCP) server to expose Lazy Map API endpoints as tools that Claude can discover and invoke.

## Status & Metadata

- **Status**: Planned
- **Priority**: Medium (Developer tooling enhancement)
- **Effort**: 3-5 days
- **Architecture Impact**: New package (standalone MCP server)
- **Owner**: TBD
- **Related**: N/A

## Problem & Goals

### Problem Statement
Currently, Claude cannot directly interact with the Lazy Map API because:
1. **No MCP interface** - API endpoints are not exposed as MCP tools
2. **Manual API calls** - Developers must manually construct HTTP requests
3. **No automatic discovery** - Claude doesn't know what endpoints exist or their parameters
4. **No authentication flow** - No way to handle JWT tokens in MCP context
5. **No type safety** - API responses aren't strongly typed for MCP tools

Creating an MCP server will allow Claude to:
- Discover all available API endpoints automatically
- Understand endpoint parameters, request/response schemas
- Generate tactical maps programmatically
- Manage users and authentication
- Access admin functions (with proper authorization)
- Debug and test the API interactively

### Goals
- Create standalone MCP server that wraps Lazy Map API
- Expose all major endpoints as MCP tools
- Auto-generate tool schemas from Swagger/OpenAPI documentation
- Handle authentication (store JWT tokens in MCP context)
- Support all CRUD operations for maps, users, admin functions
- Provide clear tool descriptions and parameter validation
- Enable Claude to interact with API during development and testing

### Out of Scope
- Modifying the existing API (keep it unchanged)
- Creating a public MCP registry (private development tool)
- Real-time WebSocket support
- File upload/download for map exports (focus on JSON APIs)

## Current State

**Existing API Structure**:

**Backend** (`apps/backend/`):
- Built with NestJS
- Swagger documentation at `/api` (http://localhost:3000/api)
- JWT authentication with Bearer tokens
- RESTful endpoints organized by modules:
  - `/api/auth/*` - Authentication (register, login, OAuth)
  - `/api/maps/*` - Map operations (generate, get, list)
  - `/api/admin/users/*` - Admin operations (manage users)
  - `/api/health` - Health check
  - `/api/benchmark` - Performance benchmarks
  - `/api/features` - Feature flags/info

**Available Controllers**:
1. **AuthController** (`/api/auth`):
   - `POST /register` - Register new user
   - `POST /login` - Login with email/password
   - `POST /google` - Google OAuth sign-in
   - `POST /link-google` - Link Google account
   - `GET /profile` - Get user profile (authenticated)

2. **MapsController** (`/api/maps`):
   - `POST /generate` - Generate tactical map (authenticated)
   - `GET /:id` - Get map by ID (authenticated)
   - `GET /user/:userId` - Get user's maps (authenticated)
   - `POST /validate-seed` - Validate seed string

3. **AdminController** (`/api/admin/users`):
   - `GET /` - List all users (admin only)
   - `PUT /:userId` - Update user (admin only)
   - `POST /:userId/promote` - Promote to admin (admin only)
   - `POST /:userId/suspend` - Suspend user (admin only)
   - `DELETE /:userId` - Delete user (admin only)
   - `GET /stats` - Get user statistics (admin only)

4. **HealthController** (`/api/health`):
   - `GET /` - Health check

5. **BenchmarkController** (`/api/benchmark`):
   - `POST /run` - Run performance benchmark

6. **FeaturesController** (`/api/features`):
   - `GET /` - List available features

**Pain Points**:
- Claude can't discover or invoke these endpoints automatically
- Manual cURL/fetch commands required for testing
- No type-safe interface for API operations
- Authentication tokens must be managed manually

## Proposed Solution

Create a standalone MCP server (TypeScript/Node.js) that wraps the Lazy Map API and exposes each endpoint as an MCP tool.

### Architecture

```
┌─────────────────────────────────────────┐
│         Claude Desktop / VS Code        │
│      (MCP Client - You interact)        │
└─────────────────┬───────────────────────┘
                  │ MCP Protocol (stdio)
                  │
┌─────────────────▼───────────────────────┐
│     Lazy Map MCP Server (TypeScript)    │
│  - Tool registration & discovery        │
│  - Request/response transformation      │
│  - JWT token management                 │
│  - Parameter validation                 │
│  - Error handling                       │
└─────────────────┬───────────────────────┘
                  │ HTTP/REST
                  │
┌─────────────────▼───────────────────────┐
│       Lazy Map API (NestJS Backend)     │
│     http://localhost:3000/api           │
└─────────────────────────────────────────┘
```

### Key Components

**MCP Server Package** (`apps/mcp-server/`):
- Standalone Node.js application
- Uses `@modelcontextprotocol/sdk` for MCP implementation
- Wraps API endpoints as MCP tools
- Manages authentication state
- Validates requests and responses

**Tool Categories**:
1. **Authentication Tools**:
   - `lazymap_auth_register` - Register new user
   - `lazymap_auth_login` - Login and store JWT
   - `lazymap_auth_logout` - Clear stored JWT
   - `lazymap_auth_get_profile` - Get current user profile

2. **Map Generation Tools**:
   - `lazymap_maps_generate` - Generate tactical map
   - `lazymap_maps_get` - Get map by ID
   - `lazymap_maps_list_user` - List user's maps
   - `lazymap_maps_validate_seed` - Validate seed

3. **Admin Tools** (require admin role):
   - `lazymap_admin_list_users` - List all users
   - `lazymap_admin_update_user` - Update user
   - `lazymap_admin_promote_user` - Promote to admin
   - `lazymap_admin_suspend_user` - Suspend user
   - `lazymap_admin_delete_user` - Delete user
   - `lazymap_admin_get_stats` - Get statistics

4. **Utility Tools**:
   - `lazymap_health_check` - Check API health
   - `lazymap_benchmark_run` - Run performance benchmark
   - `lazymap_features_list` - List features

**Configuration**:
```json
{
  "apiBaseUrl": "http://localhost:3000/api",
  "tokenStorage": ".lazymap-mcp-token",
  "timeout": 30000,
  "retries": 3
}
```

## Implementation Plan

### Phase 1: MCP Server Setup (Day 1)

**Objective**: Create basic MCP server structure

**Deliverables**:
- [ ] Create new package `apps/mcp-server/`:
  ```bash
  mkdir -p apps/mcp-server
  cd apps/mcp-server
  pnpm init
  ```

- [ ] Install MCP SDK and dependencies:
  ```json
  {
    "name": "@lazy-map/mcp-server",
    "version": "1.0.0",
    "type": "module",
    "dependencies": {
      "@modelcontextprotocol/sdk": "^0.5.0",
      "axios": "^1.7.9",
      "zod": "^3.23.8"
    },
    "devDependencies": {
      "@types/node": "^22.15.31",
      "typescript": "^5.7.3",
      "tsx": "^4.19.0"
    }
  }
  ```

- [ ] Create basic server structure:
  ```typescript
  // src/index.ts
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
  import { LazyMapApiClient } from './client.js';
  import { registerAuthTools } from './tools/auth.js';
  import { registerMapTools } from './tools/maps.js';
  import { registerAdminTools } from './tools/admin.js';
  
  const server = new Server(
    {
      name: 'lazy-map-api',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  
  const apiClient = new LazyMapApiClient({
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api'
  });
  
  // Register all tools
  registerAuthTools(server, apiClient);
  registerMapTools(server, apiClient);
  registerAdminTools(server, apiClient);
  
  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  ```

- [ ] Create API client wrapper:
  ```typescript
  // src/client.ts
  import axios, { AxiosInstance } from 'axios';
  
  export class LazyMapApiClient {
    private client: AxiosInstance;
    private token: string | null = null;
    
    constructor(config: { baseUrl: string }) {
      this.client = axios.create({
        baseUrl: config.baseUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    setToken(token: string) {
      this.token = token;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    clearToken() {
      this.token = null;
      delete this.client.defaults.headers.common['Authorization'];
    }
    
    async post<T>(endpoint: string, data: any): Promise<T> {
      const response = await this.client.post(endpoint, data);
      return response.data;
    }
    
    async get<T>(endpoint: string, params?: any): Promise<T> {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    }
    
    // ... other HTTP methods
  }
  ```

- [ ] Add to workspace:
  ```json
  // pnpm-workspace.yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```

**Success Criteria**:
- MCP server starts without errors
- Can connect via stdio transport
- Basic structure in place

### Phase 2: Authentication Tools (Day 2)

**Objective**: Implement authentication and token management

**Deliverables**:
- [ ] Create auth tools:
  ```typescript
  // src/tools/auth.ts
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { z } from 'zod';
  import { LazyMapApiClient } from '../client.js';
  
  export function registerAuthTools(server: Server, client: LazyMapApiClient) {
    // Register user
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_auth_register') {
        const schema = z.object({
          email: z.string().email(),
          password: z.string().min(8),
          username: z.string().min(3)
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.post('/auth/register', args);
        
        // Store token for subsequent requests
        if (result.token) {
          client.setToken(result.token);
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Login
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_auth_login') {
        const schema = z.object({
          email: z.string().email(),
          password: z.string()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.post('/auth/login', args);
        
        if (result.token) {
          client.setToken(result.token);
        }
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Get profile
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_auth_get_profile') {
        const result = await client.get('/auth/profile');
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Logout
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_auth_logout') {
        client.clearToken();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, message: 'Logged out' }, null, 2)
          }]
        };
      }
    });
  }
  ```

- [ ] Register tool schemas:
  ```typescript
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'lazymap_auth_register',
          description: 'Register a new user account',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email', description: 'User email' },
              password: { type: 'string', minLength: 8, description: 'User password (min 8 chars)' },
              username: { type: 'string', minLength: 3, description: 'Username (min 3 chars)' }
            },
            required: ['email', 'password', 'username']
          }
        },
        {
          name: 'lazymap_auth_login',
          description: 'Login with email and password. Stores JWT token for subsequent requests.',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' }
            },
            required: ['email', 'password']
          }
        },
        {
          name: 'lazymap_auth_get_profile',
          description: 'Get current user profile (requires authentication)',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'lazymap_auth_logout',
          description: 'Logout and clear stored JWT token',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });
  ```

- [ ] Add token persistence:
  ```typescript
  // src/storage.ts
  import fs from 'fs/promises';
  import path from 'path';
  import os from 'os';
  
  const TOKEN_FILE = path.join(os.homedir(), '.lazymap-mcp-token');
  
  export async function saveToken(token: string): Promise<void> {
    await fs.writeFile(TOKEN_FILE, token, 'utf-8');
  }
  
  export async function loadToken(): Promise<string | null> {
    try {
      return await fs.readFile(TOKEN_FILE, 'utf-8');
    } catch {
      return null;
    }
  }
  
  export async function clearToken(): Promise<void> {
    try {
      await fs.unlink(TOKEN_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
  }
  ```

**Success Criteria**:
- Can register and login via MCP tools
- JWT token is stored and persisted
- Authenticated requests work
- Token survives server restarts

### Phase 3: Map Generation Tools (Day 3)

**Objective**: Implement map generation and retrieval tools

**Deliverables**:
- [ ] Create map tools:
  ```typescript
  // src/tools/maps.ts
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { z } from 'zod';
  import { LazyMapApiClient } from '../client.js';
  
  export function registerMapTools(server: Server, client: LazyMapApiClient) {
    // Generate map
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_maps_generate') {
        const schema = z.object({
          name: z.string().optional(),
          width: z.number().min(10).max(200).optional(),
          height: z.number().min(10).max(200).optional(),
          seed: z.string().optional(),
          biome: z.enum(['forest', 'desert', 'urban', 'arctic']).optional(),
          elevation: z.enum(['lowland', 'highland', 'mountain']).optional(),
          development: z.enum(['wilderness', 'rural', 'suburban', 'urban']).optional()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.post('/maps/generate', args);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              map: {
                id: result.id,
                name: result.name,
                dimensions: result.dimensions,
                context: result.context,
                seed: result.seed,
                layerCount: result.layers?.length || 0,
                generatedAt: result.createdAt
              }
            }, null, 2)
          }]
        };
      }
    });
    
    // Get map
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_maps_get') {
        const schema = z.object({
          mapId: z.string().uuid()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.get(`/maps/${args.mapId}`);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // List user maps
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_maps_list_user') {
        const schema = z.object({
          userId: z.string().uuid(),
          limit: z.number().optional(),
          offset: z.number().optional()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.get(`/maps/user/${args.userId}`, {
          limit: args.limit,
          offset: args.offset
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Validate seed
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_maps_validate_seed') {
        const schema = z.object({
          seed: z.string()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.post('/maps/validate-seed', { seed: args.seed });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
  }
  ```

- [ ] Register map tool schemas:
  ```typescript
  {
    name: 'lazymap_maps_generate',
    description: 'Generate a new tactical battlemap with specified parameters',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Map name (optional)' },
        width: { type: 'number', minimum: 10, maximum: 200, description: 'Map width in tiles (default: 50)' },
        height: { type: 'number', minimum: 10, maximum: 200, description: 'Map height in tiles (default: 50)' },
        seed: { type: 'string', description: 'Random seed for reproducible maps (optional)' },
        biome: { 
          type: 'string', 
          enum: ['forest', 'desert', 'urban', 'arctic'],
          description: 'Environmental biome type (optional)'
        },
        elevation: {
          type: 'string',
          enum: ['lowland', 'highland', 'mountain'],
          description: 'Terrain elevation level (optional)'
        },
        development: {
          type: 'string',
          enum: ['wilderness', 'rural', 'suburban', 'urban'],
          description: 'Civilization development level (optional)'
        }
      }
    }
  }
  ```

**Success Criteria**:
- Can generate maps with various parameters
- Can retrieve maps by ID
- Can list user's maps
- Seed validation works
- Large map data is handled efficiently

### Phase 4: Admin Tools (Day 4)

**Objective**: Implement admin management tools

**Deliverables**:
- [ ] Create admin tools:
  ```typescript
  // src/tools/admin.ts
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';
  import { z } from 'zod';
  import { LazyMapApiClient } from '../client.js';
  
  export function registerAdminTools(server: Server, client: LazyMapApiClient) {
    // List users
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_admin_list_users') {
        const schema = z.object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          role: z.string().optional(),
          status: z.string().optional(),
          searchTerm: z.string().optional()
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.get('/admin/users', args);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Update user
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_admin_update_user') {
        const schema = z.object({
          userId: z.string().uuid(),
          email: z.string().email().optional(),
          username: z.string().optional()
        });
        
        const args = schema.parse(request.params.arguments);
        const { userId, ...updateData } = args;
        
        const result = await client.put(`/admin/users/${userId}`, updateData);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // Promote user
    server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'lazymap_admin_promote_user') {
        const schema = z.object({
          userId: z.string().uuid(),
          role: z.enum(['USER', 'ADMIN'])
        });
        
        const args = schema.parse(request.params.arguments);
        
        const result = await client.post(`/admin/users/${args.userId}/promote`, {
          role: args.role
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    });
    
    // More admin tools...
  }
  ```

- [ ] Add admin authorization check:
  ```typescript
  async function requireAdmin(client: LazyMapApiClient) {
    const profile = await client.get('/auth/profile');
    if (profile.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }
  }
  ```

**Success Criteria**:
- Admin tools work with proper authentication
- Non-admin users get proper error messages
- All CRUD operations for user management work

### Phase 5: Configuration & Documentation (Day 5)

**Objective**: Make MCP server easy to use and configure

**Deliverables**:
- [ ] Create configuration system:
  ```typescript
  // src/config.ts
  import { z } from 'zod';
  
  const ConfigSchema = z.object({
    apiBaseUrl: z.string().url().default('http://localhost:3000/api'),
    tokenStoragePath: z.string().default('.lazymap-mcp-token'),
    timeout: z.number().default(30000),
    retries: z.number().default(3),
    debug: z.boolean().default(false)
  });
  
  export type Config = z.infer<typeof ConfigSchema>;
  
  export function loadConfig(): Config {
    return ConfigSchema.parse({
      apiBaseUrl: process.env.LAZYMAP_API_URL,
      tokenStoragePath: process.env.LAZYMAP_TOKEN_PATH,
      timeout: process.env.LAZYMAP_TIMEOUT ? parseInt(process.env.LAZYMAP_TIMEOUT) : undefined,
      debug: process.env.LAZYMAP_DEBUG === 'true'
    });
  }
  ```

- [ ] Create MCP configuration file for Claude Desktop:
  ```json
  // claude_desktop_config.json (example for users)
  {
    "mcpServers": {
      "lazy-map": {
        "command": "node",
        "args": [
          "/path/to/lazy-map/apps/mcp-server/dist/index.js"
        ],
        "env": {
          "LAZYMAP_API_URL": "http://localhost:3000/api",
          "LAZYMAP_DEBUG": "false"
        }
      }
    }
  }
  ```

- [ ] Create comprehensive README:
  ```markdown
  # Lazy Map MCP Server
  
  Model Context Protocol server for Lazy Map API.
  
  ## Installation
  
  \`\`\`bash
  cd apps/mcp-server
  pnpm install
  pnpm build
  \`\`\`
  
  ## Configuration
  
  ### Claude Desktop
  
  Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
  
  \`\`\`json
  {
    "mcpServers": {
      "lazy-map": {
        "command": "node",
        "args": ["/absolute/path/to/lazy-map/apps/mcp-server/dist/index.js"]
      }
    }
  }
  \`\`\`
  
  ### VS Code with Cline
  
  Add to `.vscode/settings.json`:
  
  \`\`\`json
  {
    "cline.mcpServers": {
      "lazy-map": {
        "command": "node",
        "args": ["./apps/mcp-server/dist/index.js"]
      }
    }
  }
  \`\`\`
  
  ## Available Tools
  
  ### Authentication
  - `lazymap_auth_register` - Register new user
  - `lazymap_auth_login` - Login and store JWT
  - `lazymap_auth_logout` - Clear JWT
  - `lazymap_auth_get_profile` - Get user profile
  
  ### Maps
  - `lazymap_maps_generate` - Generate tactical map
  - `lazymap_maps_get` - Get map by ID
  - `lazymap_maps_list_user` - List user's maps
  - `lazymap_maps_validate_seed` - Validate seed
  
  ### Admin (requires admin role)
  - `lazymap_admin_list_users` - List all users
  - `lazymap_admin_update_user` - Update user
  - `lazymap_admin_promote_user` - Promote to admin
  - `lazymap_admin_suspend_user` - Suspend user
  - `lazymap_admin_delete_user` - Delete user
  - `lazymap_admin_get_stats` - Get statistics
  
  ## Usage Example
  
  1. Start your Lazy Map backend:
     \`\`\`bash
     pnpm dev:backend
     \`\`\`
  
  2. In Claude, ask:
     "Use lazymap_auth_register to create a new account with email test@example.com"
  
  3. Generate a map:
     "Use lazymap_maps_generate to create a 50x50 forest map with seed 'adventure123'"
  
  ## Development
  
  \`\`\`bash
  # Run in dev mode
  pnpm dev
  
  # Build
  pnpm build
  
  # Test
  pnpm test
  \`\`\`
  
  ## Environment Variables
  
  - `LAZYMAP_API_URL` - API base URL (default: http://localhost:3000/api)
  - `LAZYMAP_TOKEN_PATH` - Token storage path (default: ~/.lazymap-mcp-token)
  - `LAZYMAP_TIMEOUT` - Request timeout in ms (default: 30000)
  - `LAZYMAP_DEBUG` - Enable debug logging (default: false)
  ```

- [ ] Add to root README:
  ```markdown
  ## MCP Server
  
  Lazy Map includes an MCP (Model Context Protocol) server that allows AI assistants like Claude to interact with the API.
  
  See [apps/mcp-server/README.md](apps/mcp-server/README.md) for setup instructions.
  ```

- [ ] Create testing script:
  ```typescript
  // test/mcp-integration.test.ts
  import { describe, it, expect } from 'vitest';
  import { LazyMapApiClient } from '../src/client';
  
  describe('MCP Server Integration', () => {
    it('should register and login', async () => {
      // Test implementation
    });
    
    it('should generate a map', async () => {
      // Test implementation
    });
  });
  ```

**Success Criteria**:
- MCP server is configurable via environment variables
- Documentation is complete and clear
- Example configurations work for Claude Desktop and VS Code
- All tools are documented with examples

## Top Risks

1. **API Changes Breaking MCP Tools - MEDIUM**: Backend API changes could break MCP server
   - **Mitigation**: Version MCP server with API, auto-generate schemas from OpenAPI/Swagger, add integration tests

2. **Token Security - MEDIUM**: JWT tokens stored in plain text file
   - **Mitigation**: Use OS keychain in future version, document security implications, file permissions set to 600

3. **Rate Limiting - LOW**: Many MCP requests could hit rate limits
   - **Mitigation**: Add request throttling in MCP server, implement caching for read operations

4. **Large Response Payloads - LOW**: Map data can be large (50x50+ grids)
   - **Mitigation**: Truncate large responses, add pagination support, summarize instead of returning full data

5. **Authentication Expiry - LOW**: JWT tokens expire after 7 days
   - **Mitigation**: Handle 401 errors gracefully, prompt for re-authentication, add token refresh logic

## Success Criteria

**Functional**:
- [ ] All API endpoints exposed as MCP tools
- [ ] Authentication works and persists
- [ ] Can generate maps from Claude/VS Code
- [ ] Admin tools work with proper authorization
- [ ] Error handling is robust
- [ ] Tool discovery works automatically

**Non-Functional**:
- [ ] MCP server starts in < 2 seconds
- [ ] Tool invocations complete in < 5 seconds (map generation may take longer)
- [ ] Documentation is complete
- [ ] Works with Claude Desktop and VS Code
- [ ] Configuration is straightforward

## Notes

### MCP Protocol Basics

MCP (Model Context Protocol) is a standard for AI assistants to interact with external tools. Key concepts:

- **Tools**: Functions that Claude can call
- **Resources**: Data that Claude can read
- **Prompts**: Pre-configured prompts
- **Stdio Transport**: Communication over stdin/stdout

### Tool Naming Convention

- Prefix: `lazymap_` (identifies our tools)
- Category: `auth_`, `maps_`, `admin_` (groups related tools)
- Action: `generate`, `get`, `list`, etc. (describes operation)

Examples:
- `lazymap_auth_login`
- `lazymap_maps_generate`
- `lazymap_admin_list_users`

### OpenAPI Integration (Future Enhancement)

Could auto-generate MCP tools from Swagger documentation:

```typescript
// Future: Auto-generate tools from OpenAPI spec
import { generateMcpTools } from './openapi-generator';

const swaggerJson = await fetch('http://localhost:3000/api-json').then(r => r.json());
const tools = generateMcpTools(swaggerJson);
```

### Example Claude Interactions

Once MCP server is configured, Claude can:

```
User: "Create a test account for me"
Claude: *uses lazymap_auth_register*

User: "Generate a 100x100 urban map with high elevation"
Claude: *uses lazymap_maps_generate with parameters*

User: "Show me my last 5 maps"
Claude: *uses lazymap_maps_list_user*

User: "As admin, list all users"
Claude: *uses lazymap_admin_list_users*
```

### References

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

### Future Enhancements (Out of Scope)

- Auto-generate tools from OpenAPI/Swagger spec
- WebSocket support for real-time updates
- Map export to PNG/PDF via MCP
- Batch operations (generate multiple maps)
- Map templates and presets
- Collaborative editing support
- OAuth flow via MCP (currently only email/password)
