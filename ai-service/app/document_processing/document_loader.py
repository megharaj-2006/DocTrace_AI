"""Document loader handling single-image files and multi-page PDF rendering."""

import os
import tempfile
from typing import List, Tuple
from PIL import Image

from app.core.config import settings
from app.core.exceptions import InvalidInputException, ProcessingException
from app.core.logging import logger

try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None


class DocumentLoader:
    """Loads document images or renders PDF pages into temporary image files."""

    def __init__(self, temp_dir: str = None):
        self.temp_dir = temp_dir or settings.TEMP_DIR or None

    def load_document_pages(self, file_path: str) -> Tuple[List[Tuple[int, str]], List[str]]:
        """Load input document into a list of tuples: (page_number, temp_image_path).

        Returns:
            Tuple containing:
            - List of (page_number, temp_image_path)
            - List of created temporary files to be cleaned up later
        """
        ext = os.path.splitext(file_path)[1].lower()
        created_temp_files: List[str] = []
        page_entries: List[Tuple[int, str]] = []

        try:
            if ext in {".jpg", ".jpeg", ".png"}:
                # Single page image input with corruption validation
                try:
                    with Image.open(file_path) as img:
                        img.verify()

                    with Image.open(file_path) as img:
                        with tempfile.NamedTemporaryFile(
                            delete=False, suffix=".png", dir=self.temp_dir
                        ) as tmp:
                            img_copy_path = tmp.name
                            img.save(img_copy_path, format="PNG")
                            created_temp_files.append(img_copy_path)
                            page_entries.append((1, img_copy_path))
                except InvalidInputException:
                    raise
                except Exception as img_err:
                    raise InvalidInputException(f"Failed to open or process corrupted image document: {str(img_err)}")

            elif ext == ".pdf":
                if pdfium is None:
                    raise ProcessingException("pypdfium2 is required for PDF rendering but is not installed.")

                pdf = None
                try:
                    pdf = pdfium.PdfDocument(file_path)
                    num_pages = len(pdf)
                    if num_pages == 0:
                        raise InvalidInputException("PDF document contains 0 pages.")

                    logger.info("Rendering %d PDF pages from file '%s'", num_pages, file_path)

                    for page_idx in range(num_pages):
                        page_num = page_idx + 1
                        page = pdf[page_idx]
                        # Render page at 200 DPI (approx scale 2.77) for crisp OCR/layout quality
                        image = page.render(scale=200 / 72).to_pil()

                        with tempfile.NamedTemporaryFile(
                            delete=False, suffix=f"_page_{page_num}.png", dir=self.temp_dir
                        ) as tmp:
                            page_img_path = tmp.name
                            image.save(page_img_path, format="PNG")
                            created_temp_files.append(page_img_path)
                            page_entries.append((page_num, page_img_path))
                except (InvalidInputException, ProcessingException):
                    raise
                except (IOError, OSError) as pdf_err:
                    raise InvalidInputException(f"Failed to open or render corrupted PDF document: {str(pdf_err)}")
                except Exception as pdf_err:
                    if "corrupt" in str(pdf_err).lower() or "pdf" in str(pdf_err).lower():
                        raise InvalidInputException(f"Failed to open or render corrupted PDF document: {str(pdf_err)}")
                    raise
                finally:
                    if pdf is not None:
                        try:
                            pdf.close()
                        except Exception:
                            pass

            else:
                raise InvalidInputException(f"Unsupported file format: {ext}")

            return page_entries, created_temp_files

        except InvalidInputException:
            self.cleanup_temp_files(created_temp_files)
            raise
        except Exception as err:
            self.cleanup_temp_files(created_temp_files)
            logger.error("Error loading document pages from '%s': %s", file_path, str(err), exc_info=True)
            raise ProcessingException(f"Failed to load document pages: {str(err)}") from err

    @staticmethod
    def cleanup_temp_files(temp_files: List[str]) -> None:
        """Safely delete created temporary page images."""
        for path in temp_files:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                    logger.debug("Deleted temporary page image: %s", path)
                except Exception as err:
                    logger.warning("Failed to delete temp page image '%s': %s", path, str(err))
