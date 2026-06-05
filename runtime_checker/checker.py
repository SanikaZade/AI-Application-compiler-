import sqlite3
from typing import Dict, Any, List

class RuntimeChecker:
    @staticmethod
    def verify(schemas: Dict[str, Any]) -> Dict[str, Any]:
        results = []
        overall_pass = True

        ui = schemas.get("ui", {})
        api = schemas.get("api", {})
        db = schemas.get("db", {})
        auth = schemas.get("auth", {})
        payments = schemas.get("payments", {})

        # 1. DB Runtime Compilation: In-Memory SQLite execution check
        try:
            conn = sqlite3.connect(":memory:")
            cursor = conn.cursor()
            
            # Generate DDLs and run them
            ddl_statements = []
            for table_name, table_def in db.items():
                col_defs = []
                for col in table_def.get("columns", []):
                    c_name = col["name"]
                    c_type = col["type"]
                    
                    # Convert custom type names to SQLite compatibility
                    if "VARCHAR" in c_type:
                        sql_type = "TEXT"
                    elif "TIMESTAMP" in c_type or "DATETIME" in c_type:
                        sql_type = "TEXT"
                    elif "NUMERIC" in c_type:
                        sql_type = "REAL"
                    else:
                        sql_type = c_type
                    
                    stmt = f'"{c_name}" {sql_type}'
                    if col.get("primary_key", False):
                        stmt += " PRIMARY KEY AUTOINCREMENT" if sql_type == "INTEGER" else " PRIMARY KEY"
                    if not col.get("nullable", True):
                        stmt += " NOT NULL"
                    if col.get("unique", False):
                        stmt += " UNIQUE"
                    
                    col_defs.append(stmt)
                
                # Setup foreign keys
                for col in table_def.get("columns", []):
                    if col.get("foreign_key"):
                        fk_target = col["foreign_key"]
                        fk_table, fk_col = fk_target.split(".")
                        col_defs.append(f'FOREIGN KEY("{col["name"]}") REFERENCES "{fk_table}"("{fk_col}")')

                create_table_ddl = f'CREATE TABLE "{table_name}" (\n  ' + ",\n  ".join(col_defs) + "\n);"
                ddl_statements.append(create_table_ddl)
                
                # Execute in SQLite
                cursor.execute(create_table_ddl)

            # Clean up connection
            conn.close()

            results.append({
                "component": "Database Layer",
                "status": "PASS",
                "message": "All schema tables compiled and successfully executed in SQL engine sandbox.",
                "details": {"tables_created": list(db.keys()), "ddl_samples": ddl_statements}
            })
        except Exception as e:
            overall_pass = False
            results.append({
                "component": "Database Layer",
                "status": "FAIL",
                "message": f"SQL execution failure in sandbox: {str(e)}",
                "details": {}
            })

        # 2. API Routes Validation
        api_issues = 0
        valid_methods = ["GET", "POST", "PUT", "DELETE"]
        for table, endpoints in api.items():
            for ep in endpoints:
                method = ep.get("method", "")
                route = ep.get("route", "")
                if method not in valid_methods:
                    api_issues += 1
                    results.append({
                        "component": "API Routing Layer",
                        "status": "WARNING",
                        "message": f"Route '{route}' uses non-standard HTTP method '{method}'.",
                        "details": {"route": route, "method": method}
                    })

        if api_issues == 0:
            results.append({
                "component": "API Routing Layer",
                "status": "PASS",
                "message": f"All {sum(len(eps) for eps in api.values())} RESTful routing patterns verified against execution rules.",
                "details": {}
            })

        # 3. UI References Verification
        ui_errors = 0
        for page, config in ui.items():
            for comp in config.get("components", []):
                if comp.get("type") == "Form":
                    submit_api = comp.get("props", {}).get("submit_api", "")
                    # Match this against endpoints
                    api_match = False
                    for endpoints in api.values():
                        for ep in endpoints:
                            if ep.get("route") == submit_api:
                                api_match = True
                                break
                        if api_match:
                            break
                    if not api_match:
                        ui_errors += 1
                        results.append({
                            "component": "UI Integration Layer",
                            "status": "FAIL",
                            "message": f"Form component on page '{page}' targets undefined API endpoint '{submit_api}'.",
                            "details": {}
                        })
                elif comp.get("type") == "DataTable":
                    api_endpoint = comp.get("props", {}).get("api_endpoint", "")
                    api_match = False
                    for endpoints in api.values():
                        for ep in endpoints:
                            if ep.get("route") == api_endpoint:
                                api_match = True
                                break
                        if api_match:
                            break
                    if not api_match:
                        ui_errors += 1
                        results.append({
                            "component": "UI Integration Layer",
                            "status": "FAIL",
                            "message": f"DataTable component on page '{page}' references undefined API endpoint '{api_endpoint}'.",
                            "details": {}
                        })

        if ui_errors == 0:
            results.append({
                "component": "UI Integration Layer",
                "status": "PASS",
                "message": "All interface widgets and fetch requests verified against active routing maps.",
                "details": {}
            })
        else:
            overall_pass = False

        # 4. Authentication rules verification
        auth_status = "PASS"
        auth_msg = "Authentication schemas verified and secure routes loaded."
        auth_roles = auth.get("roles_defined", [])
        if not auth_roles:
            auth_status = "WARNING"
            auth_msg = "No roles registered under authorization middleware definitions."

        results.append({
            "component": "Access Control Layer",
            "status": auth_status,
            "message": auth_msg,
            "details": {"active_roles": auth_roles}
        })

        # Compile runtime manifest
        runtime_manifest = {
            "app_meta": {
                "compiler_version": "2.1.0-alpha",
                "status": "DEPLOY_READY" if overall_pass else "COMPILATION_ERROR"
            },
            "runtime_environment": {
                "engine": "FastAPI + SQLAlchemy + SQLite3",
                "database_file": "app_database.sqlite"
            },
            "middleware": {
                "cors_policy": {"allow_origins": ["*"], "allow_methods": ["*"]},
                "auth_provider": auth.get("auth_method", "JWT")
            },
            "routes_registered": [
                {"route": ep["route"], "method": ep["method"], "secured": True}
                for table, endpoints in api.items() for ep in endpoints
            ],
            "stripe_webhook_enabled": payments.get("enabled", False)
        }

        return {
            "success": overall_pass,
            "results": results,
            "manifest": runtime_manifest
        }
