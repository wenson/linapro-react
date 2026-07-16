<div align="center">
<img src="https://linapro.ai/img/linapro-logo.png?v=0.5.0" width="300" alt="linapro logo"/>

[![LinaPro CI](https://github.com/linaproai/linapro/actions/workflows/main-ci.yml/badge.svg?v=0.5.0)](https://github.com/linaproai/linapro/actions/workflows/main-ci.yml)
[![LinaPro Stable Release](https://img.shields.io/github/v/release/linaproai/linapro?style=flat&v=0.5.0)](https://github.com/linaproai/linapro/releases)
[![LinaPro License](https://img.shields.io/badge/license-apache%202.0-green.svg?style=flat&v=0.5.0)](https://github.com/linaproai/linapro)
[![LinaPro Is Production Ready](https://img.shields.io/badge/production-ready-blue.svg?style=flat&v=0.5.0)](https://github.com/linaproai/linapro)


[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?v=0.5.0)](https://react.dev/)
[![Go](https://img.shields.io/badge/Go-1.25+-00ADD8.svg?v=0.5.0)](https://golang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?v=0.5.0)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?v=0.5.0)](https://vitejs.dev/)
[![GoFrame](https://img.shields.io/badge/GoFrame-v2-00ADD8.svg?v=0.5.0)](https://goframe.org/)
[![Semi Design](https://img.shields.io/badge/Semi_Design-2.x-0064FA.svg?v=0.5.0)](https://semi.design/)

English | [简体中文](README.zh-CN.md)

</div>

# Overview

`LinaPro` is an **AI-native full-stack framework built for sustainable delivery**. It brings together an evidence-driven AI development workflow, a comprehensive AI skill system spanning the entire development lifecycle, a complete plugin runtime, and an integrated full-stack design — with enterprise-grade capabilities like access control, system configuration, and job scheduling built right in.

Teams can skip the infrastructure-from-scratch phase and put AI to work driving real business development from day one.

# Quick Links

| Resource | URL |
|----------|-----|
| **Repository** | https://github.com/linaproai/linapro |
| **Live Demo** | https://demo.linapro.ai/admin <br/>Username: `admin` <br/>Password: `admin123` |
| **Website** | https://linapro.ai/ |

# Core Capabilities

`LinaPro` is designed for individual developers, engineering teams, and enterprises. Here's what it brings to the table:

- **AI-native development workflow**: Uses design documents, frozen tasklists, stage evidence, automated tests, and mandatory review to keep AI-led implementation traceable while the team controls direction and key decisions.
- **A rich AI skill ecosystem**: Over a dozen built-in AI skills cover the full development lifecycle — backend development, frontend design, test writing, code review, performance auditing, version upgrades, and more. AI makes framework-aware decisions in every context without needing to be re-briefed each session.
- **Fast business development**: A batteries-included management workspace and a rich set of built-in modules dramatically shorten the path from zero to production.
- **Integrated full-stack design**: Frontend and backend are designed as a unified whole — API contracts, permission models, and design conventions are fully aligned, with no manual cross-framework integration overhead.
- **Complete API documentation**: All host and plugin API endpoints are automatically aggregated and exposed as a single browsable, debuggable doc site.
- **Extensible plugin ecosystem**: A dual-mode plugin system — source plugins and `WASM` dynamic plugins — lets any capability be extended or replaced. Product plugins live under `apps/lina-plugins` and are versioned together with the product for atomic development and delivery.
- **Multi-tenant support**: Native multi-tenant capability with an official multi-tenant management plugin. When the plugin is not enabled, the system automatically falls back to single-tenant mode with zero migration cost.
- **Enterprise-grade governance**: JWT authentication paired with a declarative RBAC permission system, plus built-in operation logs, login logs, and session management for comprehensive auditability.
- **Distribution-ready by design**: Built-in distributed locking, key-value caching, and horizontal scaling. Cluster mode is coordinated via Redis for high availability — no changes to business code required.

# Architecture

```mermaid
graph TB
    subgraph Workflow["AI Development Workflow  docs/"]
        direction LR
        Clarify["🔍 Clarify"] --> Design["🧭 Design"] --> Plan["📋 Freeze Tasklist"] --> Implement["⚙️ Implement"] --> Verify["✅ Verify"] --> Review["🔎 Review"]
    end

    subgraph Frontend["Management Workspace  apps/lina-web"]
        UI["React 19 + Semi Design + TypeScript"]
    end

    subgraph Host["Core Host Service  lina-core"]
        direction TB
        API["API Layer\n(g.Meta route definitions + DTO)"]
        Ctrl["Controller Layer\n(HTTP request handling)"]
        Svc["Service Layer\n(core business logic)"]
        Plugin["Plugin Runtime\n(lifecycle orchestration · sandbox isolation)"]
        Tenant["Native Multi-Tenant\n(bizctx · tenant_id)"]
        Gov["Governance\n(JWT · RBAC · Logs · Sessions)"]
        API --> Ctrl --> Svc
        Svc --> Plugin
        Svc --> Tenant
        Svc --> Gov
    end

    subgraph Plugins["Plugin System  apps/lina-plugins"]
        direction LR
        Source["Source Plugins\ncompiled with host"]
        Dynamic["WASM Dynamic Plugins\nhot-loaded at runtime"]
    end

    DB[("Data Store\nPostgreSQL")]
    Redis[("Cluster Coordination\nRedis")]

    Workflow -.->|evidence-driven| Frontend
    Workflow -.->|evidence-driven| Host
    UI -->|HTTP| API
    Plugin -->|compiled load| Source
    Plugin -->|sandbox execution| Dynamic
    Svc --> DB
    Gov --> DB
    Svc -.->|cluster.enabled=true| Redis
```

# Screenshots

<table>
  <tr>
    <td><img src="https://linapro.ai/img/preview/linapro-i18n.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-plugin.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-apidoc.webp?v=0.5.0" /></td>
  </tr>
  <tr>
    <td><img src="https://linapro.ai/img/preview/linapro-menu.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-cron.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-monitor.webp?v=0.5.0" /></td>
  </tr>
  <tr>
    <td><img src="https://linapro.ai/img/preview/linapro-sysconfig.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-user.webp?v=0.5.0" /></td>
    <td><img src="https://linapro.ai/img/preview/linapro-multitenant-select.webp?v=0.5.0" /></td>
  </tr>
</table>

# Tech Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Backend Language | `Go` | `v1.25.0` |
| Backend Framework | `GoFrame` | `v2.10.1` — routing, ORM, configuration, and more |
| Frontend Framework | `React 19` | Single host workspace under `apps/lina-web` |
| Frontend UI | `Semi Design 2` | Host components, icons, locale, and theme |
| Build Tool | `Vite 7` | React development and production builds |
| Database | `PostgreSQL` | Default data store |
| Plugin Runtime | `WebAssembly` | `tetratelabs/wazero`, powering WASM dynamic plugins |
