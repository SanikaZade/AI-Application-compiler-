NORMAL_PROMPTS = [
    {
        "id": "norm_crm",
        "name": "Customer Relationship Management (CRM)",
        "prompt": "Build a CRM system for sales representatives to manage leads, log sales activity, and track deals. High-value deals need admin approval."
    },
    {
        "id": "norm_lms",
        "name": "Learning Management System (LMS)",
        "prompt": "Build a Learning Management System (LMS) where teachers can create courses and upload lesson plans, while students enroll and complete quizzes."
    },
    {
        "id": "norm_inventory",
        "name": "Inventory Management System",
        "prompt": "Create an Inventory Management app to catalog items, record stock levels, track suppliers, and place purchase orders. Alert when stock drops."
    },
    {
        "id": "norm_hrms",
        "name": "HR Management System (HRMS)",
        "prompt": "Design an HRMS platform to handle employee profiles, leave request approval workflows, and monthly payroll records."
    },
    {
        "id": "norm_hospital",
        "name": "Hospital Management System",
        "prompt": "Build a hospital app where doctors can prescribe medicines to patients and admins manage appointments, billing, and ward occupancy."
    },
    {
        "id": "norm_school_erp",
        "name": "School ERP System",
        "prompt": "Develop a School ERP system for inputting classroom schedules, tracking student exam grades, parent review portals, and tuition fees."
    },
    {
        "id": "norm_ecommerce",
        "name": "E-commerce Platform",
        "prompt": "Build an E-commerce store with product catalogs, shopping cart widgets, credit card checkouts with Stripe, and order tracking."
    },
    {
        "id": "norm_hotel",
        "name": "Hotel Booking System",
        "prompt": "Build a hotel booking app for receptionist desks to track room availability, book guest reservations, and check in visitors."
    },
    {
        "id": "norm_event",
        "name": "Event Management System",
        "prompt": "Create an Event Management app where organizers publish ticketed events, and attendees purchase tickets and register."
    },
    {
        "id": "norm_project",
        "name": "Project Tracking System",
        "prompt": "Build a Kanban project tracker with boards, tasks, developer assignees, sprint planning, and client read-only viewing permissions."
    }
]

EDGE_CASE_PROMPTS = [
    {
        "id": "edge_vague_1",
        "name": "Vague: App",
        "prompt": "app"
    },
    {
        "id": "edge_vague_2",
        "name": "Vague: Make a website",
        "prompt": "make a website for me please"
    },
    {
        "id": "edge_conflict_1",
        "name": "Conflict: Admin vs Guest permissions",
        "prompt": "Build a CRM where only admins can edit leads, but guests can also update lead statuses."
    },
    {
        "id": "edge_conflict_2",
        "name": "Conflict: Guest Checkout vs Req Login",
        "prompt": "Design an online store where guest checkouts are completely blocked, but guests can buy without login."
    },
    {
        "id": "edge_missing_info_1",
        "name": "Missing Info: Leave Requests",
        "prompt": "Create a portal to submit leave requests, with no roles or admin approval rules defined."
    },
    {
        "id": "edge_missing_info_2",
        "name": "Missing Info: Payments",
        "prompt": "Build a membership event app with payments, but do not outline any payment gateway details."
    },
    {
        "id": "edge_invalid_1",
        "name": "Invalid: Text editor command",
        "prompt": "sudo rm -rf /"
    },
    {
        "id": "edge_invalid_2",
        "name": "Invalid: Gibberish text",
        "prompt": "qwertyuiop asdfghjkl zxcvbnm"
    },
    {
        "id": "edge_complex_conflict",
        "name": "Complex Conflict: Hospital Roles",
        "prompt": "A clinical patient management app where patients prescribe drugs and doctors pay for consultations."
    },
    {
        "id": "edge_vague_3",
        "name": "Vague: Admin Portal",
        "prompt": "portal"
    }
]
