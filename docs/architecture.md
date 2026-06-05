# AI Application Compiler Architecture

This document describes the design and pipeline stages of the **AI Application Compiler**, a software generation compiler inspired by Base44. It converts natural language product requirements into a validated, executable application configuration JSON through a 6-stage pipeline.

---

## 1. Pipeline Pipeline Flow

```
+------------------+     +------------------------+     +--------------------------+
|  User Input /    | --> | Stage 1: Intent        | --> | Stage 2: Architecture    |
|  Prompt          |     | Extraction (Parser)    |     | Design (Planner)         |
+------------------+     +------------------------+     +--------------------------+
                                                                      |
                                                                      v
+------------------+     +------------------------+     +--------------------------+
| Stage 5: Repair  | <-- | Stage 4: Validation    | <-- | Stage 3: Schema          |
| Engine (Fixes)   |     | Engine (Rules Engine)  |     | Generation (UI/API/DB)   |
+------------------+     +------------------------+     +--------------------------+
        |
        v
+------------------------+     +------------------------+
| Stage 6: Runtime       | --> | Final Executable       |
| Checker (Simulation)   |     | Manifest JSON          |
+------------------------+     +------------------------+
```

---

## 2. Detailed Pipeline Stages

### Stage 1: Intent Extraction
- **Input**: Natural language prompt (e.g., "Build an LMS where teachers can upload courses and students can enroll").
- **Processing**:
  - Matches prompt text against domain vocabularies (e.g., CRM, LMS, HRMS, etc.).
  - Extracts key **Roles** (e.g., Teacher, Student, Admin).
  - Identifies **Entities** (e.g., Course, User, Enrollment).
  - Infers **Pages** (e.g., Course List, Upload Course, Dashboard).
  - Captures **Business Rules** (e.g., "only teachers can create courses").
  - Identifies **Assumptions** if the prompt is incomplete.
  - Detects **Conflicts** (e.g., conflicting roles, contradictory access rules) and reports them.
  - Formulates **Clarification Questions** if prompt is too vague (e.g., < 15 characters).
- **Output**: Intent Intermediate Representation (JSON).

### Stage 2: Architecture Planner
- **Input**: Intent JSON from Stage 1.
- **Processing**:
  - Maps components into a cohesive application structure.
  - Defines the core **navigation map** (routes, page access).
  - Constructs the **role-permission matrix** (which role can perform create/read/update/delete operations on which entity).
  - Drafts **user flows** and sequential **workflows** (e.g., Teacher uploads course -> Admin approves -> Student enrolls).
- **Output**: Architecture JSON.

### Stage 3: Schema Generator
- **Input**: Architecture JSON from Stage 2.
- **Processing**:
  - Generates 5 unified schemas with strict naming and reference rules:
    1. **UI Schema**: View components, widgets, form fields, and validation patterns.
    2. **API Schema**: RESTful endpoints, HTTP methods, request parameters, and response objects.
    3. **Database Schema**: Tables, primary keys, foreign key constraints, column data types, and index configs.
    4. **Authentication Schema**: JWT, session configuration, security requirements, and login/register definitions.
    5. **Payment Configuration**: Stripe integration mappings, price definitions, subscription rules, and payment callbacks.
- **Output**: Consistent Schemas JSON.

### Stage 4: Validation Engine
- **Input**: All generated schemas from Stage 3.
- **Processing**:
  - Evaluates JSON structural integrity.
  - Enforces field presence, value ranges, and type safety.
  - Performs **Cross-Layer Integrity checks**:
    - Do UI form fields map to active API fields?
    - Do API request/response properties map to existing DB columns?
    - Do Auth routes point to defined roles?
- **Output**: Validation Report (passes, warnings, errors).

### Stage 5: Repair Engine
- **Input**: Failed validation reports and the generated schemas.
- **Processing**:
  - Targets only specific mismatch/violation zones.
  - Corrects type violations, appends missing key properties, and resolves references.
  - Generates before/after diffs showing what was repaired.
- **Output**: Corrected Schemas + Repair Report.

### Stage 6: Runtime Checker
- **Input**: Repaired Schemas + Architecture.
- **Processing**:
  - Executes a SQLite sandbox session to verify DB schema (DDL generation & mock run).
  - Validates route resolution map.
  - Performs end-to-end execution simulation.
  - Generates a **Runtime Manifest** representing the final compilation outcome.
- **Output**: Runtime Report (Pass/Fail/Warning) + Final Executable Manifest.
