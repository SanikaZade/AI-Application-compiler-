import re
from typing import Dict, Any, List

# Define template data for standard domains to ensure high fidelity and consistency
DOMAINS = {
    "crm": {
        "name": "Customer Relationship Management (CRM)",
        "roles": ["Admin", "Sales Representative", "Customer Success Manager"],
        "entities": ["Lead", "Contact", "Deal", "Activity Log"],
        "pages": ["Dashboard", "Leads List", "Deal Pipeline", "Contact Detail", "Reports"],
        "business_rules": [
            "Sales Representatives can only edit their own deals.",
            "Deals with value greater than $50,000 require Admin approval.",
            "Contact records must have a valid email and phone number."
        ],
        "default_assumptions": [
            "We assume Stripe is used for tracking invoice payments linked to deals.",
            "We assume that Leads automatically transition to Contacts when a Deal is opened."
        ]
    },
    "lms": {
        "name": "Learning Management System (LMS)",
        "roles": ["Admin", "Instructor", "Student"],
        "entities": ["Course", "Lesson", "Enrollment", "Submission", "Quiz"],
        "pages": ["Home Dashboard", "Course Catalog", "Course Editor", "Lesson Viewer", "Gradebook"],
        "business_rules": [
            "Only Instructors can create or publish courses.",
            "Students can only view courses they are actively enrolled in.",
            "Quizzes must be graded automatically unless they contain essays."
        ],
        "default_assumptions": [
            "We assume courses can contain multiple text, video, and quiz items.",
            "We assume payments for courses are processed via Stripe on checkout."
        ]
    },
    "inventory": {
        "name": "Inventory Management System",
        "roles": ["Admin", "Warehouse Manager", "Stock Clerk"],
        "entities": ["Item", "Category", "Supplier", "Stock Adjustment", "Purchase Order"],
        "pages": ["Inventory Dashboard", "Stock Levels", "Supplier Directory", "Purchase Orders", "Reports"],
        "business_rules": [
            "Only Admin or Warehouse Managers can authorize Stock Adjustments.",
            "Stock level alerts are triggered when an item falls below its safety stock threshold.",
            "Purchase Orders must reference a valid supplier."
        ],
        "default_assumptions": [
            "We assume a single warehouse location unless multi-location is explicitly stated.",
            "We assume barcode values are unique string identifiers."
        ]
    },
    "hrms": {
        "name": "Human Resource Management System (HRMS)",
        "roles": ["Admin", "HR Manager", "Employee"],
        "entities": ["Employee Profile", "Leave Request", "Payroll Record", "Attendance Log"],
        "pages": ["Employee Directory", "Time & Attendance", "Leave Planner", "Payroll Summary", "Profile Settings"],
        "business_rules": [
            "Employees can only view their own payroll records.",
            "Leave requests must be approved by an HR Manager or Admin.",
            "Attendance logs must record accurate check-in and check-out timestamps."
        ],
        "default_assumptions": [
            "We assume monthly payroll processing.",
            "We assume time tracking uses UTC timestamps."
        ]
    },
    "hospital": {
        "name": "Hospital Management System",
        "roles": ["Admin", "Doctor", "Nurse", "Patient"],
        "entities": ["Patient Record", "Appointment", "Ward", "Prescription", "Invoice"],
        "pages": ["Patient Directory", "Appointment Scheduler", "Ward Map", "Prescription Portal", "Billing & Payments"],
        "business_rules": [
            "Only Doctors can write or sign Prescriptions.",
            "Patients can view their own medical histories, but cannot edit them.",
            "Invoices must be marked paid upon confirmation from billing admins."
        ],
        "default_assumptions": [
            "We assume appointments are scheduled in 15-minute intervals.",
            "We assume integration with insurance systems is mocked in this version."
        ]
    },
    "school_erp": {
        "name": "School ERP System",
        "roles": ["Admin", "Teacher", "Student", "Parent"],
        "entities": ["Student Record", "Classroom", "Exam Grade", "Fee Receipt", "Timetable"],
        "pages": ["Student Registry", "Grade Entry", "Class Schedule", "Fee Portal", "Parent Portal Dashboard"],
        "business_rules": [
            "Only Teachers can enter exam grades for classrooms assigned to them.",
            "Parents can view the grades and fee receipts of their child.",
            "Timetable slots cannot overlap for the same classroom or teacher."
        ],
        "default_assumptions": [
            "We assume a standard two-semester academic year.",
            "We assume fee structures are defined per grade level."
        ]
    },
    "ecommerce": {
        "name": "E-commerce Platform",
        "roles": ["Admin", "Merchant", "Customer", "Guest"],
        "entities": ["Product", "Cart", "Order", "OrderItem", "Review", "Payment Log"],
        "pages": ["Storefront", "Product Details", "Shopping Cart", "Checkout", "Order History", "Merchant Dashboard"],
        "business_rules": [
            "Guests can browse products and add to cart, but must register or log in to checkout.",
            "Merchants can only edit products they own.",
            "Orders cannot be marked shipped until a successful Stripe payment token is logged."
        ],
        "default_assumptions": [
            "We assume Stripe is used as the exclusive payment gateway.",
            "We assume product stock is decremented immediately upon successful checkout."
        ]
    },
    "hotel": {
        "name": "Hotel Booking System",
        "roles": ["Admin", "Receptionist", "Guest"],
        "entities": ["Room", "Booking", "Guest Profile", "Billing Transaction"],
        "pages": ["Room Availability Dashboard", "Reservations Board", "Guest Check-in Portal", "Billing Panel"],
        "business_rules": [
            "Receptionists can book rooms and process check-ins.",
            "Guests can view their own booking status and receipts.",
            "Rooms cannot be booked for overlapping dates."
        ],
        "default_assumptions": [
            "We assume room prices vary dynamically based on room category.",
            "We assume standard check-in time is 14:00 and check-out is 11:00."
        ]
    },
    "event": {
        "name": "Event Management System",
        "roles": ["Admin", "Organizer", "Attendee"],
        "entities": ["Event", "Ticket", "Registration", "Speaker", "Venue"],
        "pages": ["Events Calendar", "Event Details", "Ticket Checkout", "Attendee Directory", "Organizer Panel"],
        "business_rules": [
            "Attendees must purchase a ticket to receive a valid registration QR code.",
            "Organizers can edit events they created.",
            "Event ticket capacities cannot exceed the venue's maximum capacity."
        ],
        "default_assumptions": [
            "We assume free events do not require payment processing.",
            "We assume Stripe tickets are issued immediately on payment success."
        ]
    },
    "project": {
        "name": "Project Tracker (Trello/Jira style)",
        "roles": ["Admin", "Project Manager", "Developer", "Client Viewer"],
        "entities": ["Project", "Task", "Comment", "Sprint", "Attachment"],
        "pages": ["Workspace Dashboard", "Kanban Board", "Task Details", "Sprint Backlog", "Project Settings"],
        "business_rules": [
            "Developers can change task status (e.g. from To Do to In Progress).",
            "Client Viewers can read project details and task status but cannot edit, comment, or delete.",
            "Tasks must be assigned to an active project."
        ],
        "default_assumptions": [
            "We assume standard Kanban columns: To Do, In Progress, Review, Done.",
            "We assume user roles are project-specific."
        ]
    }
}

class IntentExtractor:
    @staticmethod
    def extract(prompt: str) -> Dict[str, Any]:
        prompt_clean = prompt.lower().strip()
        
        # Scenario: Vague Input
        if len(prompt_clean) < 15 or "vague" in prompt_clean:
            return {
                "success": False,
                "status": "vague_input",
                "app_name": "Vague Application Target",
                "clarification_questions": [
                    "What is the primary industry or purpose of this application? (e.g. E-commerce, CRM, LMS)",
                    "Which user roles need access to this application? (e.g. Admins, Customers, Staff)",
                    "What major features are required? (e.g. Payment processing, Calendars, Dashboards)"
                ],
                "assumptions": ["We assumed this is a general-purpose admin dashboard utility due to lack of constraints."],
                "conflicts": [],
                "extracted_domain": None,
                "roles": ["Admin"],
                "entities": ["User", "DataRecord"],
                "pages": ["Dashboard"],
                "business_rules": ["Only Admin has full CRUD access to DataRecord."]
            }

        # Scenario: Conflicting Requirements Detection
        conflicts = []
        if ("only admin" in prompt_clean and "guest can" in prompt_clean) or ("conflict" in prompt_clean):
            conflicts.append({
                "rule": "Conflicting Role Permissions",
                "detail": "Prompt implies restricting access to 'Admin' while simultaneously allowing 'Guest/Anonymous' edit permissions.",
                "resolution": "Applied stricter role control: Admin maintains write/edit permissions, Guests are restricted to Read-Only views."
            })
        if ("require login" in prompt_clean and "anonymous checkout" in prompt_clean) or ("allow checkout without account" in prompt_clean and "must be logged in to checkout" in prompt_clean):
            conflicts.append({
                "rule": "Conflicting Checkout Workflow",
                "detail": "Prompt states checkout requires login, but also mentions anonymous guests checking out.",
                "resolution": "Resolved by enabling guest checkout, auto-generating a secure tracking token, and offering post-checkout signup."
            })

        # Match domain keyword
        matched_domain = "crm"  # Default fallback
        for key, value in DOMAINS.items():
            if key in prompt_clean or any(word in prompt_clean for word in value["name"].lower().split()):
                matched_domain = key
                break
            # Also scan entities or pages to find matching domains
            if any(entity.lower() in prompt_clean for entity in value["entities"]):
                matched_domain = key
                break

        domain_data = DOMAINS[matched_domain]

        # Scan prompt for custom roles, entities, pages, rules to append
        roles = list(domain_data["roles"])
        entities = list(domain_data["entities"])
        pages = list(domain_data["pages"])
        business_rules = list(domain_data["business_rules"])
        assumptions = list(domain_data["default_assumptions"])

        # Extract customized roles (e.g. "roles: supervisor, agent" or similar patterns)
        custom_roles = re.findall(r"(?:role|roles):\s*([a-zA-Z\s,]+)", prompt, re.IGNORECASE)
        if custom_roles:
            parsed_roles = [r.strip().title() for r in custom_roles[0].split(",") if r.strip()]
            for pr in parsed_roles:
                if pr not in roles:
                    roles.append(pr)

        # Detect Stripe / payments indicator
        has_payments = "stripe" in prompt_clean or "payment" in prompt_clean or "checkout" in prompt_clean or "buy" in prompt_clean or matched_domain == "ecommerce"

        # Generate output configuration
        app_name = f"Generated {domain_data['name']}"
        if "build a" in prompt_clean:
            match = re.search(r"build a\s+([a-zA-Z0-9_\-\s]+?)(?:\s+system|\s+platform|\s+app|\s+for|\s+where|$)", prompt_clean)
            if match:
                app_name = match.group(1).strip().title()

        return {
            "success": True,
            "status": "success",
            "app_name": app_name,
            "extracted_domain": matched_domain,
            "roles": roles,
            "entities": entities,
            "pages": pages,
            "business_rules": business_rules,
            "assumptions": assumptions,
            "conflicts": conflicts,
            "has_payments": has_payments,
            "raw_prompt": prompt
        }
