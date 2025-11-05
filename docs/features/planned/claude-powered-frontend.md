# Claude-Powered Map Generation Frontend

> Enable users to generate tactical maps via natural language input in the frontend, powered by Claude AI.

## Status & Metadata

- **Status**: Planned (Concept)
- **Priority**: Low (Enhancement - nice-to-have)
- **Effort**: 2-3 weeks
- **Architecture Impact**: Frontend + Backend (new proxy endpoint)
- **Owner**: TBD
- **Related**: `mcp-server-for-api.md` (different use case)

## Problem & Goals

### Problem Statement

The current MCP server (`mcp-server-for-api.md`) enables **DEVELOPERS** to interact with the API through Claude Desktop/VS Code. However, **END USERS** in the frontend have no way to generate maps using natural language.

**Current User Experience**:
```
User must:
1. Understand API parameters (biome, elevation, development)
2. Fill out complex form with technical terms
3. Know what "foothills" or "settled" means
4. Manually configure seed, dimensions, context
```

**Desired User Experience**:
```
User types: "Create a cottage surrounded by fields in Italian Tuscany"

Claude interprets:
- Location: Tuscany, Italy → plains biome, lowland elevation
- Feature: Cottage → rural development, single building
- Context: Fields → agricultural, open terrain
- Style: Italian → Mediterranean climate, stone construction

Generates appropriate map automatically.
```

### Key Difference from MCP Server

| Aspect | MCP Server (Existing Plan) | Claude-Powered Frontend (This Doc) |
|--------|----------------------------|-------------------------------------|
| **User** | Developers | End users (players, GMs) |
| **Interface** | Claude Desktop / VS Code | Web browser |
| **Transport** | stdio (local process) | HTTP/REST (web) |
| **Authentication** | MCP tool calls | User session + API key |
| **Architecture** | Claude ↔ MCP Server ↔ API | Frontend ↔ Backend ↔ Claude API ↔ API |
| **Purpose** | Dev/testing tool | Production feature |
| **API Key** | Not needed (local) | Required (Anthropic API) |

### Goals

**Phase 1**: Natural language map generation
- User types description in frontend chat/input
- Frontend sends to backend proxy
- Backend calls Claude API with Lazy Map tools
- Claude interprets and generates map parameters
- Map generated and returned to user

**Phase 2**: Conversational refinement
- User: "Make it more forested"
- Claude: Adjusts biome/vegetation
- User: "Add a river"
- Claude: Enables hydrology features

**Phase 3**: Context-aware suggestions
- Claude suggests map types based on campaign
- "For a bandit ambush, try dense forest with elevation"
- "For naval combat, use coastal with river"

### Out of Scope

- Real-time collaboration (multiple users editing)
- Image generation (map visualization from AI)
- Campaign management integration
- Voice input (text only initially)
- Fine-grained tile editing via AI

## Architecture

### Option 1: Backend Proxy (Recommended)

```
┌────────────────────────────────────┐
│   Frontend (React)                 │
│   - Chat input component           │
│   - "Describe your map..."         │
└────────────┬───────────────────────┘
             │ POST /api/maps/generate-from-prompt
             │ { prompt: "cottage in Tuscany" }
             ▼
┌────────────────────────────────────┐
│   Backend Proxy Endpoint (NestJS)  │
│   - Validates user session         │
│   - Rate limiting per user         │
│   - Anthropic API key (server-side)│
└────────────┬───────────────────────┘
             │ HTTP POST (Anthropic API)
             │ + Lazy Map tool definitions
             ▼
┌────────────────────────────────────┐
│   Claude API (Anthropic)           │
│   - Interprets natural language    │
│   - Calls tool: lazymap_generate   │
│   - Returns structured parameters  │
└────────────┬───────────────────────┘
             │ Tool call result
             ▼
┌────────────────────────────────────┐
│   Backend (NestJS)                 │
│   - Executes map generation        │
│   - Returns map data to frontend   │
└────────────────────────────────────┘
```

**Pros**:
- ✅ API key hidden from frontend (secure)
- ✅ Rate limiting per user
- ✅ Can log/monitor AI usage
- ✅ Works with existing authentication

**Cons**:
- ❌ Requires backend changes
- ❌ Latency (extra hop)
- ❌ API costs borne by application

### Option 2: Client-Side SDK (Not Recommended)

```
Frontend → Claude API (with user's API key) → Frontend → Backend API
```

**Pros**:
- ✅ Direct communication (lower latency)
- ✅ User pays for their own API usage

**Cons**:
- ❌ Users must provide Anthropic API key
- ❌ Security risk (key in browser)
- ❌ Rate limiting harder to enforce
- ❌ Poor UX (asking users for API keys)

## Implementation Plan (Option 1 - Backend Proxy)

### Phase 1: Backend Proxy Endpoint (Week 1)

**Deliverables**:

1. **New Controller**: `MapsAiController` (`apps/backend/src/maps-ai.controller.ts`)
   ```typescript
   import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
   import { JwtAuthGuard } from '../auth/jwt-auth.guard';
   import { ClaudeProxyService } from './claude-proxy.service';
   
   @Controller('api/maps/ai')
   @UseGuards(JwtAuthGuard)
   export class MapsAiController {
     constructor(
       private readonly claudeService: ClaudeProxyService,
       private readonly mapGenerationService: GenerateTacticalMapUseCase
     ) {}
     
     @Post('generate-from-prompt')
     async generateFromPrompt(
       @Body() dto: { prompt: string },
       @Request() req: any
     ) {
       // 1. Call Claude API with prompt + tools
       const interpretation = await this.claudeService.interpretPrompt(dto.prompt);
       
       // 2. Extract map parameters from Claude's tool call
       const params = interpretation.toolCalls[0].input;
       
       // 3. Generate map using existing use case
       const map = await this.mapGenerationService.execute(
         params.width,
         params.height,
         params.context,
         params.seed
       );
       
       return {
         success: true,
         interpretation: interpretation.reasoning, // What Claude understood
         map: map
       };
     }
   }
   ```

2. **Claude Proxy Service**: `ClaudeProxyService` (`apps/backend/src/claude-proxy.service.ts`)
   ```typescript
   import Anthropic from '@anthropic-ai/sdk';
   
   export class ClaudeProxyService {
     private client: Anthropic;
     
     constructor() {
       this.client = new Anthropic({
         apiKey: process.env.ANTHROPIC_API_KEY
       });
     }
     
     async interpretPrompt(prompt: string) {
       const response = await this.client.messages.create({
         model: 'claude-3-5-sonnet-20241022',
         max_tokens: 1024,
         tools: [
           {
             name: 'generate_tactical_map',
             description: 'Generate a tactical battlemap for tabletop RPGs based on description',
             input_schema: {
               type: 'object',
               properties: {
                 name: { type: 'string', description: 'Descriptive map name' },
                 width: { type: 'number', description: 'Map width (10-200)', minimum: 10, maximum: 200 },
                 height: { type: 'number', description: 'Map height (10-200)', minimum: 10, maximum: 200 },
                 biome: {
                   type: 'string',
                   enum: ['forest', 'plains', 'mountain', 'desert', 'swamp', 'coastal', 'underground'],
                   description: 'Primary terrain type'
                 },
                 elevation: {
                   type: 'string',
                   enum: ['lowland', 'foothills', 'highland', 'alpine'],
                   description: 'Elevation zone'
                 },
                 hydrology: {
                   type: 'string',
                   enum: ['arid', 'seasonal', 'stream', 'river', 'lake', 'coastal', 'wetland'],
                   description: 'Water features'
                 },
                 development: {
                   type: 'string',
                   enum: ['wilderness', 'frontier', 'rural', 'settled', 'urban', 'ruins'],
                   description: 'Human development level'
                 },
                 season: {
                   type: 'string',
                   enum: ['spring', 'summer', 'autumn', 'winter'],
                   description: 'Time of year'
                 },
                 seed: { type: 'string', description: 'Optional seed for reproducibility' }
               },
               required: ['width', 'height', 'biome']
             }
           }
         ],
         messages: [
           {
             role: 'user',
             content: `Based on this description, generate parameters for a tactical battlemap: "${prompt}"
             
             Consider:
             - Geographic location → biome, elevation, climate
             - Features mentioned → development level, structures
             - Context clues → season, water features
             - Scale → appropriate dimensions
             
             Use the generate_tactical_map tool to provide parameters.`
           }
         ]
       });
       
       return {
         reasoning: response.content[0].text, // Claude's interpretation
         toolCalls: response.content.filter(c => c.type === 'tool_use')
       };
     }
   }
   ```

3. **Rate Limiting**: Add to `ClaudeProxyService`
   ```typescript
   import { Cache } from '@nestjs/cache-manager';
   import { Injectable } from '@nestjs/common';
   
   @Injectable()
   export class ClaudeProxyService {
     constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
     
     async checkRateLimit(userId: string): Promise<boolean> {
       const key = `claude_rate_limit_${userId}`;
       const current = await this.cacheManager.get<number>(key) || 0;
       
       if (current >= 10) { // 10 requests per hour
         throw new Error('Rate limit exceeded. Try again later.');
       }
       
       await this.cacheManager.set(key, current + 1, 3600); // 1 hour TTL
       return true;
     }
   }
   ```

4. **Environment Variables**: Add to `.env`
   ```bash
   ANTHROPIC_API_KEY=sk-ant-xxx
   CLAUDE_MODEL=claude-3-5-sonnet-20241022
   CLAUDE_MAX_TOKENS=1024
   CLAUDE_RATE_LIMIT_PER_HOUR=10
   ```

**Success Criteria**:
- Backend can call Claude API
- Natural language prompt converts to map parameters
- Rate limiting prevents abuse
- Error handling for invalid prompts

### Phase 2: Frontend Chat Component (Week 2)

**Deliverables**:

1. **Chat Input Component**: `MapPromptInput.tsx`
   ```typescript
   import { useState } from 'react';
   import { Button, TextArea, Card } from './ui';
   
   export function MapPromptInput({ onGenerate }: { onGenerate: (map: any) => void }) {
     const [prompt, setPrompt] = useState('');
     const [loading, setLoading] = useState(false);
     const [interpretation, setInterpretation] = useState('');
     
     const handleSubmit = async () => {
       setLoading(true);
       try {
         const response = await fetch('/api/maps/ai/generate-from-prompt', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({ prompt })
         });
         
         const result = await response.json();
         setInterpretation(result.interpretation);
         onGenerate(result.map);
       } catch (error) {
         console.error('Failed to generate map:', error);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <Card>
         <h3>Describe Your Map</h3>
         <TextArea
           placeholder="e.g., A cottage surrounded by fields in Italian Tuscany..."
           value={prompt}
           onChange={(e) => setPrompt(e.target.value)}
           rows={4}
         />
         <Button onClick={handleSubmit} disabled={loading || !prompt}>
           {loading ? 'Generating...' : 'Generate Map'}
         </Button>
         
         {interpretation && (
           <div className="interpretation">
             <strong>Claude's Interpretation:</strong>
             <p>{interpretation}</p>
           </div>
         )}
       </Card>
     );
   }
   ```

2. **Example Prompts**: Add suggestions
   ```typescript
   const examplePrompts = [
     "Forest clearing with a small stream, perfect for an ambush",
     "Abandoned castle ruins on a hilltop, overgrown with vegetation",
     "Coastal fishing village with a wooden pier and boats",
     "Desert oasis with palm trees and rocky outcrops",
     "Underground cavern system with stalactites and pools",
     "Mountain pass with narrow paths and steep cliffs",
     "Swamp with murky water, dead trees, and fog",
     "Tuscan countryside with a cottage and olive groves"
   ];
   ```

3. **Conversation History** (Optional - Phase 3):
   ```typescript
   const [messages, setMessages] = useState<Message[]>([]);
   
   // User: "Create a forest map"
   // Assistant: "Generated 50x50 forest map"
   // User: "Make it more dense"
   // Assistant: "Adjusted vegetation density to 0.9"
   ```

**Success Criteria**:
- Users can describe maps in natural language
- Frontend shows Claude's interpretation
- Generated map displays correctly
- Error messages are user-friendly

### Phase 3: Cost Management & Monitoring (Week 3)

**Deliverables**:

1. **Usage Tracking**: Log AI requests
   ```typescript
   @Injectable()
   export class ClaudeUsageService {
     async logRequest(userId: string, prompt: string, tokens: number, cost: number) {
       await this.db.claudeUsage.create({
         data: {
           userId,
           prompt: prompt.substring(0, 500), // Truncate for privacy
           tokensUsed: tokens,
           estimatedCost: cost,
           timestamp: new Date()
         }
       });
     }
     
     async getUserMonthlyUsage(userId: string): Promise<number> {
       const startOfMonth = new Date();
       startOfMonth.setDate(1);
       startOfMonth.setHours(0, 0, 0, 0);
       
       const usage = await this.db.claudeUsage.aggregate({
         where: {
           userId,
           timestamp: { gte: startOfMonth }
         },
         _sum: { estimatedCost: true }
       });
       
       return usage._sum.estimatedCost || 0;
     }
   }
   ```

2. **Cost Estimation**:
   ```typescript
   // Claude 3.5 Sonnet pricing (as of Nov 2024)
   const COST_PER_1K_INPUT_TOKENS = 0.003;
   const COST_PER_1K_OUTPUT_TOKENS = 0.015;
   
   function estimateCost(inputTokens: number, outputTokens: number): number {
     const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT_TOKENS;
     const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT_TOKENS;
     return inputCost + outputCost;
   }
   ```

3. **Budget Limits**: Per-user limits
   ```typescript
   const FREE_TIER_MONTHLY_LIMIT = 1.00; // $1/month for free users
   const PREMIUM_TIER_MONTHLY_LIMIT = 10.00; // $10/month for premium
   
   async checkBudget(userId: string): Promise<boolean> {
     const usage = await this.getUserMonthlyUsage(userId);
     const user = await this.getUser(userId);
     const limit = user.isPremium ? PREMIUM_TIER_MONTHLY_LIMIT : FREE_TIER_MONTHLY_LIMIT;
     
     if (usage >= limit) {
       throw new Error('Monthly AI budget limit reached. Upgrade to premium or wait for next month.');
     }
     
     return true;
   }
   ```

4. **Admin Dashboard**: Monitor costs
   ```typescript
   @Get('admin/claude-usage')
   @UseGuards(AdminGuard)
   async getClaudeUsageStats() {
     return {
       totalRequests: await this.countRequests(),
       totalCost: await this.getTotalCost(),
       avgCostPerRequest: await this.getAvgCost(),
       topUsers: await this.getTopUsers(10)
     };
   }
   ```

**Success Criteria**:
- All AI requests logged with costs
- Users have monthly budget limits
- Admin can monitor total spend
- Clear error messages when limits reached

## Cost Analysis

### Claude API Costs (Nov 2024)

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

### Estimated Usage

**Typical Prompt**:
```
User: "Create a cottage surrounded by fields in Italian Tuscany"

Input tokens: ~300 (prompt + tool definition)
Output tokens: ~150 (interpretation + tool call)

Cost per request: 
  ($0.003 * 0.3) + ($0.015 * 0.15) = $0.0009 + $0.00225 = ~$0.003 per generation
```

**Monthly Costs**:
- 100 users × 10 maps/month = 1,000 generations
- 1,000 × $0.003 = **$3/month**

**With Growth**:
- 1,000 users × 10 maps/month = 10,000 generations
- 10,000 × $0.003 = **$30/month**

**Mitigation**:
- Use Claude 3 Haiku for simpler prompts ($0.0004/request = 87% cheaper)
- Cache common interpretations
- Rate limit to 10 requests/user/month (free tier)
- Premium tier: 50 requests/user/month for $5/month

## Alternative: MCP-over-HTTP (Advanced)

Instead of direct Claude API integration, expose MCP server over HTTP:

```
Frontend → Backend MCP-over-HTTP → Claude API → MCP Server → Lazy Map API
```

**Requires**:
- MCP server modified to accept HTTP requests
- WebSocket for streaming responses
- More complex architecture

**Benefits**:
- Reuses existing MCP server
- Consistent tool definitions
- Could support other AI providers

**Drawbacks**:
- Much more complex
- Higher latency
- MCP-over-HTTP not standard yet

## Comparison: MCP Server vs Claude-Powered Frontend

| Feature | MCP Server (Dev Tool) | Claude Frontend (User Feature) |
|---------|----------------------|--------------------------------|
| **Target Audience** | Developers, testers | End users, players, GMs |
| **Interface** | Claude Desktop / VS Code CLI | Web browser, mobile-friendly |
| **Setup** | Config file, local install | None (just use app) |
| **Transport** | stdio (local process) | HTTPS (web) |
| **Authentication** | Developer JWT | User session |
| **Cost** | Free (no API calls) | Pay per use (Anthropic API) |
| **Use Case** | Testing, debugging, automation | Map generation, gameplay |
| **Latency** | Low (local) | Medium (HTTP + AI) |
| **Rate Limiting** | None | Per user budget |
| **Natural Language** | Limited (Claude understands tools) | Full (designed for it) |

## Top Risks

1. **API Costs - HIGH**: Claude API costs scale with users
   - **Mitigation**: Per-user rate limits, use cheaper Haiku model, cache results

2. **Prompt Injection - MEDIUM**: Users might try to manipulate Claude
   - **Mitigation**: Validate tool parameters server-side, sanitize prompts, limit tool access

3. **Quality Variance - MEDIUM**: AI might misinterpret complex prompts
   - **Mitigation**: Show Claude's interpretation, allow manual editing, add examples

4. **Rate Limiting - MEDIUM**: Anthropic API has rate limits
   - **Mitigation**: Queue requests, batch if possible, retry logic

5. **User Expectations - LOW**: Users expect instant results
   - **Mitigation**: Show loading state, explain AI processing, preview interpretation

## Success Criteria

**Functional**:
- [ ] Users can generate maps via natural language
- [ ] Claude accurately interprets geographic terms
- [ ] Rate limiting prevents abuse
- [ ] Cost tracking works correctly
- [ ] Error handling is user-friendly

**Non-Functional**:
- [ ] Response time < 10 seconds (including AI + generation)
- [ ] 95% of prompts interpreted correctly
- [ ] Cost per user < $0.10/month average
- [ ] No prompt injection vulnerabilities
- [ ] Works on mobile devices

## Future Enhancements

- **Conversational refinement**: "Make it more forested"
- **Image understanding**: Upload reference images
- **Voice input**: Speak map descriptions
- **Campaign integration**: "Generate next session map"
- **Style templates**: "Dark Souls style" or "Studio Ghibli"
- **Multi-language support**: Prompts in Spanish, French, etc.

## References

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/messages_post)
- [Claude Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [MCP Server Plan](./mcp-server-for-api.md)
