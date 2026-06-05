from typing import Dict, Any, List

class ValidationEngine:
    @staticmethod
    def validate(schemas: Dict[str, Any], roles_list: List[str]) -> Dict[str, Any]:
        errors = []
        warnings = []

        # 1. Structural Checks
        required_schemas = ["ui", "api", "db", "auth", "payments"]
        for key in required_schemas:
            if key not in schemas:
                errors.append({
                    "id": f"struct_missing_{key}",
                    "layer": "structure",
                    "error_type": "Missing Schema Section",
                    "message": f"Critical schema block '{key}' is completely missing.",
                    "details": {}
                })
        
        if errors:
            return {"valid": False, "errors": errors, "warnings": warnings}

        ui = schemas["ui"]
        api = schemas["api"]
        db = schemas["db"]
        auth = schemas["auth"]

        # 2. Auth Roles validation
        defined_roles = auth.get("roles_defined", [])
        for role in roles_list:
            if role not in defined_roles:
                errors.append({
                    "id": f"auth_role_mismatch_{role}",
                    "layer": "auth",
                    "error_type": "Undefined Auth Role",
                    "message": f"Role '{role}' is referenced but not defined in auth schema.",
                    "details": {"role": role, "defined_roles": defined_roles}
                })

        # 3. Cross-layer consistency check: UI Form -> API POST request properties
        for page_key, page_val in ui.items():
            components = page_val.get("components", [])
            for comp in components:
                if comp.get("type") == "Form":
                    props = comp.get("props", {})
                    submit_api = props.get("submit_api")
                    submit_method = props.get("submit_method", "POST")
                    fields = props.get("fields", [])

                    # Find corresponding API endpoint
                    api_found = False
                    expected_api_fields = []
                    
                    # Search through API endpoints
                    for entity_key, endpoints in api.items():
                        for ep in endpoints:
                            if ep.get("route") == submit_api and ep.get("method") == submit_method:
                                api_found = True
                                req_body = ep.get("request_body", {})
                                expected_api_fields = list(req_body.get("properties", {}).keys())
                                break
                        if api_found:
                            break
                    
                    if not api_found:
                        warnings.append({
                            "id": f"ui_form_api_unresolved_{page_key}",
                            "layer": "ui",
                            "warning_type": "Unresolved API endpoint",
                            "message": f"UI Form on '{page_key}' submits to '{submit_method} {submit_api}' which is not defined in API schema.",
                            "details": {"page": page_key, "route": submit_api, "method": submit_method}
                        })
                    else:
                        # Check field consistency
                        ui_field_names = [f["name"] for f in fields]
                        
                        for ui_field in ui_field_names:
                            if ui_field not in expected_api_fields:
                                # Found the schema drift!
                                errors.append({
                                    "id": f"cross_field_mismatch_{page_key}_{ui_field}",
                                    "layer": "ui-api-alignment",
                                    "error_type": "UI Field Mismatch",
                                    "message": f"UI Form field '{ui_field}' on page '{page_key}' does not match any API schema field for '{submit_method} {submit_api}'.",
                                    "details": {
                                        "page": page_key,
                                        "ui_field": ui_field,
                                        "api_route": submit_api,
                                        "expected_api_fields": expected_api_fields
                                    }
                                })

        # 4. Cross-layer consistency check: API endpoints -> DB schema columns
        for entity_name, endpoints in api.items():
            db_table = entity_name  # Usually matches table name directly or via lowercase
            if db_table not in db:
                errors.append({
                    "id": f"api_db_table_missing_{db_table}",
                    "layer": "api-db-alignment",
                    "error_type": "Missing DB Table",
                    "message": f"API entity '{entity_name}' references DB table '{db_table}' which does not exist.",
                    "details": {"entity": entity_name, "db_tables": list(db.keys())}
                })
            else:
                db_columns = [col["name"] for col in db[db_table].get("columns", [])]
                for ep in endpoints:
                    # Validate request body properties exist in DB
                    req_props = ep.get("request_body", {}).get("properties", {})
                    for prop in req_props:
                        if prop not in db_columns:
                            errors.append({
                                "id": f"api_req_db_mismatch_{entity_name}_{prop}",
                                "layer": "api-db-alignment",
                                "error_type": "API Request Field Mismatch",
                                "message": f"API request body property '{prop}' in endpoint '{ep['method']} {ep['route']}' does not match any database column in table '{db_table}'.",
                                "details": {"route": ep["route"], "field": prop, "db_table": db_table}
                            })

                    # Validate response properties exist in DB
                    resp_props = ep.get("response", {}).get("properties", {})
                    for prop in resp_props:
                        if prop not in db_columns and prop not in ["success", "id"]: # standard exceptions
                            warnings.append({
                                "id": f"api_resp_db_mismatch_{entity_name}_{prop}",
                                "layer": "api-db-alignment",
                                "warning_type": "API Response Field Discrepancy",
                                "message": f"API response property '{prop}' in endpoint '{ep['method']} {ep['route']}' is not a physical database column in table '{db_table}'.",
                                "details": {"route": ep["route"], "field": prop, "db_table": db_table}
                            })

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
