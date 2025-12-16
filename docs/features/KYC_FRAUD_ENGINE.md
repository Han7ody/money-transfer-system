# KYC Review & Fraud Detection Engine

## Overview

The KYC (Know Your Customer) Review and Fraud Detection Engine provides admins with a comprehensive system to review user identity documents, detect potential fraud, and make informed decisions about user verification.

## Features

### 1. KYC Review Queue
- **Smart Sorting**: Automatically prioritizes high-risk users and submissions older than 48 hours
- **Filtering**: Filter by country, document type, risk level, and search by name/email/phone
- **Real-time Stats**: Dashboard showing pending, approved, rejected, and escalated cases
- **Batch Actions**: Support for bulk operations (future enhancement)

### 2. Document Review Interface
- **Split-Screen Layout**: User info on left, document viewer on right
- **Document Viewer Features**:
  - Zoom (50% - 200%)
  - Rotate documents
  - Side-by-side comparison mode
  - Support for multiple document types (ID front/back, selfie)

### 3. Fraud Detection System

#### Automatic Fraud Scoring
The system automatically calculates a fraud risk score (0-100) based on:

| Match Type | Score | Description |
|------------|-------|-------------|
| Duplicate Document | +15 | Same passport/ID number found |
| Duplicate Email | +5 | Same email used by another account |
| Duplicate Phone | +5 | Same phone number used by another account |
| Nationality Mismatch | +10 | Document nationality ≠ user country |
| IP Match | +10 | Same IP address (future) |
| Device Fingerprint | +10 | Same device detected (future) |

#### Risk Levels
- **Low Risk**: 0-49 (Green badge)
- **Medium Risk**: 50-79 (Yellow badge)
- **High Risk**: 80-100 (Red badge)

### 4. Admin Actions

#### One-Click Decisions
- **Approve** (Keyboard: A)
  - Approves KYC and enables full account access
  - Shows warning if fraud score ≥ 80
  - Sends approval email to user
  
- **Reject** (Keyboard: R)
  - Rejects KYC with reason
  - User must resubmit documents
  - Sends rejection email with reason
  
- **Request More Documents** (Keyboard: M)
  - Resets KYC status to NOT_SUBMITTED
  - Sends email requesting additional documents
  - Provides reason templates
  
- **Escalate to Compliance** (Keyboard: E)
  - Flags case for senior review
  - Logs escalation reason
  - Notifies compliance team (future)

#### Reason Templates
Pre-defined templates for common scenarios:
- Document unclear or blurry
- Document expired
- Information mismatch
- Suspected fraud
- Additional verification required

### 5. Review Notes & Audit Trail

#### Notes System
- Add threaded comments to any review
- Timestamped with admin ID
- Visible to all admins reviewing the case

#### Action History
Complete audit trail showing:
- Action taken (approve/reject/request/escalate)
- Admin who performed action
- Timestamp
- Reason provided
- Status changes

### 6. Fraud Match Detection

When reviewing a user, the system shows:
- **Duplicate Accounts**: Other users with matching information
- **Match Details**: What matched (document, email, phone, etc.)
- **Risk Contribution**: Score added by each match
- **Matched User Status**: KYC status of the duplicate account
- **Quick Actions**: View matched user profile in new tab

## API Endpoints

### Admin KYC Routes
```
GET    /api/admin/kyc/queue              - Get KYC review queue
GET    /api/admin/kyc/review/:id         - Get review details for user
GET    /api/admin/kyc/stats               - Get KYC statistics
POST   /api/admin/kyc/:id/approve         - Approve user KYC
POST   /api/admin/kyc/:id/reject          - Reject user KYC
POST   /api/admin/kyc/:id/request-more    - Request more documents
POST   /api/admin/kyc/:id/escalate        - Escalate to compliance
POST   /api/admin/kyc/:id/notes           - Add review note
POST   /api/admin/kyc/fraud-match/:matchId/resolve - Resolve fraud match
```

## Database Schema

### kyc_review_notes
```sql
id          SERIAL PRIMARY KEY
user_id     INTEGER NOT NULL
admin_id    INTEGER NOT NULL
message     TEXT NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
```

### kyc_action_logs
```sql
id          SERIAL PRIMARY KEY
user_id     INTEGER NOT NULL
admin_id    INTEGER NOT NULL
action      VARCHAR(50) NOT NULL
reason      TEXT
old_status  VARCHAR(50)
new_status  VARCHAR(50)
created_at  TIMESTAMP DEFAULT NOW()
```

### fraud_matches
```sql
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL
matched_user_id INTEGER NOT NULL
match_type      VARCHAR(50) NOT NULL
match_value     VARCHAR(500)
score           INTEGER NOT NULL
is_resolved     BOOLEAN DEFAULT FALSE
resolved_by     INTEGER
resolved_at     TIMESTAMP
created_at      TIMESTAMP DEFAULT NOW()
```

## Setup Instructions

### 1. Run Database Migration
```bash
node scripts/database/add-kyc-fraud-tables.js
```

### 2. Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### 3. Test Setup
```bash
node scripts/test-kyc-setup.js
```

### 4. Access Admin Panel
Navigate to: `/admin/users/kyc-queue`

## Keyboard Shortcuts

When reviewing a KYC submission:
- `A` - Approve
- `R` - Reject
- `M` - Request More Documents
- `E` - Escalate to Compliance

## Business Rules

1. **User Restrictions**: Users with pending/rejected KYC cannot make transfers
2. **High-Risk Warning**: Admins see warning when approving users with fraud score ≥ 80
3. **Automatic Detection**: Fraud detection runs automatically when review screen opens
4. **Queue Priority**: 
   - High risk (score ≥ 80) → Highest priority
   - Escalated cases → High priority
   - Pending >48h → Medium priority
   - New submissions → Normal priority

## Email Notifications

The system sends automatic emails for:
- KYC documents received (confirmation)
- KYC approved
- KYC rejected (with reason)
- More documents requested (with reason)

## Future Enhancements

- [ ] IP address tracking and matching
- [ ] Device fingerprinting
- [ ] Bulk approval/rejection
- [ ] Advanced document OCR and validation
- [ ] Machine learning fraud scoring
- [ ] Compliance team notification system
- [ ] Document expiry tracking
- [ ] Automated re-verification reminders

## Security Considerations

- All actions are logged with admin ID, timestamp, and IP address
- Fraud matches are stored for audit purposes
- High-risk approvals require explicit confirmation
- Document URLs are served through authenticated endpoints
- Sensitive data is never exposed in frontend logs

## Performance

- Queue loads 20 users per page by default
- Documents are lazy-loaded
- Fraud detection runs asynchronously
- Indexes on all foreign keys and frequently queried fields

## Support

For issues or questions:
1. Check audit logs for action history
2. Review fraud matches for duplicate detection issues
3. Verify email service is configured for notifications
4. Check Prisma schema matches database structure
