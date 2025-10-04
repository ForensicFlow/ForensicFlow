# ForensicFlow Backend

AI-powered UFDR (Universal Forensic Data Report) analysis system for digital forensic investigations.

## Features

- 📁 **UFDR Ingestion**: Parse and import forensic data from multiple formats (JSON, XML, CSV)
- 🤖 **AI-Powered Analysis**: Natural language queries using Google Gemini or OpenAI
- 🔍 **Smart Search**: Intelligent evidence search with entity extraction
- 🕸️ **Network Graph**: Visualize connections between entities
- 📊 **Report Generation**: Generate comprehensive forensic reports
- 🔐 **Audit Logging**: Complete audit trail of all actions
- 🔄 **Async Processing**: Background processing with Celery for large files

## Architecture

### Django Apps

1. **cases**: Case management and file uploads
2. **evidence**: Evidence storage, UFDR parsing, entity extraction
3. **ai_analysis**: Natural language query processing and AI insights
4. **reports**: Report generation and export
5. **audit**: Audit logging and compliance

## Setup Instructions

### Prerequisites

- Python 3.10+
- PostgreSQL 12+
- Redis (for Celery)

### Installation

1. **Create virtual environment**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. **Setup database**:
```bash
# Create PostgreSQL database
createdb forensicflow

# Run migrations
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser**:
```bash
python manage.py createsuperuser
```

6. **Run development server**:
```bash
python manage.py runserver
```

7. **Start Celery worker** (in separate terminal):
```bash
celery -A forensicflow_backend worker -l info
```

### Environment Variables

Required variables in `.env`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=forensicflow
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# AI APIs (at least one required)
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Redis
REDIS_URL=redis://localhost:6379/0
```

## API Endpoints

### Cases
- `GET /api/cases/` - List all cases
- `POST /api/cases/` - Create new case
- `GET /api/cases/{id}/` - Get case details
- `POST /api/cases/{id}/upload_file/` - Upload UFDR file
- `GET /api/cases/{id}/evidence/` - Get case evidence

### Evidence
- `GET /api/evidence/items/` - List evidence items
- `GET /api/evidence/items/search/?q={query}` - Search evidence
- `GET /api/evidence/entities/` - List extracted entities
- `GET /api/evidence/connections/graph_data/?case_id={id}` - Get network graph data

### AI Analysis
- `POST /api/ai/queries/ask/` - Ask natural language question
  ```json
  {
    "query": "show me all chat records containing crypto addresses",
    "case_id": "case-001"
  }
  ```
- `GET /api/ai/queries/` - List past queries
- `POST /api/ai/insights/generate/` - Generate AI insights for a case

### Reports
- `GET /api/reports/` - List reports
- `POST /api/reports/generate/` - Generate new report
  ```json
  {
    "case_id": "case-001",
    "report_type": "summary",
    "title": "Case Summary Report"
  }
  ```

### Audit
- `GET /api/audit/` - List audit logs
- `GET /api/audit/stats/` - Get audit statistics

## UFDR File Formats

The system supports multiple UFDR formats:

### JSON Format
```json
{
  "messages": [
    {
      "text": "Transfer 0.15 BTC to wallet...",
      "sender": "+91 98xxxx",
      "timestamp": "2025-03-12T14:32:10Z",
      "app": "WhatsApp"
    }
  ],
  "calls": [...],
  "contacts": [...],
  "files": [...],
  "locations": [...]
}
```

### XML Format
```xml
<forensic_data>
  <message app="WhatsApp" timestamp="2025-03-12T14:32:10Z">
    <sender>+91 98xxxx</sender>
    <text>Transfer 0.15 BTC...</text>
  </message>
</forensic_data>
```

### CSV Format
```csv
type,source,content,timestamp,metadata
message,WhatsApp,"Transfer 0.15 BTC...",2025-03-12T14:32:10Z,...
```

## Entity Extraction

The system automatically extracts:
- Phone numbers
- Email addresses
- Cryptocurrency addresses
- IP addresses
- URLs
- GPS coordinates
- Amounts/Currency
- And more...

## Natural Language Queries

Example queries:
- "Show me all chat records containing crypto addresses"
- "List all communications with foreign numbers"
- "Find evidence mentioning 'Pier 4' or 'Zephyr'"
- "What cryptocurrency transactions were found?"
- "Show me location data from March 12th"

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Admin Interface
Access at `http://localhost:8000/admin/` with superuser credentials.

## Production Deployment

1. Set `DEBUG=False` in `.env`
2. Configure proper database (PostgreSQL)
3. Set up Redis for production
4. Use production WSGI server (Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn forensicflow_backend.wsgi:application --bind 0.0.0.0:8000
   ```
5. Set up Nginx as reverse proxy
6. Configure SSL/HTTPS
7. Set up Celery with supervisor or systemd

## SIH Hackathon Notes

This solution addresses all requirements:
- ✅ Ingests UFDRs from forensic tools
- ✅ Provides natural language query interface
- ✅ Generates easily readable reports
- ✅ Reduces time to extract insights
- ✅ Shows interconnectivity across forensic data
- ✅ No deep technical expertise required

## License

MIT License - Free for use in Smart India Hackathon 2025

