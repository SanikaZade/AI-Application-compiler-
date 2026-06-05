from typing import Dict, Any, List

class SchemaGenerator:
    @staticmethod
    def generate(intent: Dict[str, Any], architecture: Dict[str, Any], introduce_drift: bool = True) -> Dict[str, Any]:
        roles = intent.get("roles", ["Admin"])
        entities = intent.get("entities", ["User"])
        has_payments = intent.get("has_payments", False)
        domain = intent.get("extracted_domain", "general")

        # 1. Database Schema
        db_schema = {}
        for entity in entities:
            table_name = entity.lower().replace(" ", "_") + "s"
            columns = [
                {"name": "id", "type": "INTEGER", "primary_key": True, "nullable": False},
                {"name": "created_at", "type": "TIMESTAMP", "primary_key": False, "nullable": False}
            ]
            
            # Add entity-specific fields
            if entity == "User" or entity == "Employee Profile" or entity == "Guest Profile":
                columns.extend([
                    {"name": "email", "type": "VARCHAR(255)", "primary_key": False, "nullable": False, "unique": True},
                    {"name": "password_hash", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "name", "type": "VARCHAR(255)", "primary_key": False, "nullable": True}
                ])
            elif entity == "Course":
                columns.extend([
                    {"name": "title", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "description", "type": "TEXT", "primary_key": False, "nullable": True},
                    {"name": "instructor_id", "type": "INTEGER", "primary_key": False, "nullable": False, "foreign_key": "users.id"}
                ])
            elif entity == "Product":
                columns.extend([
                    {"name": "name", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "price", "type": "NUMERIC(10,2)", "primary_key": False, "nullable": False},
                    {"name": "stock_count", "type": "INTEGER", "primary_key": False, "nullable": False}
                ])
            elif entity == "Order":
                columns.extend([
                    {"name": "customer_id", "type": "INTEGER", "primary_key": False, "nullable": False, "foreign_key": "users.id"},
                    {"name": "total_amount", "type": "NUMERIC(10,2)", "primary_key": False, "nullable": False},
                    {"name": "status", "type": "VARCHAR(50)", "primary_key": False, "nullable": False}
                ])
            elif entity == "Appointment":
                columns.extend([
                    {"name": "patient_id", "type": "INTEGER", "primary_key": False, "nullable": False, "foreign_key": "users.id"},
                    {"name": "doctor_id", "type": "INTEGER", "primary_key": False, "nullable": False, "foreign_key": "users.id"},
                    {"name": "appointment_date", "type": "DATETIME", "primary_key": False, "nullable": False},
                    {"name": "status", "type": "VARCHAR(50)", "primary_key": False, "nullable": False}
                ])
            elif entity == "Lead":
                columns.extend([
                    {"name": "company", "type": "VARCHAR(255)", "primary_key": False, "nullable": True},
                    {"name": "contact_name", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "email", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "status", "type": "VARCHAR(50)", "primary_key": False, "nullable": False}
                ])
            else:
                # Fallback fields
                columns.extend([
                    {"name": "title", "type": "VARCHAR(255)", "primary_key": False, "nullable": False},
                    {"name": "status", "type": "VARCHAR(50)", "primary_key": False, "nullable": True}
                ])

            db_schema[table_name] = {"columns": columns}

        # 2. API Schema
        api_schema = {}
        for entity in entities:
            table_name = entity.lower().replace(" ", "_") + "s"
            base_route = f"/api/{table_name}"
            
            # Define endpoints
            api_schema[table_name] = [
                {
                    "route": base_route,
                    "method": "GET",
                    "description": f"Fetch all {table_name}",
                    "roles_allowed": [r for r in roles if "guest" not in r.lower()],
                    "response": {"type": "array", "items": {"type": "object", "properties": {c["name"]: {"type": "string" if "VARCHAR" in c["type"] or "TEXT" in c["type"] else "integer"} for c in db_schema[table_name]["columns"]}}}
                },
                {
                    "route": f"{base_route}/{{id}}",
                    "method": "GET",
                    "description": f"Get a single {entity}",
                    "roles_allowed": roles,
                    "response": {"type": "object", "properties": {c["name"]: {"type": "string"} for c in db_schema[table_name]["columns"]}}
                },
                {
                    "route": base_route,
                    "method": "POST",
                    "description": f"Create new {entity}",
                    "roles_allowed": [r for r in roles if r not in ["Guest", "Student", "Patient"]],
                    "request_body": {"properties": {c["name"]: {"type": "string"} for c in db_schema[table_name]["columns"] if not c["primary_key"] and c["name"] != "created_at"}},
                    "response": {"type": "object", "properties": {"id": {"type": "integer"}, "success": {"type": "boolean"}}}
                }
            ]

        # 3. UI Schema
        ui_schema = {}
        for nav in architecture.get("navigation", []):
            page_name = nav["name"]
            page_key = page_name.lower().replace(" ", "_")
            
            # Setup UI structure
            ui_schema[page_key] = {
                "title": page_name,
                "layout": "sidebar-grid",
                "components": [
                    {"type": "Navbar", "props": {"title": page_name, "show_search": True}},
                    {"type": "MetricRow", "props": {"metrics": ["Total Volume", "Active Elements", "Alerts"]}}
                ]
            }

            # If it's a form or list, match it to database entities
            if "list" in page_key or "catalog" in page_key or "directory" in page_key or "storefront" in page_key or page_key == "dashboard":
                target_entity = entities[0].lower().replace(" ", "_") + "s"
                ui_schema[page_key]["components"].append({
                    "type": "DataTable",
                    "props": {
                        "api_endpoint": f"/api/{target_entity}",
                        "columns": [{"header": c.title(), "field": c} for c in [col["name"] for col in db_schema[target_entity]["columns"]]]
                    }
                })
            
            if "editor" in page_key or "checkout" in page_key or "scheduler" in page_key:
                # Include a Form
                target_entity = entities[0].lower().replace(" ", "_") + "s"
                form_fields = []
                for col in db_schema[target_entity]["columns"]:
                    if not col["primary_key"] and col["name"] != "created_at":
                        field_name = col["name"]
                        
                        # INTRODUCE CONTROLLED SCHEMA DRIFT (For Repair Engine demonstration)
                        # If introduce_drift is True, we mismatch a UI form field key vs DB field name
                        if introduce_drift and field_name == "email" and page_key == "checkout":
                            field_name = "email_address"  # Drift: "email_address" in UI, but API/DB expects "email"
                        
                        form_fields.append({
                            "name": field_name,
                            "label": col["name"].replace("_", " ").title(),
                            "type": "text" if "VARCHAR" in col["type"] else "number",
                            "required": not col["nullable"]
                        })
                
                ui_schema[page_key]["components"].append({
                    "type": "Form",
                    "props": {
                        "submit_api": f"/api/{target_entity}",
                        "submit_method": "POST",
                        "fields": form_fields
                    }
                })

        # 4. Auth Schema
        auth_schema = {
            "auth_method": "JWT",
            "token_expiry_minutes": 60,
            "roles_defined": roles,
            "routes_secured": [
                {"pattern": "/api/.*", "requires_auth": True, "bypass_for": ["/api/products", "/api/storefront"] if domain == "ecommerce" else []}
            ]
        }

        # 5. Payment Schema (Stripe Setup)
        payment_schema = {
            "provider": "Stripe" if has_payments else "None",
            "enabled": has_payments,
            "currency": "USD",
            "products": []
        }
        if has_payments:
            if domain == "ecommerce":
                payment_schema["products"] = [
                    {"id": "prod_standard", "name": "Store Checkout Item", "billing_scheme": "one-time"}
                ]
            elif domain == "lms":
                payment_schema["products"] = [
                    {"id": "prod_course_access", "name": "Course Pass", "billing_scheme": "one-time"}
                ]
            else:
                payment_schema["products"] = [
                    {"id": "prod_subscription", "name": "Platform Premium Tier", "billing_scheme": "subscription", "price": 29.99}
                ]

        return {
            "ui": ui_schema,
            "api": api_schema,
            "db": db_schema,
            "auth": auth_schema,
            "payments": payment_schema
        }
