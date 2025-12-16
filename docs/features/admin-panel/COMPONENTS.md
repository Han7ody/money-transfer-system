# Admin Panel UI Components

## Transaction Detail Components

### Overview
Modular component architecture for transaction detail pages with comprehensive information display and action capabilities.

### Component List

#### 1. TransactionSummaryCard
**Purpose:** Display transaction overview and key metrics
**Location:** `frontend/src/components/admin/transactions/TransactionSummaryCard.tsx`
**Features:**
- Transaction reference and status
- Amount sent/received with currencies
- Exchange rate and fees
- Creation and completion dates

#### 2. SenderInfoCard
**Purpose:** Display sender information
**Features:**
- Sender name, phone, country
- User account details
- KYC status indicator

#### 3. ReceiverInfoCard
**Purpose:** Display recipient information
**Features:**
- Recipient name, phone, country
- Bank details (if bank transfer)
- Pickup location (if cash pickup)

#### 4. CashPickupCard
**Purpose:** Manage cash pickup transactions
**Features:**
- Assigned agent information
- Pickup code display
- Pickup status tracking
- Confirmation controls

#### 5. QuickActionsPanel
**Purpose:** Transaction action buttons
**Features:**
- Approve/Reject buttons
- Assign Agent button
- Confirm Pickup button
- Complete Transaction button
- Status-based visibility

#### 6. TransactionTimeline
**Purpose:** Visual transaction history
**Features:**
- Chronological event display
- Status change tracking
- Admin action history
- Timestamps for all events

#### 7. AuditLogCard
**Purpose:** Display audit trail
**Features:**
- Admin actions log
- IP address tracking
- Timestamp display
- Action details

#### 8. AssignAgentModal
**Purpose:** Agent assignment interface
**Features:**
- Available agents list
- City-based filtering
- Capacity indicators
- Assignment confirmation

#### 9. RejectModal
**Purpose:** Transaction rejection interface
**Features:**
- Rejection reason input
- Category selection
- Admin notes field
- Confirmation dialog

#### 10. ConfirmPickupModal
**Purpose:** Cash pickup confirmation
**Features:**
- Pickup code validation
- Agent verification
- Completion confirmation

## Component Architecture

### Design Principles
- **Modularity:** Each component handles single responsibility
- **Reusability:** Components can be used across different pages
- **Consistency:** Unified styling and behavior patterns
- **Accessibility:** Proper ARIA labels and keyboard navigation

### Styling Approach
- Tailwind CSS for utility-first styling
- Dark mode support via `dark:` classes
- RTL support for Arabic content
- Responsive design patterns

### State Management
- Local component state for UI interactions
- API calls via centralized `api.ts`
- Optimistic updates where appropriate
- Error handling and loading states

## Integration Example

```tsx
import TransactionSummaryCard from '@/components/admin/transactions/TransactionSummaryCard';
import QuickActionsPanel from '@/components/admin/transactions/QuickActionsPanel';
import TransactionTimeline from '@/components/admin/transactions/TransactionTimeline';

export default function TransactionDetailPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <TransactionSummaryCard transaction={transaction} />
        <QuickActionsPanel transaction={transaction} onAction={handleAction} />
        <TransactionTimeline history={history} />
      </div>
    </AdminLayout>
  );
}
```

## Status
✅ All components implemented and functional
✅ Dark mode support added
✅ RTL support maintained
✅ Responsive design verified

**Last Updated:** December 2024
