from sqlalchemy import Column, Integer, String, Float, DateTime, Text
import datetime
from backend.database import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(String(50), primary_key=True, index=True)
    prompt = Column(Text, nullable=False)
    app_name = Column(String(100), nullable=True)
    domain = Column(String(50), nullable=True)
    status = Column(String(20), nullable=False) # success, vague, fail
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store complete execution config and metrics as JSON strings
    result_json = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)

class EvaluationSummary(Base):
    __tablename__ = "evaluation_summaries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    total_runs = Column(Integer, nullable=False)
    success_rate = Column(Float, nullable=False)
    avg_time_ms = Column(Float, nullable=False)
    total_repairs = Column(Integer, nullable=False)
    
    # Complete JSON detailing each individual test run outcome
    detail_json = Column(Text, nullable=True)
