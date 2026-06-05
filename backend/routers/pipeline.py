from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import json
import datetime
from typing import Dict, Any, List
from pydantic import BaseModel
from backend.database import get_db
from backend.models import PipelineRun
from evaluation.evaluator import Evaluator

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

class RunRequest(BaseModel):
    prompt: str

@router.post("/run")
def run_pipeline(req: RunRequest, db: Session = Depends(get_db)):
    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        # Run through the evaluator pipeline
        run_res = Evaluator.run_single(prompt)
        
        # Prepare database record
        run_id = str(uuid.uuid4())
        intent = run_res["intent"]
        metrics = run_res["metrics"]
        
        # Serialize fields for SQLite storage
        result_payload = {
            "intent": intent,
            "architecture": run_res["architecture"],
            "schemas": run_res["schemas"],
            "repaired_schemas": run_res["repaired_schemas"],
            "validation_report": run_res["validation_report"],
            "repair_report": run_res["repair_report"],
            "runtime_report": run_res["runtime_report"]
        }

        db_run = PipelineRun(
            id=run_id,
            prompt=prompt,
            app_name=intent.get("app_name", "Application"),
            domain=intent.get("extracted_domain", "general"),
            status=intent.get("status", "success"),
            created_at=datetime.datetime.utcnow(),
            result_json=json.dumps(result_payload),
            metrics_json=json.dumps(metrics)
        )
        
        db.add(db_run)
        db.commit()
        db.refresh(db_run)

        return {
            "run_id": run_id,
            "prompt": prompt,
            "app_name": db_run.app_name,
            "domain": db_run.domain,
            "status": db_run.status,
            "created_at": db_run.created_at.isoformat(),
            "stages": {
                "intent": {
                    "status": "done",
                    "data": intent,
                    "duration_ms": metrics["intent_ms"]
                },
                "architecture": {
                    "status": "done",
                    "data": run_res["architecture"],
                    "duration_ms": metrics["architecture_ms"]
                },
                "schema": {
                    "status": "done",
                    "data": run_res["schemas"],
                    "duration_ms": metrics["schema_ms"]
                },
                "validation": {
                    "status": "done",
                    "data": run_res["validation_report"],
                    "duration_ms": metrics["validation_ms"]
                },
                "repair": {
                    "status": "done",
                    "data": run_res["repair_report"],
                    "duration_ms": metrics["repair_ms"]
                },
                "runtime": {
                    "status": "done",
                    "data": run_res["runtime_report"],
                    "duration_ms": metrics["runtime_ms"]
                }
            },
            "output": run_res["repaired_schemas"],
            "metrics": metrics
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Pipeline processing failed: {str(e)}")

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    runs = db.query(PipelineRun).order_by(PipelineRun.created_at.desc()).limit(20).all()
    history = []
    for r in runs:
        try:
            metrics = json.loads(r.metrics_json) if r.metrics_json else {}
        except:
            metrics = {}
        history.append({
            "run_id": r.id,
            "prompt": r.prompt,
            "app_name": r.app_name,
            "domain": r.domain,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "metrics": metrics
        })
    return history

@router.get("/runs/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run record not found.")
    
    try:
        result = json.loads(run.result_json) if run.result_json else {}
        metrics = json.loads(run.metrics_json) if run.metrics_json else {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse database records: {str(e)}")

    return {
        "run_id": run.id,
        "prompt": run.prompt,
        "app_name": run.app_name,
        "domain": run.domain,
        "status": run.status,
        "created_at": run.created_at.isoformat(),
        "result": result,
        "metrics": metrics
    }
