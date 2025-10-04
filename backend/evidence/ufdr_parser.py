"""
UFDR (Universal Forensic Data Report) Parser
Extracts evidence from various forensic tool outputs
Supports: JSON, XML, CSV, XLSX, UFDR, and auto-detection
"""
import json
import xml.etree.ElementTree as ET
import csv
import re
from datetime import datetime
from typing import List, Dict, Any
import hashlib
import os

# Optional imports for extended format support
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    import chardet
    CHARDET_AVAILABLE = True
except ImportError:
    CHARDET_AVAILABLE = False


class UFDRParser:
    """
    Parser for UFDR files from various forensic tools
    Supports: JSON, XML, CSV, XLSX, XLS, TSV, UFDR formats with auto-detection
    """
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.file_extension = file_path.split('.')[-1].lower()
        self.file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    
    def parse(self) -> List[Dict[str, Any]]:
        """
        Main parsing method - detects format and delegates to appropriate parser
        """
        # Map extensions to parser methods
        parser_map = {
            'json': self.parse_json,
            'xml': self.parse_xml,
            'csv': self.parse_csv,
            'tsv': self.parse_tsv,
            'xlsx': self.parse_xlsx,
            'xls': self.parse_xls,
            'ufdr': self.parse_ufdr,
        }
        
        # Try extension-based parsing first
        parser = parser_map.get(self.file_extension)
        if parser:
            try:
                return parser()
            except Exception as e:
                print(f"Error parsing with {self.file_extension} parser: {e}")
                # Fall back to auto-detection
                return self.auto_detect_and_parse()
        else:
            # Try to auto-detect
            return self.auto_detect_and_parse()
    
    def parse_json(self) -> List[Dict[str, Any]]:
        """Parse JSON UFDR format"""
        # Try different encodings to handle various file sources
        encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        data = None
        last_error = None
        
        for encoding in encodings:
            try:
                with open(self.file_path, 'r', encoding=encoding) as f:
                    data = json.load(f)
                break  # Successfully parsed
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                last_error = e
                continue
        
        if data is None:
            raise ValueError(f"Could not parse JSON file with any encoding. Last error: {last_error}")
        
        # Use helper method to parse JSON data
        return self.parse_json_data(data)
    
    def parse_xml(self) -> List[Dict[str, Any]]:
        """Parse XML UFDR format"""
        tree = ET.parse(self.file_path)
        root = tree.getroot()
        
        evidence_items = []
        
        # Parse messages
        for msg in root.findall('.//message'):
            evidence_items.append(self._parse_xml_message(msg))
        
        # Parse calls
        for call in root.findall('.//call'):
            evidence_items.append(self._parse_xml_call(call))
        
        # Parse files
        for file_elem in root.findall('.//file'):
            evidence_items.append(self._parse_xml_file(file_elem))
        
        return evidence_items
    
    def parse_csv(self) -> List[Dict[str, Any]]:
        """Parse CSV UFDR format"""
        evidence_items = []
        
        # Detect encoding
        encoding = self._detect_encoding()
        
        with open(self.file_path, 'r', encoding=encoding) as f:
            reader = csv.DictReader(f)
            for row in reader:
                evidence_items.append(self._normalize_csv_row(row))
        
        return evidence_items
    
    def parse_tsv(self) -> List[Dict[str, Any]]:
        """Parse TSV (Tab-Separated Values) format"""
        evidence_items = []
        
        # Detect encoding
        encoding = self._detect_encoding()
        
        with open(self.file_path, 'r', encoding=encoding) as f:
            reader = csv.DictReader(f, delimiter='\t')
            for row in reader:
                evidence_items.append(self._normalize_csv_row(row))
        
        return evidence_items
    
    def parse_xlsx(self) -> List[Dict[str, Any]]:
        """Parse XLSX (Excel) format"""
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required to parse XLSX files. Install with: pip install pandas openpyxl")
        
        evidence_items = []
        
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(self.file_path)
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name)
                
                # Convert DataFrame to dictionary records
                for _, row in df.iterrows():
                    row_dict = row.to_dict()
                    # Remove NaN values
                    row_dict = {k: v for k, v in row_dict.items() if pd.notna(v)}
                    evidence_items.append(self._normalize_csv_row(row_dict))
        
        except Exception as e:
            print(f"Error parsing XLSX: {e}")
            raise
        
        return evidence_items
    
    def parse_xls(self) -> List[Dict[str, Any]]:
        """Parse XLS (Old Excel) format"""
        if not PANDAS_AVAILABLE:
            raise ImportError("pandas is required to parse XLS files. Install with: pip install pandas xlrd")
        
        evidence_items = []
        
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(self.file_path, engine='xlrd')
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(self.file_path, sheet_name=sheet_name, engine='xlrd')
                
                # Convert DataFrame to dictionary records
                for _, row in df.iterrows():
                    row_dict = row.to_dict()
                    # Remove NaN values
                    row_dict = {k: v for k, v in row_dict.items() if pd.notna(v)}
                    evidence_items.append(self._normalize_csv_row(row_dict))
        
        except Exception as e:
            print(f"Error parsing XLS: {e}")
            raise
        
        return evidence_items
    
    def parse_ufdr(self) -> List[Dict[str, Any]]:
        """
        Parse proprietary UFDR format
        UFDR files can be JSON, XML, or custom binary format
        This method attempts to detect and parse accordingly
        """
        # First, try to determine if it's a text-based UFDR (JSON/XML wrapper)
        try:
            with open(self.file_path, 'rb') as f:
                header = f.read(512)
                
            # Check for JSON
            try:
                header_str = header.decode('utf-8').strip()
                if header_str.startswith('{') or header_str.startswith('['):
                    return self.parse_json()
            except:
                pass
            
            # Check for XML
            try:
                header_str = header.decode('utf-8').strip()
                if header_str.startswith('<'):
                    return self.parse_xml()
            except:
                pass
            
            # If binary or unknown, try to extract as JSON/XML from content
            # Many UFDR tools embed JSON or XML in their proprietary formats
            with open(self.file_path, 'rb') as f:
                content = f.read()
            
            # Try to find JSON blocks
            try:
                content_str = content.decode('utf-8', errors='ignore')
                # Look for JSON objects
                json_match = re.search(r'\{.*\}', content_str, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                    data = json.loads(json_str)
                    if isinstance(data, dict):
                        return self.parse_json_data(data)
            except:
                pass
            
            # Fallback: Try to parse as text
            return self.auto_detect_and_parse()
            
        except Exception as e:
            print(f"Error parsing UFDR: {e}")
            return []
    
    def parse_json_data(self, data: dict) -> List[Dict[str, Any]]:
        """Helper method to parse JSON data structure"""
        evidence_items = []
        
        if isinstance(data, dict):
            if 'messages' in data:
                evidence_items.extend(self._extract_messages(data['messages']))
            if 'calls' in data:
                evidence_items.extend(self._extract_calls(data['calls']))
            if 'contacts' in data:
                evidence_items.extend(self._extract_contacts(data['contacts']))
            if 'files' in data:
                evidence_items.extend(self._extract_files(data['files']))
            if 'locations' in data:
                evidence_items.extend(self._extract_locations(data['locations']))
        elif isinstance(data, list):
            for item in data:
                evidence_items.append(self._normalize_item(item))
        
        return evidence_items
    
    def _detect_encoding(self) -> str:
        """Detect file encoding using chardet"""
        if not CHARDET_AVAILABLE:
            return 'utf-8'
        
        try:
            with open(self.file_path, 'rb') as f:
                raw_data = f.read(10000)  # Read first 10KB
                result = chardet.detect(raw_data)
                return result['encoding'] or 'utf-8'
        except:
            return 'utf-8'
    
    def auto_detect_and_parse(self) -> List[Dict[str, Any]]:
        """Auto-detect file format and parse with improved detection"""
        try:
            with open(self.file_path, 'rb') as f:
                content = f.read(8192)  # Read more for better detection
            
            # Detect encoding
            encoding = self._detect_encoding()
            
            # Try to decode and detect format
            try:
                content_str = content.decode(encoding, errors='ignore').strip()
                
                # JSON detection
                if content_str.startswith('{') or content_str.startswith('['):
                    return self.parse_json()
                
                # XML detection
                elif content_str.startswith('<') or '<?xml' in content_str[:100]:
                    return self.parse_xml()
                
                # Check if it looks like Excel binary
                elif content[:8] == b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1':  # OLE2 signature (XLS)
                    return self.parse_xls()
                
                elif content[:4] == b'PK\x03\x04':  # ZIP signature (XLSX)
                    return self.parse_xlsx()
                
                # Tab-separated detection
                elif '\t' in content_str[:1000] and content_str.count('\t') > content_str.count(','):
                    return self.parse_tsv()
                
                # CSV detection (fallback for text files)
                elif ',' in content_str[:1000]:
                    return self.parse_csv()
                
                # Try as JSON embedded in text
                else:
                    json_match = re.search(r'\{.*\}', content_str[:2000], re.DOTALL)
                    if json_match:
                        try:
                            data = json.loads(json_match.group(0))
                            return self.parse_json_data(data)
                        except:
                            pass
                    
                    # Last resort: try CSV
                    return self.parse_csv()
                    
            except Exception as e:
                print(f"Error in content detection: {e}")
                # Final fallback
                return self.parse_csv()
                
        except Exception as e:
            print(f"Error in auto-detection: {e}")
            return []
    
    # Helper methods for extracting different evidence types
    
    def _extract_messages(self, messages: List[Dict]) -> List[Dict[str, Any]]:
        """Extract message evidence"""
        items = []
        for msg in messages:
            item = {
                'type': 'message',
                'source': msg.get('app', msg.get('source', 'Unknown')),
                'content': msg.get('text', msg.get('content', '')),
                'timestamp': self._parse_timestamp(msg.get('timestamp', msg.get('date', ''))),
                'metadata': {
                    'sender': msg.get('sender', msg.get('from', '')),
                    'receiver': msg.get('receiver', msg.get('to', '')),
                    'direction': msg.get('direction', 'unknown'),
                },
                'entities': self._extract_entities(msg.get('text', msg.get('content', ''))),
            }
            items.append(item)
        return items
    
    def _extract_calls(self, calls: List[Dict]) -> List[Dict[str, Any]]:
        """Extract call log evidence"""
        items = []
        for call in calls:
            item = {
                'type': 'call',
                'source': 'Call Log',
                'content': f"Call with {call.get('number', 'Unknown')} - Duration: {call.get('duration', 0)}s",
                'timestamp': self._parse_timestamp(call.get('timestamp', call.get('date', ''))),
                'metadata': {
                    'number': call.get('number', ''),
                    'duration': call.get('duration', 0),
                    'type': call.get('type', 'unknown'),  # incoming, outgoing, missed
                },
                'entities': [{'type': 'Phone', 'value': call.get('number', '')}],
            }
            items.append(item)
        return items
    
    def _extract_contacts(self, contacts: List[Dict]) -> List[Dict[str, Any]]:
        """Extract contact information"""
        items = []
        for contact in contacts:
            item = {
                'type': 'contact',
                'source': 'Contacts',
                'content': f"{contact.get('name', 'Unknown')} - {contact.get('phone', '')}",
                'timestamp': datetime.now().isoformat(),
                'metadata': contact,
                'entities': [
                    {'type': 'Person', 'value': contact.get('name', '')},
                    {'type': 'Phone', 'value': contact.get('phone', '')},
                ],
            }
            items.append(item)
        return items
    
    def _extract_files(self, files: List[Dict]) -> List[Dict[str, Any]]:
        """Extract file metadata"""
        items = []
        for file_info in files:
            item = {
                'type': self._determine_file_type(file_info.get('name', '')),
                'source': file_info.get('name', 'Unknown'),
                'content': file_info.get('description', f"File: {file_info.get('name', '')}"),
                'timestamp': self._parse_timestamp(file_info.get('modified', file_info.get('created', ''))),
                'sha256': file_info.get('hash', file_info.get('sha256', '')),
                'metadata': file_info,
                'entities': self._extract_entities_from_file(file_info),
            }
            items.append(item)
        return items
    
    def _extract_locations(self, locations: List[Dict]) -> List[Dict[str, Any]]:
        """Extract location data"""
        items = []
        for loc in locations:
            # Get address or format coordinates as fallback
            address = loc.get('address')
            
            # Safely extract latitude and longitude
            try:
                lat = float(loc.get('lat', loc.get('latitude', 0)))
                lon = float(loc.get('lon', loc.get('longitude', 0)))
            except (ValueError, TypeError):
                lat = None
                lon = None
            
            if not address:
                if lat is not None and lon is not None:
                    address = f'{lat}, {lon}'
                else:
                    address = 'Unknown location'
            
            item = {
                'type': 'location',
                'source': 'GPS Data',
                'content': f"Location: {address}",
                'timestamp': self._parse_timestamp(loc.get('timestamp', '')),
                'latitude': lat,
                'longitude': lon,
                'metadata': loc,
                'entities': [{'type': 'GPS', 'value': f'{lat}, {lon}'}] if lat is not None else [],
            }
            items.append(item)
        return items
    
    def _normalize_item(self, item: Dict) -> Dict[str, Any]:
        """Normalize a generic item to evidence format"""
        return {
            'type': item.get('type', 'log'),
            'source': item.get('source', 'Unknown'),
            'content': item.get('content', item.get('text', str(item))),
            'timestamp': self._parse_timestamp(item.get('timestamp', item.get('date', ''))),
            'metadata': item,
            'entities': self._extract_entities(item.get('content', item.get('text', ''))),
        }
    
    def _parse_xml_message(self, element: ET.Element) -> Dict[str, Any]:
        """Parse XML message element"""
        return {
            'type': 'message',
            'source': element.get('app', 'Unknown'),
            'content': element.findtext('text', ''),
            'timestamp': self._parse_timestamp(element.findtext('timestamp', '')),
            'metadata': {
                'sender': element.findtext('sender', ''),
                'receiver': element.findtext('receiver', ''),
            },
            'entities': self._extract_entities(element.findtext('text', '')),
        }
    
    def _parse_xml_call(self, element: ET.Element) -> Dict[str, Any]:
        """Parse XML call element"""
        number = element.findtext('number', '')
        duration = element.findtext('duration', '0')
        return {
            'type': 'call',
            'source': 'Call Log',
            'content': f"Call with {number} - Duration: {duration}s",
            'timestamp': self._parse_timestamp(element.findtext('timestamp', '')),
            'metadata': {
                'number': number,
                'duration': duration,
                'type': element.get('type', 'unknown'),
            },
            'entities': [{'type': 'Phone', 'value': number}],
        }
    
    def _parse_xml_file(self, element: ET.Element) -> Dict[str, Any]:
        """Parse XML file element"""
        filename = element.findtext('name', 'Unknown')
        return {
            'type': self._determine_file_type(filename),
            'source': filename,
            'content': element.findtext('description', f"File: {filename}"),
            'timestamp': self._parse_timestamp(element.findtext('modified', '')),
            'sha256': element.findtext('hash', ''),
            'metadata': {k: v.text for k, v in element.items()},
            'entities': [],
        }
    
    def _normalize_csv_row(self, row: Dict) -> Dict[str, Any]:
        """Normalize CSV row to evidence format"""
        return {
            'type': row.get('type', 'log'),
            'source': row.get('source', row.get('app', 'Unknown')),
            'content': row.get('content', row.get('text', '')),
            'timestamp': self._parse_timestamp(row.get('timestamp', row.get('date', ''))),
            'metadata': row,
            'entities': self._extract_entities(row.get('content', row.get('text', ''))),
        }
    
    def _parse_timestamp(self, timestamp_str: str) -> str:
        """Parse various timestamp formats to ISO format"""
        if not timestamp_str:
            return datetime.now().isoformat()
        
        # Try common formats
        formats = [
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%d/%m/%Y %H:%M:%S',
            '%m/%d/%Y %H:%M:%S',
            '%Y%m%d%H%M%S',
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(timestamp_str, fmt)
                return dt.isoformat()
            except:
                continue
        
        # If all else fails, return current time
        return datetime.now().isoformat()
    
    def _determine_file_type(self, filename: str) -> str:
        """Determine file type from extension"""
        ext = filename.split('.')[-1].lower()
        
        image_exts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
        video_exts = ['mp4', 'avi', 'mov', 'mkv', 'wmv']
        
        if ext in image_exts:
            return 'image'
        elif ext in video_exts:
            return 'video'
        else:
            return 'file'
    
    def _extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Extract entities from text using regex patterns"""
        if not text:
            return []
        
        entities = []
        
        # Phone numbers
        phone_pattern = r'\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
        for match in re.finditer(phone_pattern, text):
            entities.append({'type': 'Phone', 'value': match.group()})
        
        # Email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entities.append({'type': 'Email', 'value': match.group()})
        
        # Crypto addresses (Bitcoin-like)
        crypto_pattern = r'\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|0x[a-fA-F0-9]{40}'
        for match in re.finditer(crypto_pattern, text):
            entities.append({'type': 'Crypto', 'value': match.group()})
        
        # IP addresses
        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
        for match in re.finditer(ip_pattern, text):
            entities.append({'type': 'IP Address', 'value': match.group()})
        
        # URLs
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&/=]*)'
        for match in re.finditer(url_pattern, text):
            entities.append({'type': 'URL', 'value': match.group()})
        
        # Amounts (currency)
        amount_pattern = r'[$£€¥]\s?\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s?(?:USD|EUR|GBP|INR|BTC|ETH)'
        for match in re.finditer(amount_pattern, text, re.IGNORECASE):
            entities.append({'type': 'Amount', 'value': match.group()})
        
        return entities
    
    def _extract_entities_from_file(self, file_info: Dict) -> List[Dict[str, str]]:
        """Extract entities from file metadata"""
        entities = []
        
        # GPS data in EXIF
        if 'exif' in file_info:
            exif = file_info['exif']
            if 'gps' in exif:
                entities.append({
                    'type': 'GPS',
                    'value': f'{exif["gps"].get("lat", 0)}, {exif["gps"].get("lon", 0)}'
                })
        
        return entities

