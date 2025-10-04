# Database Migration Notes

## Pending Migrations for Report Items

After setting up the Django environment, run these commands:

```bash
cd backend
python manage.py makemigrations ai_analysis
python manage.py migrate
```

This will create the `ReportItem` model table for the Pin to Report functionality.

## New Model: ReportItem

Located in: `ai_analysis/models.py`

Features:
- Stores pinned AI responses and evidence
- Maintains evidence chain with source tracking
- Supports sections and ordering for report organization
- JSON fields for flexible metadata storage

## API Endpoints Created

- `POST /api/ai/report-items/pin_ai_response/` - Pin AI analysis to report
- `POST /api/ai/report-items/pin_evidence/` - Pin evidence item to report
- `GET /api/ai/report-items/sections/?case_id=X` - Get all pinned items grouped by section
- `POST /api/ai/report-items/reorder/` - Reorder items within a section
- Standard CRUD: GET, POST, PUT, PATCH, DELETE at `/api/ai/report-items/`
