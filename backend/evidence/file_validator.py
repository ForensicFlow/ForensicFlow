"""
File Validator for UFDR and Evidence Files
Validates file format, size, and content before processing
"""
import os
from typing import Tuple, Optional

# Optional imports
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False


class FileValidator:
    """
    Validates uploaded files for security and compatibility
    """
    
    # Supported file extensions
    SUPPORTED_EXTENSIONS = {
        'json', 'xml', 'csv', 'tsv', 
        'xlsx', 'xls', 'ufdr', 'txt'
    }
    
    # Allowed MIME types
    ALLOWED_MIME_TYPES = {
        'application/json',
        'text/json',
        'application/xml',
        'text/xml',
        'text/csv',
        'text/tab-separated-values',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # XLSX
        'application/vnd.ms-excel',  # XLS
        'text/plain',
        'application/octet-stream',  # Generic binary (for UFDR)
    }
    
    # Maximum file size (500MB default)
    MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB in bytes
    
    @classmethod
    def validate_file(cls, file_path: str, original_filename: str = None) -> Tuple[bool, Optional[str]]:
        """
        Validate file for upload
        
        Args:
            file_path: Path to the file to validate
            original_filename: Original filename (optional)
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check if file exists
        if not os.path.exists(file_path):
            return False, "File does not exist"
        
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return False, "File is empty"
        
        if file_size > cls.MAX_FILE_SIZE:
            size_mb = cls.MAX_FILE_SIZE / (1024 * 1024)
            return False, f"File size exceeds maximum allowed size of {size_mb}MB"
        
        # Check file extension
        filename = original_filename or os.path.basename(file_path)
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        
        if extension not in cls.SUPPORTED_EXTENSIONS:
            return False, f"Unsupported file extension: .{extension}. Supported: {', '.join(cls.SUPPORTED_EXTENSIONS)}"
        
        # Check MIME type (if python-magic is available)
        try:
            mime_type = cls._get_mime_type(file_path)
            if mime_type and mime_type not in cls.ALLOWED_MIME_TYPES:
                # Allow some flexibility for UFDR and text-based formats
                if not (mime_type.startswith('text/') or extension in ['ufdr', 'json', 'xml']):
                    return False, f"Invalid file type: {mime_type}"
        except Exception as e:
            # If MIME detection fails, continue with extension-based validation
            print(f"MIME type detection failed: {e}")
        
        # Validate file content structure
        is_valid, error = cls._validate_content(file_path, extension)
        if not is_valid:
            return False, error
        
        return True, None
    
    @classmethod
    def _get_mime_type(cls, file_path: str) -> Optional[str]:
        """Get MIME type using python-magic or mimetypes"""
        # Try python-magic first (if available)
        if MAGIC_AVAILABLE:
            try:
                mime = magic.Magic(mime=True)
                return mime.from_file(file_path)
            except Exception as e:
                # If magic fails, fall through to mimetypes
                pass
        
        # Fallback to standard library mimetypes
        try:
            import mimetypes
            mime_type, _ = mimetypes.guess_type(file_path)
            return mime_type
        except:
            return None
    
    @classmethod
    def _validate_content(cls, file_path: str, extension: str) -> Tuple[bool, Optional[str]]:
        """
        Validate file content structure
        """
        try:
            # Read first few bytes
            with open(file_path, 'rb') as f:
                header = f.read(8192)
            
            # JSON validation
            if extension == 'json':
                try:
                    import json
                    with open(file_path, 'r', encoding='utf-8') as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    return False, f"Invalid JSON format: {str(e)}"
                except UnicodeDecodeError:
                    # Try other encodings
                    try:
                        with open(file_path, 'r', encoding='latin-1') as f:
                            json.load(f)
                    except:
                        return False, "Invalid JSON encoding"
            
            # XML validation
            elif extension == 'xml':
                try:
                    import xml.etree.ElementTree as ET
                    ET.parse(file_path)
                except ET.ParseError as e:
                    return False, f"Invalid XML format: {str(e)}"
            
            # CSV/TSV validation
            elif extension in ['csv', 'tsv']:
                try:
                    import csv
                    delimiter = '\t' if extension == 'tsv' else ','
                    with open(file_path, 'r', encoding='utf-8') as f:
                        reader = csv.reader(f, delimiter=delimiter)
                        # Try to read first row
                        next(reader, None)
                except Exception as e:
                    return False, f"Invalid {extension.upper()} format: {str(e)}"
            
            # Excel validation
            elif extension in ['xlsx', 'xls']:
                try:
                    import pandas as pd
                    # Try to read first sheet
                    pd.read_excel(file_path, nrows=1)
                except Exception as e:
                    return False, f"Invalid Excel format: {str(e)}"
            
            # UFDR - check if it contains recognizable data
            elif extension == 'ufdr':
                # UFDR can be various formats, so we're lenient
                # Just check if it's not completely binary garbage
                try:
                    header_str = header.decode('utf-8', errors='ignore')
                    # Check if it contains some recognizable patterns
                    if any(pattern in header_str for pattern in ['{', '<', 'messages', 'calls', 'evidence']):
                        return True, None
                    # Allow if it's binary
                    return True, None
                except:
                    return True, None  # Be permissive with UFDR
            
            return True, None
            
        except Exception as e:
            return False, f"Content validation failed: {str(e)}"
    
    @classmethod
    def get_file_info(cls, file_path: str) -> dict:
        """
        Get file information
        
        Returns:
            Dictionary with file information
        """
        if not os.path.exists(file_path):
            return {}
        
        file_size = os.path.getsize(file_path)
        filename = os.path.basename(file_path)
        extension = filename.split('.')[-1].lower() if '.' in filename else ''
        
        info = {
            'filename': filename,
            'extension': extension,
            'size_bytes': file_size,
            'size_mb': round(file_size / (1024 * 1024), 2),
            'mime_type': cls._get_mime_type(file_path),
            'is_supported': extension in cls.SUPPORTED_EXTENSIONS,
        }
        
        return info
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """
        Sanitize filename to prevent security issues
        
        Args:
            filename: Original filename
        
        Returns:
            Sanitized filename
        """
        # Remove path components
        filename = os.path.basename(filename)
        
        # Remove or replace dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|', '\0']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        # Limit length
        if len(filename) > 255:
            name, ext = os.path.splitext(filename)
            filename = name[:250] + ext
        
        return filename

