# Writer Assistant

AI-powered writing assistant with multi-agent architecture and multi-model support.

## Features

- **Multi-Agent System**: 5 specialized AI agents (researcher, critic, synthesizer, reviewer, fact-checker)
- **Multi-Model Support**: GLM-4.7 (dual API keys), Deepseek R1, Qwen 2.5 Coder via SmartRouter
- **Real-time Collaboration**: WebSocket-based collaborative editing
- **Text Processing**: Automatic chunking for large texts with overlap handling
- **Research Tools**: Structured prompts for hypothesis generation, literature review, fact-checking
- **Project Management**: Projects, chapters, characters, scenes, writing sessions tracking
- **Comments System**: In-document comments with resolution tracking
- **Export Capabilities**: Multiple format export support

## Architecture

### Frontend
- **Framework**: React with Vite
- **Location**: `/web-demo`
- **Dev Server**: `npm run dev` (default port: 5173)

### Backend
- **Framework**: Node.js with Express
- **Database**: SQLite (via sql.js)
- **Location**: `/backend`
- **API Server**: `npm start` (default port: 5001)

### Key Services
- `MultiAgentService.js`: ABMCTS-based multi-agent coordination
- `SmartRouter.js`: Intelligent routing between GLM/Deepseek/Qwen models
- `GLMService.js`: GLM-4.7 API integration with dual keys
- `TextChunkingService.js`: Large text processing with overlap
- `ResearchPrompts.js`: Structured research prompts
- `DocumentService.js`: Document management

## Setup

### Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5001
GLM_API_KEY=your_primary_glm_key
GLM_SECONDARY_API_KEY=your_secondary_glm_key
GLM_BASE_URL=https://api.z.ai/api/coding/paas/v4
OPENROUTER_API_KEY=your_openrouter_key
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### Frontend Setup

```bash
cd web-demo
npm install
npm run dev
```

## API Endpoints

### AI Endpoints
- `POST /ai/chat` - Chat with AI
- `POST /ai/research` - Research task execution
- `POST /ai/multi-agent` - Multi-agent collaboration
- `POST /ai/analyze` - Text analysis
- `POST /ai/edit` - AI-assisted editing
- `POST /ai/generate` - Content generation
- `POST /ai/suggest` - Writing suggestions
- `POST /ai/rewrite` - Text rewriting
- `POST /ai/summarize` - Text summarization
- `POST /ai/expand` - Text expansion
- `POST /ai/check-facts` - Fact checking
- `POST /ai/generate-hypothesis` - Hypothesis generation
- `POST /ai/literature-review` - Literature review
- `POST /ai/methodology` - Research methodology
- `POST /ai/data-analysis` - Data analysis
- `POST /ai/discussion` - Discussion section
- `POST /ai/conclusion` - Conclusion generation
- `POST /ai/abstract` - Abstract writing
- `POST /ai/keywords` - Keywords extraction
- `POST /ai/references` - References generation
- `POST /ai/outline` - Content outlining
- `POST /ai/characters` - Character development
- `POST /ai/scenes` - Scene development
- `POST /ai/dialogue` - Dialogue generation
- `POST /ai/settings` - Scene settings
- `POST /ai/plot-twist` - Plot twist suggestions
- `POST /ai/conflict` - Conflict resolution
- `POST /ai/pace` - Pacing analysis
- `POST /ai/tone` - Tone adjustment
- `POST /ai/style` - Style transfer
- `POST /ai/grammar` - Grammar checking
- `POST /ai/readability` - Readability analysis
- `POST /ai/seo` - SEO optimization
- `POST /ai/metadata` - Metadata generation

### Project Management
- `GET /projects` - List projects
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/chapters` - List chapters
- `POST /chapters` - Create chapter
- `PUT /chapters/:id` - Update chapter
- `DELETE /chapters/:id` - Delete chapter

### Chat System
- `POST /chat/message` - Send message
- `GET /chat/history/:sessionId` - Get chat history
- `DELETE /chat/clear/:sessionId` - Clear chat history

### Comments
- `GET /comments/project/:projectId` - Get project comments
- `GET /comments/chapter/:chapterId` - Get chapter comments
- `POST /comments` - Create comment
- `PUT /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

### File Upload
- `POST /upload/text` - Upload text file
- `POST /upload/document` - Upload document

### Export
- `POST /export/pdf` - Export to PDF
- `POST /export/docx` - Export to DOCX
- `POST /export/txt` - Export to TXT
- `POST /export/markdown` - Export to Markdown

## Multi-Agent System

The system uses ABMCTS (Agent-Based Monte Carlo Tree Search) for task execution:

1. **Researcher**: Analyzes sources and generates hypotheses
2. **Critic**: Evaluates arguments and identifies weaknesses
3. **Synthesizer**: Combines insights from multiple agents
4. **Reviewer**: Provides academic review and feedback
5. **Fact-Checker**: Verifies factual accuracy

Configuration:
```javascript
ABMCTSIterations: 3
maxAgentsPerTask: 3
```

## Smart Routing

The SmartRouter automatically routes requests to appropriate models:

- **GLM-4.7**: Primary model for critical tasks and research
- **Deepseek R1**: Free model for analysis tasks
- **Qwen 2.5 Coder**: Free model for code-related tasks

Routing is based on:
- Task type classification
- Model availability
- Performance requirements
- Cost optimization

## Database Schema

- `users`: User accounts and settings
- `projects`: Writing projects
- `chapters`: Project chapters with content
- `scenes`: Scene breakdowns
- `characters`: Character profiles
- `writing_sessions`: Writing session tracking
- `goals`: User goals and targets
- `chat_history`: Chat message history
- `ai_requests`: AI request logs
- `exports`: Export history
- `comments`: Document comments

## WebSocket Events

Real-time collaboration events:
- `connected`: Connection established
- `join_project`: Join project room
- `leave_project`: Leave project room
- `user_joined`: User joined notification
- `user_left`: User left notification
- `typing_start`: Typing indicator
- `typing_stop`: Typing stopped
- `broadcast`: General broadcast

## Quick Start Scripts

### Start All Servers
```bash
./WriterProject/start-all.sh
```
This script will:
1. Install dependencies if needed
2. Start backend server (port 5001)
3. Start frontend server (port 5173)

### Run All Tests
```bash
./WriterProject/run-tests.sh
```
This script will run both backend and frontend unit tests.

### Manual Backend Testing
```bash
cd WriterProject/backend
node manual-test.js
```
This script tests critical endpoints:
- `/health` - Health check
- `/api/self-test/run/unit` - Self-test runner
- `/api/ai/generate-hypothesis` - AI generation
- `/api/metrics` - Metrics collection

## Development

### Backend Development
```bash
cd backend
npm install
npm start
```

### Frontend Development
```bash
cd web-demo
npm install
npm run dev
```

### Database Check
```bash
cd backend
node check_database.js
```

## License

Proprietary - All rights reserved

## Version History

### v7.0.0 - Review.md Refactoring Complete (2026-01-12)
- Centralized error handling middleware
- Schema-based request validation
- Environment variable configuration
- Modular prompt system
- Unified AI request handler
- Error boundary for lazy-loaded components
- Custom error classes (NotFoundError, ExternalServiceError)
- Monolithic App.jsx decomposed into modular components
- Automated testing framework (Jest + Vitest)
- 100+ unit tests covering critical functionality
- Metrics collection and monitoring endpoints
- Self-test runner for automated validation
- Integration tests for AI endpoints
- Optimized GLM-4.7 prompts
- Enhanced OutputValidator with detailed validation
- Free OpenRouter models (Gemma 2, Mistral 7B, Llama 3.2)
- PrismaFlowGenerator for systematic reviews
- ForestPlotGenerator for meta-analysis
- Humanizer for AI text readability improvement
- TTL response caching (5 mins) in SmartRouter
- Lazy loading of backend services
- Connection pooling in GLMService
- Request deduplication in GLMService
- React.memo for 6 frontend components
- Debounce for 4 input handlers
- Automated git push scripts
- Project backup automation

### v1.0.0 - ULTRATHINK Edition
- Multi-agent architecture with ABMCTS
- Dual GLM-4.7 integration
- SmartRouter with Qwen/Deepseek support
- Real-time collaboration via WebSocket
- Comprehensive research tools
- Full project management system
- Comments and export functionality