from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import datetime
from backend.database import get_db
from backend.models import EvaluationSummary
from evaluation.evaluator import Evaluator

router = APIRouter(prefix="/api/evaluate", tags=["evaluation"])

@router.post("/run")
def run_evaluation(db: Session = Depends(get_db)):
    try:
        suite_res = Evaluator.run_suite()
        summary = suite_res["summary"]
        runs = suite_res["runs"]

        # Store in database
        db_eval = EvaluationSummary(
            created_at=datetime.datetime.utcnow(),
            total_runs=summary["total_runs"],
            success_rate=summary["success_rate"],
            avg_time_ms=summary["avg_generation_time_ms"],
            total_repairs=summary["total_repairs_applied"],
            detail_json=json.dumps(runs)
        )
        
        db.add(db_eval)
        db.commit()
        db.refresh(db_eval)

        return {
            "evaluation_id": db_eval.id,
            "created_at": db_eval.created_at.isoformat(),
            "summary": summary,
            "runs": runs
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to execute evaluation suite: {str(e)}")

@router.get("/latest")
def get_latest_evaluation(db: Session = Depends(get_db)):
    latest = db.query(EvaluationSummary).order_by(EvaluationSummary.created_at.desc()).first()
    if not latest:
        # If no evaluation exists yet, return empty placeholder or run it automatically?
        # Let's return a clean 404 so the UI can offer a "Run Evaluation" trigger
        raise HTTPException(status_code=404, detail="No evaluation runs recorded yet. Use POST /api/evaluate/run to trigger.")
    
    try:
        runs = json.loads(latest.detail_json) if latest.detail_json else []
    except:
        runs = []

    return {
        "evaluation_id": latest.id,
        "created_at": latest.created_at.isoformat(),
        "summary": {
            "total_runs": latest.total_runs,
            "success_rate": latest.success_rate,
            "avg_generation_time_ms": latest.avg_time_ms,
            "total_repairs_applied": latest.total_repairs,
            "success_count": int(latest.total_runs * (latest.success_rate / 100)),
            "failure_count": latest.total_runs - int(latest.total_runs * (latest.success_rate / 100))
        },
        "runs": runs
    }

@router.get("/history")
def get_evaluation_history(db: Session = Depends(get_db)):
    evals = db.query(EvaluationSummary).order_by(EvaluationSummary.created_at.desc()).limit(10).all()
    history = []
    for e in evals:
        history.append({
            "evaluation_id": e.id,
            "created_at": e.created_at.isoformat(),
            "total_runs": e.total_runs,
            "success_rate": e.success_rate,
            "avg_generation_time_ms": e.avg_time_ms,
            "total_repairs_applied": e.total_repairs
        })
    return history
