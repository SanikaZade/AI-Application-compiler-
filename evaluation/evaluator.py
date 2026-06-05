import time
from typing import Dict, Any, List
from intent_extractor.extractor import IntentExtractor
from architecture_planner.planner import ArchitecturePlanner
from schema_generator.generator import SchemaGenerator
from validator.validator import ValidationEngine
from repair_engine.repair import RepairEngine
from runtime_checker.checker import RuntimeChecker
from evaluation.test_prompts import NORMAL_PROMPTS, EDGE_CASE_PROMPTS

class Evaluator:
    @staticmethod
    def run_single(prompt: str) -> Dict[str, Any]:
        start_time = time.perf_counter()
        
        # Stage 1: Intent Extraction
        t1 = time.perf_counter()
        intent = IntentExtractor.extract(prompt)
        time_intent = (time.perf_counter() - t1) * 1000

        # Stage 2: Architecture Planner
        t2 = time.perf_counter()
        architecture = ArchitecturePlanner.plan(intent)
        time_arch = (time.perf_counter() - t2) * 1000

        # Stage 3: Schema Generator (always introduce drift for testing validation + repair)
        t3 = time.perf_counter()
        # If it's a vague/failed intent, don't generate drift to avoid noise
        is_vague = intent.get("status") == "vague_input"
        schemas = SchemaGenerator.generate(intent, architecture, introduce_drift=not is_vague)
        time_schema = (time.perf_counter() - t3) * 1000

        # Stage 4: Validation Engine
        t4 = time.perf_counter()
        validation = ValidationEngine.validate(schemas, intent.get("roles", []))
        time_val = (time.perf_counter() - t4) * 1000

        # Stage 5: Repair Engine
        t5 = time.perf_counter()
        repair_result = RepairEngine.repair(schemas, validation)
        repaired_schemas = repair_result.get("repaired_schemas", schemas)
        repairs = repair_result.get("repairs", [])
        time_rep = (time.perf_counter() - t5) * 1000

        # Stage 6: Runtime Verification (Run on Repaired Schemas!)
        t6 = time.perf_counter()
        runtime = RuntimeChecker.verify(repaired_schemas)
        time_run = (time.perf_counter() - t6) * 1000

        total_time_ms = (time.perf_counter() - start_time) * 1000

        return {
            "success": intent.get("success", False) and runtime.get("success", False),
            "intent": intent,
            "architecture": architecture,
            "schemas": schemas,
            "repaired_schemas": repaired_schemas,
            "validation_report": validation,
            "repair_report": {
                "repairs": repairs,
                "repaired": len(repairs) > 0
            },
            "runtime_report": runtime,
            "metrics": {
                "intent_ms": time_intent,
                "architecture_ms": time_arch,
                "schema_ms": time_schema,
                "validation_ms": time_val,
                "repair_ms": time_rep,
                "runtime_ms": time_run,
                "total_ms": total_time_ms,
                "errors_count": len(validation.get("errors", [])),
                "warnings_count": len(validation.get("warnings", [])),
                "repairs_count": len(repairs)
            }
        }

    @classmethod
    def run_suite(cls) -> Dict[str, Any]:
        results = []
        
        # Combine normal and edge-case prompts
        all_test_prompts = []
        for p in NORMAL_PROMPTS:
            all_test_prompts.append({"id": p["id"], "name": p["name"], "prompt": p["prompt"], "type": "normal"})
        for p in EDGE_CASE_PROMPTS:
            all_test_prompts.append({"id": p["id"], "name": p["name"], "prompt": p["prompt"], "type": "edge_case"})

        total_errors = 0
        total_warnings = 0
        total_repairs = 0
        total_time = 0.0
        success_count = 0

        for test in all_test_prompts:
            run_res = cls.run_single(test["prompt"])
            
            # Record individual run stats
            metrics = run_res["metrics"]
            total_errors += metrics["errors_count"]
            total_warnings += metrics["warnings_count"]
            total_repairs += metrics["repairs_count"]
            total_time += metrics["total_ms"]
            
            is_success = run_res["success"]
            if is_success:
                success_count += 1

            results.append({
                "id": test["id"],
                "name": test["name"],
                "type": test["type"],
                "prompt": test["prompt"],
                "success": is_success,
                "errors_count": metrics["errors_count"],
                "warnings_count": metrics["warnings_count"],
                "repairs_count": metrics["repairs_count"],
                "duration_ms": metrics["total_ms"]
            })

        total_runs = len(all_test_prompts)
        avg_time = total_time / total_runs if total_runs > 0 else 0

        return {
            "summary": {
                "total_runs": total_runs,
                "success_count": success_count,
                "failure_count": total_runs - success_count,
                "success_rate": (success_count / total_runs) * 100 if total_runs > 0 else 0,
                "total_validation_errors": total_errors,
                "total_validation_warnings": total_warnings,
                "total_repairs_applied": total_repairs,
                "avg_generation_time_ms": avg_time
            },
            "runs": results
        }
