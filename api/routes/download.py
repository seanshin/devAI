"""Download and export API routes"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import io
import zipfile
import os
from typing import Optional
from datetime import datetime


router = APIRouter(prefix="/api/download", tags=["download"])


class DownloadRequest(BaseModel):
    """Request to download results"""
    run_id: str
    format: Optional[str] = "zip"  # zip, tar, json


@router.get("/results/{run_id}")
async def download_results(run_id: str, format: str = "zip"):
    """
    Download execution results

    Args:
        run_id: Run ID to download
        format: Download format (zip, tar, json)

    Returns:
        File stream
    """
    try:
        # Create in-memory ZIP file
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add metadata
            metadata = {
                "run_id": run_id,
                "downloaded_at": datetime.now().isoformat(),
                "version": "1.0",
            }
            zip_file.writestr("metadata.json", str(metadata))

            # Add sample files
            zip_file.writestr("README.md", "# Generated Files\n\nthis is a sample.")
            zip_file.writestr("output.log", "Generated output log")

        zip_buffer.seek(0)

        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=results-{run_id}.zip"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/{run_id}")
async def export_execution(run_id: str):
    """
    Export execution data as JSON

    Args:
        run_id: Run ID to export

    Returns:
        JSON data
    """
    try:
        # Return sample data
        return {
            "run_id": run_id,
            "status": "completed",
            "duration": 120,
            "output": "Sample execution output",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
