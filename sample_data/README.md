# Sample UFDR Data

This directory contains sample UFDR files for testing the ForensicFlow application.

## Files

### sample_ufdr.json
A comprehensive sample UFDR file containing:
- **Messages**: WhatsApp, Signal, and Telegram communications
- **Calls**: Call logs with various contacts
- **Contacts**: Contact list with suspicious entries
- **Locations**: GPS coordinates from various locations
- **Files**: Images, PDFs, and wallet backups
- **Browser History**: Web browsing activity
- **Installed Apps**: Apps including crypto wallets and Tor
- **Accounts**: Email and cryptocurrency accounts

## Test Scenario: Operation Zephyr

This sample data represents a fictional cryptocurrency fraud investigation:

### Key Evidence Points

1. **Cryptocurrency Transaction**
   - Bitcoin wallet: `3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy`
   - Transaction amount: 0.15 BTC
   - Second wallet: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`

2. **Suspicious Communications**
   - Code word "Zephyr" used in messages
   - Meeting location: Pier 4
   - Reference to $50,000 USD payment

3. **International Contacts**
   - US number: +1 555-0123 (The Fixer)
   - UK number: +44 7700 900123 (Dealer X)
   - Indian numbers: +91 9876543210, +91 9876543212

4. **Location Evidence**
   - New Delhi, India (Connaught Place)
   - New York Harbor, USA
   - London, UK
   - Mumbai, India (Gateway of India)

5. **Digital Artifacts**
   - Encrypted messaging apps (Signal, Telegram)
   - Crypto wallet applications
   - Tor Browser for dark web access
   - ProtonMail for secure email

6. **Suspicious Activity Patterns**
   - Late night calls (2:30 AM, 11:45 PM)
   - Frequent crypto-related searches
   - Use of privacy-focused tools

## How to Use

### Upload to ForensicFlow

1. **Via Web Interface**:
   - Create a new case in ForensicFlow
   - Click "Upload UFDR"
   - Select `sample_ufdr.json`
   - Wait for processing

2. **Via API**:
   ```bash
   curl -X POST http://localhost:8000/api/cases/case-001/upload_file/ \
     -F "file=@sample_ufdr.json" \
     -F "file_type=UFDR"
   ```

### Expected AI Insights

When you process this file, the AI should identify:

1. **Pattern: Frequent Crypto Addresses**
   - Multiple Bitcoin addresses mentioned
   - Cryptocurrency transaction patterns

2. **Anomaly: Late Night Activity**
   - Calls and messages during unusual hours
   - Potential indicator of suspicious behavior

3. **Connection: International Network**
   - Links between Indian, US, and UK contacts
   - Cross-border communication patterns

4. **Entity Network**:
   - Phone numbers connected to crypto addresses
   - Locations linked to contacts
   - Code words associated with meetings

### Sample Queries to Try

Once uploaded, try these natural language queries:

1. **Crypto Investigation**:
   - "Show me all crypto addresses"
   - "Find Bitcoin transactions"
   - "List cryptocurrency wallets mentioned"

2. **Communication Analysis**:
   - "Show messages with foreign numbers"
   - "Find communications mentioning Zephyr"
   - "List all Signal messages"

3. **Location Tracking**:
   - "Show evidence from New Delhi"
   - "Find all GPS coordinates"
   - "Where was Pier 4 mentioned?"

4. **Temporal Analysis**:
   - "Show activity from March 12th"
   - "Find late night communications"
   - "List all calls after 10 PM"

5. **Financial Evidence**:
   - "Show money transfer discussions"
   - "Find references to $50,000"
   - "List payment related messages"

## Creating Your Own UFDR Files

### JSON Format Template

```json
{
  "metadata": {
    "extraction_tool": "Tool Name",
    "extraction_date": "ISO 8601 timestamp",
    "device_model": "Device Model",
    "case_number": "Case Number"
  },
  "messages": [
    {
      "text": "Message content",
      "sender": "Phone/ID",
      "receiver": "Phone/ID",
      "timestamp": "ISO 8601 timestamp",
      "app": "App name",
      "direction": "incoming/outgoing"
    }
  ],
  "calls": [
    {
      "number": "Phone number",
      "timestamp": "ISO 8601 timestamp",
      "duration": 180,
      "type": "incoming/outgoing/missed"
    }
  ],
  "locations": [
    {
      "lat": 0.0,
      "lon": 0.0,
      "timestamp": "ISO 8601 timestamp",
      "address": "Address",
      "accuracy": 10,
      "source": "GPS/Cell/WiFi"
    }
  ],
  "files": [
    {
      "name": "filename.ext",
      "size": 1024,
      "modified": "ISO 8601 timestamp",
      "hash": "SHA256 hash",
      "mime_type": "MIME type"
    }
  ]
}
```

### XML Format Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<forensic_data>
  <metadata>
    <extraction_tool>Tool Name</extraction_tool>
    <extraction_date>2025-03-15T10:00:00Z</extraction_date>
  </metadata>
  <messages>
    <message app="WhatsApp" timestamp="2025-03-12T14:32:10Z">
      <sender>+91 9876543210</sender>
      <receiver>+91 9876543211</receiver>
      <text>Message content</text>
    </message>
  </messages>
  <calls>
    <call type="incoming" timestamp="2025-03-12T18:00:00Z">
      <number>+1 555-0123</number>
      <duration>180</duration>
    </call>
  </calls>
</forensic_data>
```

### CSV Format Template

```csv
type,source,content,timestamp,sender,receiver,metadata
message,WhatsApp,"Message content",2025-03-12T14:32:10Z,+91 9876543210,+91 9876543211,"{""app"":""WhatsApp""}"
call,Call Log,"Call with +1 555-0123",2025-03-12T18:00:00Z,+1 555-0123,,"{""duration"":180,""type"":""incoming""}"
location,GPS,"Location data",2025-03-12T14:30:00Z,,,"{""lat"":28.6139,""lon"":77.2090}"
```

## Entity Types Recognized

The system automatically extracts:

- **Phone Numbers**: +91 9876543210, +1 555-0123
- **Email Addresses**: crypto.dealer@darknet.onion
- **Crypto Addresses**: 3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy
- **GPS Coordinates**: 28.6139° N, 77.2090° E
- **IP Addresses**: 203.0.113.75
- **URLs**: https://blockchain.com/...
- **Amounts**: $50,000, 0.15 BTC
- **Dates**: March 12th, 2025-03-12

## Notes

- All data in these samples is **fictional** and for testing only
- Phone numbers use reserved ranges (555-XXXX)
- Crypto addresses are example addresses
- Locations are real places but scenarios are fictional
- Use this data for development, testing, and demo purposes

## Troubleshooting

If upload fails:
1. Check file size (max 500MB by default)
2. Verify JSON is valid (use jsonlint.com)
3. Ensure proper encoding (UTF-8)
4. Check backend logs for detailed errors

For CSV files:
- Use UTF-8 encoding
- Include header row
- Escape commas in content with quotes

For XML files:
- Use proper XML declaration
- Ensure well-formed structure
- Validate against schema if available

