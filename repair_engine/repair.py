import copy
from typing import Dict, Any, List

class RepairEngine:
    @staticmethod
    def repair(schemas: Dict[str, Any], validation_report: Dict[str, Any]) -> Dict[str, Any]:
        # Perform a deep copy to avoid mutating the original source
        repaired_schemas = copy.deepcopy(schemas)
        repairs_applied = []

        if validation_report.get("valid", True):
            # No repairs needed
            return {
                "success": True,
                "repaired_schemas": repaired_schemas,
                "repairs": []
            }

        errors = validation_report.get("errors", [])
        
        for error in errors:
            err_id = error.get("id", "")
            layer = error.get("layer", "")
            err_type = error.get("error_type", "")
            details = error.get("details", {})

            # 1. Handle UI Field Mismatch (Drift)
            if err_type == "UI Field Mismatch":
                page_key = details.get("page")
                ui_field = details.get("ui_field")
                api_route = details.get("api_route")
                expected_api_fields = details.get("expected_api_fields", [])

                # Attempt to find the closest match. In our drift case, "email_address" -> "email"
                best_match = None
                if "email" in ui_field and "email" in expected_api_fields:
                    best_match = "email"
                elif expected_api_fields:
                    # Generic fallback: match by lowercase substring or just take the first expected field
                    for exp in expected_api_fields:
                        if exp.lower() in ui_field.lower() or ui_field.lower() in exp.lower():
                            best_match = exp
                            break
                    if not best_match:
                        best_match = expected_api_fields[0]

                if best_match and page_key in repaired_schemas["ui"]:
                    # Surgically update the UI schema field
                    components = repaired_schemas["ui"][page_key].get("components", [])
                    repaired = False
                    for comp in components:
                        if comp.get("type") == "Form":
                            fields = comp.get("props", {}).get("fields", [])
                            for field in fields:
                                if field.get("name") == ui_field:
                                    field["name"] = best_match
                                    # Update label as well
                                    field["label"] = best_match.replace("_", " ").title()
                                    repaired = True
                                    break
                        if repaired:
                            break

                    repairs_applied.append({
                        "error_id": err_id,
                        "layer": "ui-schema",
                        "error_detected": f"UI field '{ui_field}' does not align with API route parameters for '{api_route}'.",
                        "repair_applied": f"Renamed UI form field '{ui_field}' to '{best_match}' on page '{page_key}' to establish cross-layer validation integrity.",
                        "before": f"\"name\": \"{ui_field}\"",
                        "after": f"\"name\": \"{best_match}\""
                    })

            # 2. Handle Undefined Auth Role
            elif err_type == "Undefined Auth Role":
                role = details.get("role")
                if role and "auth" in repaired_schemas:
                    if role not in repaired_schemas["auth"].get("roles_defined", []):
                        repaired_schemas["auth"]["roles_defined"].append(role)
                        
                        repairs_applied.append({
                            "error_id": err_id,
                            "layer": "auth-schema",
                            "error_detected": f"Role '{role}' was defined in navigation permissions but missing from security auth mappings.",
                            "repair_applied": f"Added role '{role}' directly to roles_defined list in authentication configurations.",
                            "before": f"roles_defined: {schemas['auth'].get('roles_defined', [])}",
                            "after": f"roles_defined: {repaired_schemas['auth']['roles_defined']}"
                        })

            # 3. Handle API Request Field mismatch with DB columns
            elif err_type == "API Request Field Mismatch":
                route = details.get("route")
                field = details.get("field")
                db_table = details.get("db_table")

                if db_table in repaired_schemas["db"]:
                    # Surgically append column to SQLite table schema definitions
                    new_col = {"name": field, "type": "VARCHAR(255)", "primary_key": False, "nullable": True}
                    repaired_schemas["db"][db_table]["columns"].append(new_col)

                    repairs_applied.append({
                        "error_id": err_id,
                        "layer": "database-schema",
                        "error_detected": f"API request field '{field}' expects a database column in '{db_table}', but none exists.",
                        "repair_applied": f"Appended nullable varchar column '{field}' to the database schema structure for table '{db_table}'.",
                        "before": f"columns count: {len(schemas['db'][db_table]['columns'])}",
                        "after": f"columns count: {len(repaired_schemas['db'][db_table]['columns'])} (Added '{field}')"
                    })

        return {
            "success": True,
            "repaired_schemas": repaired_schemas,
            "repairs": repairs_applied
        }
