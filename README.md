# AI Application Compiler

## Overview

This project is an AI-powered software generation system inspired by platforms such as Base44.

The goal is to transform natural language application requirements into a validated, executable application specification and eventually generate a working application.

Example:

User Input:

```text
Build a CRM with login, contacts, dashboard, role-based access and payments.
```

Output:

```text
Validated Application Specification
    ↓
Generated Frontend
Generated Backend
Generated Database Schema
```

The system should behave like a compiler:

```text
Natural Language
        ↓
Intent Extraction
        ↓
System Design
        ↓
Schema Generation
        ↓
Validation
        ↓
Repair
        ↓
Code Generation
        ↓
Runtime Verification
```

---

# Architecture

## High-Level Flow

```text
User Prompt
      ↓
Intent Agent
      ↓
Design Agent
      ↓
 ┌────────────┬────────────┬────────────┬────────────┐
 │ UI Agent   │ API Agent  │ DB Agent   │ Auth Agent │
 └────────────┴────────────┴────────────┴────────────┘
      ↓
Validation Agent
      ↓
Repair Agent
      ↓
Code Generation Agent
      ↓
Generated Project
```

---

# Why This Architecture

The assignment explicitly requires:

* Multi-stage generation
* Structured schemas
* Validation
* Automatic repair
* Deterministic behavior
* Execution awareness

Instead of generating code immediately, the system generates specifications first.

This makes validation possible.

---

# Agent Responsibilities

## 1. Intent Agent

### Purpose

Convert user input into structured requirements.

### Input

```json
{
  "query": "Build a CRM with login and contacts"
}
```

### Output

```json
{
  "project_name": "CRM",
  "project_type": "crm",
  "features": [
    "authentication",
    "contacts"
  ]
}
```

### Responsibility

Natural Language → Structured Requirements

---

## 2. Design Agent

### Purpose

Act as a software architect.

Convert requirements into application architecture.

### Input

```json
{
  "project_name": "CRM",
  "features": [
    "authentication",
    "contacts"
  ]
}
```

### Output

```json
{
  "entities": [
    "User",
    "Contact"
  ],

  "relationships": [],

  "pages": [
    "Login",
    "Dashboard",
    "Contacts"
  ],

  "roles": [
    "Admin",
    "User"
  ],

  "permissions": [],

  "workflows": [
    "login",
    "create_contact"
  ]
}
```

### Responsibility

Requirements → Application Blueprint

---

## 3. UI Agent

### Input

Reads:

* intent
* design

### Output

```json
{
  "ui_schema": {
    "pages": [
      {
        "name": "Contacts",
        "components": [
          "ContactTable",
          "AddContactButton"
        ]
      }
    ]
  }
}
```

### Responsibility

Application Blueprint → UI Specification

---

## 4. API Agent

### Input

Reads:

* intent
* design

### Output

```json
{
  "api_schema": {
    "endpoints": [
      {
        "path": "/contacts",
        "method": "GET"
      },
      {
        "path": "/contacts",
        "method": "POST"
      }
    ]
  }
}
```

### Responsibility

Application Blueprint → API Specification

---

## 5. DB Agent

### Input

Reads:

* intent
* design

### Output

```json
{
  "db_schema": {
    "tables": [
      {
        "name": "contacts",
        "columns": [
          "id",
          "name",
          "email"
        ]
      }
    ]
  }
}
```

### Responsibility

Application Blueprint → Database Specification

---

## 6. Auth Agent

### Input

Reads:

* roles
* permissions

### Output

```json
{
  "auth_schema": {
    "roles": {
      "Admin": [
        "create",
        "delete"
      ],
      "User": [
        "read"
      ]
    }
  }
}
```

### Responsibility

Roles & Permissions → Authorization Specification

---

# Validation Agent

## Purpose

Detect inconsistencies.

DO NOT fix them.

### Input

```text
ui_schema
api_schema
db_schema
auth_schema
```

### Example

UI:

```json
{
  "email": true
}
```

API:

```json
{
  "email": true
}
```

DB:

```json
{
  "columns": [
    "id",
    "name"
  ]
}
```

Problem:

```text
email missing in DB
```

### Output

```json
{
  "is_valid": false,
  "errors": [
    {
      "type": "schema_mismatch",
      "message": "email exists in UI/API but not DB"
    }
  ]
}
```

### Responsibility

Detect Problems

---

# Repair Agent

## Purpose

Fix only broken sections.

Do not regenerate everything.

### Input

```json
{
  "validation_report": {}
}
```

### Output

```json
{
  "repair_actions": [
    "Added email column to contacts table"
  ]
}
```

or

```json
{
  "repaired_spec": {}
}
```

### Responsibility

Fix Problems

---

# Code Generation Agent

## Purpose

Convert validated specifications into code.

### Input

Validated Schemas

### Output

```json
{
  "generated_project": {
    "frontend": [],
    "backend": [],
    "database": []
  }
}
```

Example:

```text
Dashboard.jsx
Contacts.jsx

auth.py
contacts.py

schema.sql
```

### Responsibility

Validated Specification → Code

---

# LangGraph Pattern

The project follows:

## Primary Pattern

Custom Workflow

```text
Intent
 ↓
Design
 ↓
Schema Generation
 ↓
Validation
 ↓
Repair
 ↓
Code Generation
```

## Secondary Pattern

Subagents

```text
Design Agent
      ↓
 ┌────────────┬────────────┬────────────┬────────────┐
 │ UI Agent   │ API Agent  │ DB Agent   │ Auth Agent │
 └────────────┴────────────┴────────────┴────────────┘
```

---

# LangGraph State Design

All nodes share the same state.

Nodes do NOT have different state types.

Each node only updates fields it owns.

## State

```python
from typing import TypedDict

class AppState(TypedDict):

    query: str

    intent: dict | None

    design: dict | None

    ui_schema: dict | None

    api_schema: dict | None

    db_schema: dict | None

    auth_schema: dict | None

    validation_report: dict | None

    repaired_spec: dict | None

    generated_project: dict | None
```

---

# Important LangGraph Insight

Wrong Mental Model:

```text
Intent Agent Output
    ↓
UI Agent Input
```

Correct Mental Model:

```text
Shared State

Intent Agent
    ↓
updates state

Design Agent
    ↓
updates state

UI Agent
    ↓
reads state
updates state
```

Every node receives the same state.

Every node returns only the fields it modifies.

---

# Validation Rules

Examples:

## Rule 1

API fields must exist in DB.

## Rule 2

UI fields must exist in API.

## Rule 3

Auth roles must exist in system roles.

## Rule 4

Pages must map to workflows.

---

# Runtime Verification

After code generation:

```text
Generated Code
      ↓
Runtime Verification
```

Checks:

* Build success
* Missing imports
* Route validity
* Schema consistency

---

# Testing Strategy

Use pytest.

## Unit Tests

Intent Agent

Design Agent

UI Agent

API Agent

DB Agent

Validation Agent

Repair Agent

---

# AWS Integration

Planned Deployment:

```text
React Frontend
        ↓
S3

FastAPI Backend
        ↓
EC2

PostgreSQL
        ↓
RDS
```

Future:

```text
Docker
        ↓
AWS ECS/Fargate
```

---

# Docker

Recommended but not mandatory.

Benefits:

* Reproducibility
* Dependency management
* Easier deployment

---

# Resume Summary

Built an AI-powered software generation compiler using LangGraph and LLMs that transforms natural language requirements into validated UI, API, database, and authorization schemas. Implemented multi-agent orchestration, schema validation, automated repair mechanisms, code generation, unit testing, and cloud deployment workflows.

