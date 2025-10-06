# 🔍 ForensicFlow

<div align="center">

**AI-Powered Digital Forensics Analysis Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0+-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/GitHub-ForensicFlow-black?logo=github)](https://github.com/ForensicFlow/ForensicFlow)

*Reducing forensic analysis time from days to hours with AI-powered natural language queries*

**🔗 [View Repository](https://github.com/ForensicFlow/ForensicFlow) • 🚀 [Live Demo](https://forensicflow.onrender.com/) • 📖 [API Docs](https://forensicflow.onrender.com/api/)**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

**ForensicFlow** is an advanced digital forensics platform designed to ingest, analyze, and extract insights from Universal Forensic Data Reports (UFDR). Built for the **Smart India Hackathon 2025**, it addresses the critical challenge of reducing the time and expertise required to extract actionable intelligence from complex forensic data.

### 🎯 Problem Statement

AI-based UFDR (Universal Forensic Extraction Device Report) Analysis Tool
### 💡 Our Solution

ForensicFlow provides:
- **Natural Language Queries**: Ask questions in plain English
- **AI-Powered Analysis**: Automatic entity extraction and correlation
- **Visual Intelligence**: Network graphs showing connections between entities
- **Instant Reports**: Generate comprehensive forensic reports in seconds
- **Multi-Format Support**: Ingest JSON, XML, CSV, and more

---

## ✨ Features

### 🤖 AI-Powered Analysis
- **Natural Language Interface**: Query evidence using plain English
- **Intelligent Entity Extraction**: Automatically identifies phone numbers, emails, crypto addresses, locations, and more
- **Contextual Insights**: AI-generated summaries and hypothesis generation
- **Pattern Recognition**: Identifies suspicious activities and connections

### 📊 Data Management
- **Multi-Format UFDR Ingestion**: JSON, XML, CSV, and custom formats
- **Case Management**: Organize evidence by cases with role-based access
- **Secure Storage**: Encrypted evidence storage with audit trails
- **User Isolation**: Complete data separation between users and organizations

### 🕸️ Visualization
- **Network Graphs**: Visualize relationships between entities
- **Timeline View**: Track events chronologically
- **Interactive Dashboard**: Real-time statistics and insights
- **Evidence Mapping**: Geographic visualization of location data

### 📈 Reporting & Audit
- **One-Click Reports**: Generate comprehensive forensic reports
- **Multiple Export Formats**: PDF, JSON, Excel
- **Complete Audit Trail**: Track all user actions and data access
- **Chain of Custody**: Maintain evidence integrity

### 🔒 Security & Compliance
- **Role-Based Access Control**: Admin, Investigator, Analyst, Viewer roles
- **JWT Authentication**: Secure token-based authentication
- **Data Isolation**: User-level and case-level data segregation
- **Audit Logging**: Complete activity tracking for compliance

---
### 📋 Prerequisites

**Backend:**
- Python 3.10 or higher
- PostgreSQL 12+ (or SQLite for development)
- Redis (optional - for background tasks)

**Frontend:**
- Node.js 18+ and npm

**API Keys:**
- Gemini API Key (required) - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

### 🔧 Manual Installation

#### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ForensicFlow/ForensicFlow.git
cd ForensicFlow
```

#### 2️⃣ Environment Configuration

**Backend** - Create `backend/.env`:
```bash
cd backend
cp env.example .env
# Edit .env and add your GEMINI_API_KEY
```

**Frontend** - Create `client/.env`:
```bash
cd ../client
echo "VITE_API_URL=http://localhost:8000/api" > .env
# Add VITE_GEMINI_API_KEY if needed
```
#### 3️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Create a superuser
python manage.py createsuperuser

# Start the development server
python manage.py runserver
```

#### 4️⃣ Frontend Setup

```bash
# In a NEW terminal, navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

#### 5️⃣ Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **Framework**: Django 5.0 + Django REST Framework
- **Database**: PostgreSQL (production) / SQLite (development)
- **Task Queue**: Celery + Redis
- **AI/ML**: Google Gemini API, OpenAI GPT
- **Authentication**: JWT (djangorestframework-simplejwt)

**Frontend:**
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4
- **State Management**: React Context API
- **Markdown**: react-markdown with GitHub Flavored Markdown

### Project Structure

```
forensicflow/
├── backend/                    # Django backend
│   ├── authentication/         # User authentication & authorization
│   ├── cases/                  # Case management
│   ├── evidence/               # Evidence storage & UFDR parsing
│   ├── ai_analysis/            # AI query processing
│   ├── reports/                # Report generation
│   ├── audit/                  # Audit logging
│   ├── forensicflow_backend/   # Django settings
│   ├── manage.py
│   ├── requirements.txt
│   └── env.example            # Environment variables template
│
├── client/                     # React frontend
│   ├── components/            # Reusable UI components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utilities & API client
│   ├── assets/                # Images & static files
│   ├── package.json
│   └── env.example            # Environment variables template
│
├── sample_data/               # Sample UFDR files
├── doc/                       # Additional documentation
└── README.md                  # This file
```

---

## 🔧 Configuration

### Backend Environment Variables

Copy `backend/env.example` to `backend/.env` and configure:

```env
# Core Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=forensicflow
DB_USER=postgres
DB_PASSWORD=your-password

# AI APIs (at least one required)
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# Email (for notifications)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Frontend Environment Variables

Copy `client/env.example` to `client/.env`:

```env
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_API_URL=http://localhost:8000
```

---

## 📚 Documentation

### Key Concepts

**UFDR (Universal Forensic Data Report)**
- Standardized format for forensic data
- Contains messages, calls, contacts, files, locations
- Supports JSON, XML, CSV formats

**Entity Extraction**
Automatically identifies:
- Phone numbers & email addresses
- Cryptocurrency addresses (BTC, ETH, etc.)
- URLs & IP addresses
- GPS coordinates & locations
- Financial amounts & currencies
- Dates, times, and more

**Natural Language Queries**
Example queries:
```
"Show me all messages containing cryptocurrency addresses"
"List communications with international numbers"
"Find evidence from March 12th near Pier 4"
"What suspicious transactions were found?"
"Generate a summary of all WhatsApp conversations"
```

### API Documentation

#### Authentication
```bash
# Register user
POST /api/auth/register/

# Login
POST /api/auth/login/

# Refresh token
POST /api/auth/token/refresh/
```

#### Cases
```bash
# List cases
GET /api/cases/

# Create case
POST /api/cases/

# Upload UFDR file
POST /api/cases/{id}/upload_file/
```

#### AI Analysis
```bash
# Ask natural language question
POST /api/ai/queries/ask/
{
  "query": "show me all crypto transactions",
  "case_id": "case-001"
}

# Generate insights
POST /api/ai/insights/generate/
```

For complete API documentation, visit the backend README or access `/api/docs/` when running the server.

---

## 🎨 Features Showcase

### FlowBot - AI Assistant
- **Chat Interface**: Natural conversation with your forensic data
- **Hypothesis Mode**: Generate and test investigative theories
- **Context-Aware**: Understands case context and previous queries
- **Evidence Linking**: Direct links to relevant evidence

### Network Graph Visualization
- Interactive force-directed graphs
- Entity relationship mapping
- Suspicious pattern highlighting
- Filterable by entity type

### Advanced Search
- Keyword search across all evidence
- Filter by date, type, source
- Entity-based filtering
- Fuzzy matching support

---

## 🧪 Sample Data

Sample UFDR files are provided in `sample_data/`:

```bash
cd sample_data
cat sample_ufdr.json
```

Upload these files through the UI to explore the platform's capabilities.

---

## 🛠️ Development

### Running Tests

**Backend:**
```bash
cd backend
python manage.py test
```

**Frontend:**
```bash
cd client
npm run test  # Add test script to package.json
```

### Code Quality

**Backend:**
```bash
# Linting
pylint */

# Type checking
mypy */
```

**Frontend:**
```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

### Creating Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

---

## 🚢 Production Deployment

### Backend

1. **Set environment variables**:
   - `DEBUG=False`
   - Set secure `SECRET_KEY`
   - Configure PostgreSQL
   - Set `ALLOWED_HOSTS`

2. **Use production WSGI server**:
   ```bash
   pip install gunicorn
   gunicorn forensicflow_backend.wsgi:application --bind 0.0.0.0:8000
   ```

3. **Set up reverse proxy** (Nginx/Apache)

4. **Configure SSL/TLS certificates**

5. **Run Celery with supervisor/systemd**

### Frontend

```bash
cd client
npm run build
```

Deploy the `dist/` folder to your web server or CDN.

### 🚀 Deployment

**Backend (Render):** ✅ **LIVE** at [https://forensicflow.onrender.com/](https://forensicflow.onrender.com/)

**Frontend (Vercel):**
1. Import GitHub repository to Vercel
2. Set **Root Directory** to `client`
3. Add environment variables:
   - `VITE_API_URL=https://forensicflow.onrender.com/api`
   - `VITE_GEMINI_API_KEY=<your-key>`
4. Deploy!

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** at [github.com/ForensicFlow/ForensicFlow](https://github.com/ForensicFlow/ForensicFlow)
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request** at [github.com/ForensicFlow/ForensicFlow/pulls](https://github.com/ForensicFlow/ForensicFlow/pulls)

### Contribution Guidelines

- Follow existing code style
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Free for use in **Smart India Hackathon 2025** and beyond.

---

## 🏆 Smart India Hackathon 2025

This project addresses **SIH Problem Statement**: "Digital Forensics Tool for UFDR Analysis"

### Requirements Met ✅

- ✅ Ingests UFDRs from various forensic tools
- ✅ Provides natural language query interface
- ✅ Generates easily readable reports
- ✅ Significantly reduces time to extract insights
- ✅ Shows interconnectivity across forensic data
- ✅ Requires no deep technical expertise

### Innovation Highlights

- **AI-First Approach**: Leveraging latest LLMs for forensic analysis
- **User-Centric Design**: Intuitive interface for non-technical users
- **Scalable Architecture**: Handles large datasets efficiently
- **Security-Focused**: Enterprise-grade security and compliance

---

## 👥 Team

**Neural Knightx** - Built with ❤️ for Smart India Hackathon 2025

### Team Leader
- **Abhishek Maurya**

### Team Members
- Kumar Manglam
- Prachi Shukla
- Divyank Sharma
- Amit Sonkar
- Aditi Malviya

---

## 📧 Contact & Support

- **Repository**: [ForensicFlow on GitHub](https://github.com/ForensicFlow/ForensicFlow)
- **Issues**: [GitHub Issues](https://github.com/ForensicFlow/ForensicFlow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ForensicFlow/ForensicFlow/discussions)
- **Email**: forensicflow@gmail.com

---

## 🙏 Acknowledgments

- Smart India Hackathon for the problem statement
- Google Gemini API for AI capabilities
- Django & React communities
- All open-source contributors

---

<div align="center">

**⭐ [Star this repository](https://github.com/ForensicFlow/ForensicFlow) if you find it helpful!**

**🔗 Repository**: [github.com/ForensicFlow/ForensicFlow](https://github.com/ForensicFlow/ForensicFlow)

Made with 🔍 for better forensic investigations

</div>

