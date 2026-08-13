"""File validator component for document format, size, and integrity checking."""

import os
from typing import Set
from app.core.exceptions import InvalidInputException

SUPPORTED_EXTENSIONS: Set[str] = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB max limit for CPU/free tier safety


class FileValidator:
    """Validates document format, size, and basic readability."""

    def __init__(
        self,
        allowed_extensions: Set[str] = SUPPORTED_EXTENSIONS,
        max_file_size: int = MAX_FILE_SIZE_BYTES,
    ):
        self.allowed_extensions = allowed_extensions
        self.max_file_size = max_file_size

    def validate_file(self, file_path: str) -> str:
        """Validate input file path and return normalized format extension."""
        if not os.path.exists(file_path):
            raise InvalidInputException(f"File not found: {file_path}")

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise InvalidInputException("Uploaded file is empty (0 bytes).")

        if file_size > self.max_file_size:
            max_mb = self.max_file_size / (1024 * 1024)
            raise InvalidInputException(f"File size exceeds maximum allowed limit of {max_mb:.1f} MB.")

        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.allowed_extensions:
            allowed_str = ", ".join(sorted(self.allowed_extensions))
            raise InvalidInputException(
                f"Unsupported document format '{ext}'. Supported formats: {allowed_str}"
            )

        return ext
