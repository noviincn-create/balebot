# BaleBot - HubSpot Contact Creation with Identity Verification

A multi-step contact creation flow that integrates HubSpot CRM with Iranian national identity verification (Zohal) and OTP verification.

## Workflow

```
┌─────────────────────────────────────────────────┐
│  1️⃣  Search Existing Contact (National Code)   │
│     Input: National Code                        │
│     Output: Contact Profile URL or "Not Found"  │
└─────────────────────────────────────────────────┘
                        │
                        ▼
          ┌─────────────────────────┐
          │ Found?                  │
          └────────┬──────────┬─────┘
                   │          │
                 YES         NO
                   │          │
                   ▼          ▼
            [Show Profile] ┌─────────────────────────────────┐
            [Return]       │  2️⃣  Identity Verification     │
                           │  Input: National Code + DOB    │
                           │  Call: Zohal API               │
                           │  Output: Verified Data         │
                           └─────────────────────────────────┘
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │ Verification Success?   │
                           └────────┬──────────┬─────┘
                                    │          │
                                  YES         NO
                                    │          │
                                    ▼          ▼
                        ┌──────────────────┐  [Show Error]
                        │  3️⃣  OTP Step    │  [Return]
                        │  Input: Mobile   │
                        │  Send: OTP SMS   │
                        │  Verify: Code    │
                        └──────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ OTP Valid?       │
                        └────┬──────┬─────┘
                             │      │
                           YES     NO
                             │      │
                             ▼      ▼
                  ┌────────────────┐ [Retry OTP]
                  │ 4️⃣  Create    │
                  │  Contact in   │
                  │  HubSpot      │
                  └────┬───────┬──┘
                       │       │
                      YES     NO
                       │       │
                       ▼       ▼
                  [Success]  [Error]
                  [Contact   [Show
                   URL]       Error]
```

## Tech Stack

- **Frontend**: React/Vue with Progressive Steps
- **Backend**: Cloudflare Worker (or Node.js)
- **APIs**:
  - HubSpot CRM API
  - Zohal National ID Service
  - SMS Provider (OTP)

## Setup

See documentation for detailed setup instructions.
