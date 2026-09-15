# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Both field workers and office administrators. Field workers collect data on-site, typically in environments with low connectivity, while administrators review PSB earthing reports in the office.

## Product Purpose
The product provides an end-to-end workflow from field data collection to final compliance reporting. It digitizes paper-based PSB earthing surveys, supporting offline capabilities and photo evidence collection in the field. For the office, it provides a centralized dashboard to analyze the earthing data and seamlessly generate official Excel reports.

## Positioning
A specialized, end-to-end digital compliance tool that seamlessly bridges offline, on-site mobile data collection with precise, automated legacy Excel report generation.

## Operating Context
Field workers operate on mobile devices in environments where internet connectivity is unreliable or non-existent, requiring offline functionality to capture survey data and photos. Office administrators operate in standard office environments on desktop/laptops to review data and generate compliance reports.

## Capabilities and Constraints
- Must support offline data entry and sync later.
- Must generate exact replicas of the legacy Excel reports (`psb-earthing-report-25-26.xlsx`).
- Supabase database schema and existing data models cannot be changed.
- The web app must work well on mobile devices with low connectivity.

## Evidence on Hand
- Legacy Excel templates (`psb-earthing-report-25-26.xlsx`, `excel-without-dates.xlsx`, `branch details.xlsx`).
- Existing Supabase database and active Next.js codebase.

## Product Principles
- **Field-First Reliability**: The mobile interface and offline capabilities must be robust enough to never block on-site surveyors.
- **Reporting Fidelity**: Excel output must strictly replicate legacy templates to ensure compliance.
- **Seamless Workflow**: The transition from field data collection to office review and generation must be unified and centralized.
