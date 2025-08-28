# 🚀 SIMPLET

**The Modern Code Snippet Marketplace**

*Discover, share, and monetize code snippets in a thriving developer community*

---

## 📸 Screenshots

### Login Experience
<img width="1350" height="750" alt="SIMPLET Login Interface" src="https://github.com/user-attachments/assets/42d2d59a-a54d-4786-bf75-3ea272e4d977" />

### Community Discussions
<img width="1350" height="810" alt="SIMPLET Thread Discussion" src="https://github.com/user-attachments/assets/a55c88ba-826b-4bfb-b448-058bf5f53a71" />

---

## 🎯 What is SIMPLET?

SIMPLET is a revolutionary marketplace where developers can **discover**, **share**, and **monetize** code snippets. Whether you're looking for a quick solution to a common problem or want to showcase your coding expertise, SIMPLET provides the perfect platform to connect with a global community of developers.

### 🌟 Key Features

- **📦 Snippet Marketplace** - Buy and sell high-quality code snippets
- **👥 Developer Community** - Connect with developers worldwide through forums and discussions  
- **📚 Personal Library** - Organize your favorite snippets and code collections
- **💬 Real-time Chat** - Instant communication with the community
- **🔍 Smart Search** - Find exactly what you need with advanced filtering
- **⭐ Rating System** - Quality assurance through community feedback
- **💰 Monetization** - Earn from your coding expertise
- **🎓 Learning Hub** - Educational resources and tutorials

---

## 🛠️ Technology Stack

SIMPLET is built with modern, scalable technologies:

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Radix UI** - Accessible component primitives

### Backend
- **Next.js API Routes** - Serverless backend functions
- **NextAuth.js** - Authentication and session management
- **PostgreSQL** - Robust relational database
- **Socket.IO** - Real-time communication
- **bcrypt** - Secure password hashing

### DevOps & Tools
- **Docker** - Containerized development environment
- **ESLint & Prettier** - Code quality and formatting
- **Vitest** - Modern testing framework
- **TypeScript** - Enhanced developer experience

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/simplet.git
   cd simplet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Default admin credentials will be created automatically

### Available Scripts

```bash
npm run dev          # Start development server with all services
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Check code quality
npm run services:up  # Start Docker services only
npm run services:down # Stop Docker services
```

---

## 📁 Project Structure

```
simplet/
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard and main app pages
│   ├── api/               # API routes and endpoints
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   └── ...               # Feature-specific components
├── infra/                # Infrastructure and database
│   ├── migrations/       # Database migrations
│   └── scripts/          # Setup and utility scripts
├── lib/                  # Utility functions and configurations
├── models/               # Data models and types
├── public/               # Static assets
├── socket-server/        # Real-time communication server
└── tests/                # Test files and configurations
```

---

## 🔌 API Overview

SIMPLET provides a comprehensive REST API for all platform features:

### Core Endpoints
- `GET /api/v1/snippets` - Browse marketplace snippets
- `POST /api/v1/snippets` - Create new snippet
- `GET /api/v1/categories` - List all categories
- `GET /api/v1/users/[username]` - User profiles
- `POST /api/v1/auth/register` - User registration

### Real-time Features
- WebSocket connection for live chat
- Real-time notifications
- Live snippet updates

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Standards
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all linting passes

---

## 📋 Roadmap

### 🎯 Current Focus
- [ ] Enhanced snippet editor with syntax highlighting
- [ ] Advanced search and filtering capabilities
- [ ] Mobile-responsive design improvements
- [ ] Payment integration for marketplace transactions

### 🔮 Future Plans
- [ ] AI-powered snippet recommendations
- [ ] Code snippet versioning system
- [ ] Integration with popular IDEs
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Documentation**: [Coming Soon]
- **Issues**: [GitHub Issues](https://github.com/EduContin/simplet/issues)
- **Discussions**: [GitHub Discussions](https://github.com/EduContin/simplet/discussions)
- **Email**: support@simplet.dev

---

<div align="center">

**Built with ❤️ by the SIMPLET Team**

[⭐ Star us on GitHub](https://github.com/EduContin/simplet) | [🐛 Report Bug](https://github.com/EduContin/simplet/issues) | [💡 Request Feature](https://github.com/EduContin/simplet/issues)

</div>
