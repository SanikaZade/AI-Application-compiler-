from typing import Dict, Any, List

class ArchitecturePlanner:
    @staticmethod
    def plan(intent: Dict[str, Any]) -> Dict[str, Any]:
        if not intent.get("success", False):
            # Fallback/Safe placeholder planning for vague/failed intents
            return {
                "navigation": [{"name": "Dashboard", "path": "/dashboard", "roles": ["Admin"]}],
                "permissions": {"Admin": {"User": ["create", "read", "update", "delete"], "DataRecord": ["create", "read", "update", "delete"]}},
                "workflows": [{"name": "Default Admin Flow", "steps": ["Login to Dashboard", "Manage records"]}]
            }

        roles = intent["roles"]
        entities = intent["entities"]
        pages = intent["pages"]
        domain = intent["extracted_domain"]

        # 1. Navigation Mapping
        navigation = []
        for page in pages:
            path = "/" + page.lower().replace(" ", "-").replace("&", "and")
            if path == "/home-dashboard" or path == "/dashboard" or path == "/workspace-dashboard":
                path = "/dashboard"
            elif path == "/storefront":
                path = "/"
            
            # Restrict page access based on standard practices
            allowed_roles = list(roles)
            page_lower = page.lower()
            if "admin" in page_lower:
                allowed_roles = [r for r in roles if "admin" in r.lower()]
            elif "editor" in page_lower or "manage" in page_lower or "creator" in page_lower:
                allowed_roles = [r for r in roles if "admin" in r.lower() or "instructor" in r.lower() or "manager" in r.lower() or "organizer" in r.lower()]
            elif "parent" in page_lower:
                allowed_roles = [r for r in roles if "parent" in r.lower() or "admin" in r.lower()]
            elif "student" in page_lower and not "catalog" in page_lower:
                allowed_roles = [r for r in roles if "student" in r.lower() or "admin" in r.lower() or "teacher" in r.lower()]
            
            navigation.append({
                "name": page,
                "path": path,
                "roles": allowed_roles
            })

        # 2. Role-Permission Matrix
        permissions = {}
        for role in roles:
            role_lower = role.lower()
            permissions[role] = {}
            for entity in entities:
                # Assign CRUD permissions based on role tier
                if "admin" in role_lower:
                    permissions[role][entity] = ["create", "read", "update", "delete"]
                elif "manager" in role_lower or "instructor" in role_lower or "organizer" in role_lower or "teacher" in role_lower:
                    permissions[role][entity] = ["create", "read", "update"]
                elif "staff" in role_lower or "clerk" in role_lower or "representative" in role_lower:
                    permissions[role][entity] = ["create", "read", "update"]
                elif "guest" in role_lower:
                    # Guests can only read specific records
                    permissions[role][entity] = ["read"] if entity in ["Product", "Room", "Event", "Course"] else []
                else:
                    # Regular user / Student / Patient / Attendee
                    if entity in ["Profile", "Enrollment", "Submission", "Booking", "Appointment", "Ticket", "Registration", "Leave Request"]:
                        permissions[role][entity] = ["create", "read", "update"]
                    else:
                        permissions[role][entity] = ["read"]

        # 3. Dynamic User Flow Workflows
        workflows = []
        if domain == "ecommerce":
            workflows.append({
                "name": "Customer Purchasing Flow",
                "steps": ["Browse Storefront", "Add Product to Shopping Cart", "Enter Shipping Info at Checkout", "Submit Payment Token via Stripe", "Generate Order Receipt"]
            })
        elif domain == "lms":
            workflows.append({
                "name": "Course Creation & Enrollment Flow",
                "steps": ["Instructor creates Course in Editor", "Instructor adds Lesson chapters", "Student browses Course Catalog", "Student enrolls in Course", "Student completes Lesson and Quiz"]
            })
        elif domain == "hospital":
            workflows.append({
                "name": "Patient Appointment & Prescription Flow",
                "steps": ["Patient schedules Appointment", "Doctor conducts consultation", "Doctor issues Prescription", "Admin generates Billing Invoice", "Patient pays Invoice"]
            })
        else:
            workflows.append({
                "name": f"Standard {domain.upper()} Management Flow",
                "steps": [f"Create new {entities[0]} entry", f"Modify {entities[0]} properties", f"Verify status via {pages[0]}", f"Export report as Admin"]
            })

        return {
            "navigation": navigation,
            "permissions": permissions,
            "workflows": workflows
        }
