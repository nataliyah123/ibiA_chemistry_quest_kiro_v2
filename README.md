# ChemQuest: Alchemist Academy

A gamified chemistry learning platform designed for O/A-Level students, transforming traditional chemistry education into an engaging adventure through six magical realms.

## 🎮 Game Realms

- **Mathmage Trials**: Master equation balancing and stoichiometry
- **Memory Labyrinth**: Test knowledge of chemical properties and reactions
- **Virtual Apprentice**: Learn laboratory techniques and procedures
- **Seer's Challenge**: Develop observation skills and predict outcomes
- **Cartographer's Gauntlet**: Analyze data and interpret chemical graphs
- **Forest of Isomers**: Navigate the complex world of organic chemistry

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- PostgreSQL 15+ (if running locally)
- Redis 7+ (if running locally)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chemquest-alchemist-academy
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Start all services in development mode
   npm run docker:dev
   ```

3. **Or run locally**
   ```bash
   # Install dependencies
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..

   # Set up environment variables
   cp server/.env.example server/.env
   # Edit server/.env with your database and Redis credentials

   # Start PostgreSQL and Redis (or use Docker)
   docker-compose -f docker-compose.dev.yml up postgres redis -d

   # Initialize database
   psql -h localhost -U chemquest_user -d chemquest_db -f database/init.sql

   # Start development servers
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Production Deployment

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy with Docker**
   ```bash
   npm run docker:prod
   ```

## 📁 Project Structure

```
chemquest-alchemist-academy/
├── client/                 # React TypeScript frontend
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── server/                 # Node.js Express backend
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── database/              # Database schema and migrations
│   └── init.sql
├── docker-compose.yml     # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup
└── README.md
```

## 🛠️ Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run build` - Build both client and server for production
- `npm run test` - Run tests for both client and server
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:prod` - Start production environment with Docker

## 🔧 Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- PWA support with offline capabilities
- Redux Toolkit for state management
- React Router for navigation

### Backend
- Node.js with Express and TypeScript
- PostgreSQL for primary database
- Redis for caching and sessions
- JWT for authentication
- Comprehensive security middleware

### DevOps
- Docker and Docker Compose
- Multi-stage builds for optimization
- Health checks and monitoring
- Nginx for production frontend serving

## 🎯 Features

- **Gamified Learning**: Character progression, XP, levels, and badges
- **Six Unique Realms**: Each focusing on different chemistry concepts
- **Progressive Web App**: Works offline and installable on mobile
- **Real-time Leaderboards**: Compete with other students
- **Daily Quests**: Keep students engaged with daily challenges
- **Adaptive Difficulty**: Adjusts to student performance
- **Comprehensive Analytics**: Track learning progress and weak areas

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Rate limiting and request validation
- CORS protection and security headers
- Input sanitization and SQL injection prevention
- Password hashing with bcrypt
- Session management with Redis

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:
- Users and Characters (gamification profiles)
- Realms and Challenges (game content)
- Challenge Attempts (progress tracking)
- Badges and Achievements (rewards system)
- Daily Quests and Leaderboards (engagement features)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.