# 💰 Cash Pickup & Agent Management Feature Specification

## 📌 Overview
Complete redesign of transaction details page with cash pickup flow, agent assignment system, and pickup code verification.

---

## 🗄️ Database Schema Changes

### 1. New Table: `Agent`
```prisma
model Agent {
  id                  Int       @id @default(autoincrement())
  fullName            String
  phone               String    @unique
  whatsapp            String?
  email               String?   @unique
  city                String    // Pickup city they serve
  country             String    @default("SD") // Country code
  
  // Status & Limits
  status              AgentStatus @default(ACTIVE)
  maxDailyAmount      Decimal   @default(50000) @db.Decimal(15, 2)
  maxPerTransaction   Decimal   @default(10000) @db.Decimal(15, 2)
  currentDailyAmount  Decimal   @default(0) @db.Decimal(15, 2)
  
  // Metadata
  notes               String?   @db.Text
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdBy           Int?
  
  // Relations
  assignedTransactions Transaction[] @relation("AgentTransactions")
  pickupConfirmations  PickupConfirmation[]
  
  @@index([city, status])
  @@index([isActive])
}

enum AgentStatus {
  ACTIVE
  SUSPENDED
  OUT_OF_CASH
  ON_HOLD
  INACTIVE
}
```

### 2. New Table: `PickupConfirmation`
```prisma
model PickupConfirmation {
  id                Int       @id @default(autoincrement())
  transactionId     Int       @unique
  transaction       Transaction @relation(fields: [transactionId], references: [id])
  
  pickupCode        String    @unique // 4-6 digit code
  agentId           Int
  agent             Agent     @relation(fields: [agentId], references: [id])
  
  // Verification
  isVerified        Boolean   @default(false)
  verifiedAt        DateTime?
  verifiedByAgentId Int?
  
  // Delivery proof
  deliveryNotes     String?   @db.Text
  receiptUrl        String?   // Future: agent uploads receipt
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([pickupCode])
  @@index([agentId])
}
```

### 3. Update `Transaction` Model
```prisma
model Transaction {
  // ... existing fields ...
  
  // Cash Pickup Fields
  pickupCity        String?   // Required for cash pickup
  assignedAgentId   Int?
  assignedAgent     Agent?    @relation("AgentTransactions", fields: [assignedAgentId], references: [id])
  pickupConfirmation PickupConfirmation?
  
  // Rejection Details
  rejectionReason   String?   @db.Text
  rejectionCategory String?   // "INCORRECT_DATA", "KYC_INCOMPLETE", "FRAUD", "LIMIT_EXCEEDED", "OTHER"
  rejectedBy        Int?
  rejectedAt        DateTime?
  
  // Enhanced receiver info (JSON for flexibility)
  receiverDetails   Json?     // Store dynamic fields based on country/method
}
```

### 4. New Transaction Status
```prisma
enum TransactionStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  READY_FOR_PICKUP  // NEW
  COMPLETED
  REJECTED
  CANCELLED
}
```

---

## 🔧 Backend Implementation

### Phase 1: Agent Service

**File:** `backend/src/services/agentService.ts`

```typescript
import prisma from '../lib/prisma';
import { Agent, AgentStatus } from '@prisma/client';

export const agentService = {
  // Create agent
  async createAgent(data: {
    fullName: string;
    phone: string;
    whatsapp?: string;
    email?: string;
    city: string;
    country?: string;
    maxDailyAmount?: number;
    maxPerTransaction?: number;
    notes?: string;
    createdBy: number;
  }) {
    return await prisma.agent.create({ data });
  },

  // Get agents by city
  async getAgentsByCity(city: string, status: AgentStatus = 'ACTIVE') {
    return await prisma.agent.findMany({
      where: {
        city,
        status,
        isActive: true
      },
      include: {
        _count: {
          select: {
            assignedTransactions: {
              where: {
                status: { in: ['APPROVED', 'READY_FOR_PICKUP'] }
              }
            }
          }
        }
      }
    });
  },

  // Check agent availability
  async checkAgentAvailability(agentId: number, amount: number) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    
    if (!agent || !agent.isActive || agent.status !== 'ACTIVE') {
      return { available: false, reason: 'Agent not available' };
    }

    if (amount > agent.maxPerTransaction) {
      return { available: false, reason: 'Amount exceeds agent limit' };
    }

    if (agent.currentDailyAmount + amount > agent.maxDailyAmount) {
      return { available: false, reason: 'Agent daily limit reached' };
    }

    return { available: true };
  },

  // Update agent daily amount
  async updateDailyAmount(agentId: number, amount: number) {
    return await prisma.agent.update({
      where: { id: agentId },
      data: {
        currentDailyAmount: { increment: amount }
      }
    });
  },

  // Reset daily amounts (run daily via cron)
  async resetDailyAmounts() {
    return await prisma.agent.updateMany({
      data: { currentDailyAmount: 0 }
    });
  }
};
```

### Phase 2: Pickup Code Service

**File:** `backend/src/services/pickupCodeService.ts`

```typescript
import prisma from '../lib/prisma';
import crypto from 'crypto';

export const pickupCodeService = {
  // Generate unique pickup code
  generatePickupCode(): string {
    return crypto.randomInt(100000, 999999).toString(); // 6-digit code
  },

  // Create pickup confirmation
  async createPickupConfirmation(
    transactionId: number,
    agentId: number
  ) {
    let pickupCode = this.generatePickupCode();
    
    // Ensure uniqueness
    let exists = await prisma.pickupConfirmation.findUnique({
      where: { pickupCode }
    });
    
    while (exists) {
      pickupCode = this.generatePickupCode();
      exists = await prisma.pickupConfirmation.findUnique({
        where: { pickupCode }
      });
    }

    return await prisma.pickupConfirmation.create({
      data: {
        transactionId,
        agentId,
        pickupCode
      },
      include: {
        agent: true,
        transaction: {
          include: {
            user: true
          }
        }
      }
    });
  },

  // Verify pickup code
  async verifyPickupCode(
    pickupCode: string,
    agentId: number
  ) {
    const confirmation = await prisma.pickupConfirmation.findUnique({
      where: { pickupCode },
      include: {
        transaction: true,
        agent: true
      }
    });

    if (!confirmation) {
      throw new Error('Invalid pickup code');
    }

    if (confirmation.agentId !== agentId) {
      throw new Error('Unauthorized agent');
    }

    if (confirmation.isVerified) {
      throw new Error('Pickup already confirmed');
    }

    // Mark as verified
    return await prisma.pickupConfirmation.update({
      where: { id: confirmation.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedByAgentId: agentId
      }
    });
  }
};
```

### Phase 3: Enhanced Transaction Service

**File:** `backend/src/services/transactionService.ts` (additions)

```typescript
// Add to existing transactionService

async assignAgent(
  transactionId: number,
  agentId: number,
  adminId: number
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { user: true }
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.payoutMethod !== 'CASH_PICKUP') {
    throw new Error('Not a cash pickup transaction');
  }

  if (!transaction.pickupCity) {
    throw new Error('Pickup city not specified');
  }

  // Check agent availability
  const availability = await agentService.checkAgentAvailability(
    agentId,
    transaction.amountReceived
  );

  if (!availability.available) {
    throw new Error(availability.reason);
  }

  // Assign agent and create pickup confirmation
  const [updatedTransaction, pickupConfirmation] = await prisma.$transaction([
    prisma.transaction.update({
      where: { id: transactionId },
      data: {
        assignedAgentId: agentId,
        status: 'READY_FOR_PICKUP',
        updatedAt: new Date()
      }
    }),
    pickupCodeService.createPickupConfirmation(transactionId, agentId)
  ]);

  // Update agent daily amount
  await agentService.updateDailyAmount(agentId, transaction.amountReceived);

  // Send notification to user
  await notificationService.sendPickupReadyNotification(
    transaction.user,
    pickupConfirmation
  );

  // Log audit
  await logAdminAction({
    adminId,
    action: 'ASSIGN_AGENT',
    entity: 'TRANSACTION',
    entityId: transactionId,
    newValue: { agentId, pickupCode: pickupConfirmation.pickupCode }
  });

  return { transaction: updatedTransaction, pickupConfirmation };
},

async rejectTransaction(
  transactionId: number,
  adminId: number,
  data: {
    rejectionCategory: string;
    rejectionReason: string;
    adminNotes?: string;
  }
) {
  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'REJECTED',
      rejectionCategory: data.rejectionCategory,
      rejectionReason: data.rejectionReason,
      adminNotes: data.adminNotes,
      rejectedBy: adminId,
      rejectedAt: new Date()
    },
    include: { user: true }
  });

  // Send rejection notification
  await notificationService.sendTransactionRejectedNotification(
    transaction.user,
    transaction
  );

  return transaction;
}
```

---

## 🎨 Frontend Implementation

### Phase 1: Transaction Details Page

**File:** `frontend/src/app/admin/transactions/[id]/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, DollarSign, MapPin, Calendar, 
  Clock, CheckCircle, XCircle, AlertCircle,
  Phone, Mail, Building, CreditCard, Hash
} from 'lucide-react';

export default function TransactionDetailsPage() {
  const params = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  // Component structure:
  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <TransactionHeader transaction={transaction} />
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          <SenderInfoCard sender={transaction?.user} />
          <TransactionSummaryCard transaction={transaction} />
          <ReceiverInfoCard 
            receiver={transaction?.receiverDetails}
            payoutMethod={transaction?.payoutMethod}
            payoutCurrency={transaction?.payoutCurrency}
          />
          
          {/* Cash Pickup Section */}
          {transaction?.payoutMethod === 'CASH_PICKUP' && (
            <CashPickupCard transaction={transaction} />
          )}
        </div>

        {/* Right Column - Actions & Timeline */}
        <div className="space-y-6">
          <QuickActionsPanel transaction={transaction} />
          <TransactionTimeline transaction={transaction} />
          <AuditLogCard transactionId={transaction?.id} />
        </div>
      </div>
    </div>
  );
}
```

### Phase 2: Dynamic Receiver Info Component

**File:** `frontend/src/components/admin/transactions/ReceiverInfoCard.tsx`

```typescript
export function ReceiverInfoCard({ receiver, payoutMethod, payoutCurrency }) {
  const getFieldsToDisplay = () => {
    const country = payoutCurrency?.substring(0, 2); // Assuming currency code starts with country
    
    // India
    if (country === 'IN') {
      if (payoutMethod === 'UPI') {
        return ['fullName', 'phone', 'upiId', 'qrCode'];
      }
      if (payoutMethod === 'IMPS') {
        return ['fullName', 'phone', 'accountNumber', 'ifscCode'];
      }
      if (payoutMethod === 'BANK_TRANSFER') {
        return ['fullName', 'phone', 'bankName', 'branch', 'accountNumber', 'ifscCode'];
      }
    }
    
    // Sudan
    if (country === 'SD') {
      if (payoutMethod === 'CASH_PICKUP') {
        return ['fullName', 'phone', 'pickupCity'];
      }
      if (payoutMethod === 'BANK_TRANSFER') {
        return ['fullName', 'accountNumber', 'branch'];
      }
    }
    
    // UAE
    if (country === 'AE') {
      if (payoutMethod === 'CASH_PICKUP') {
        return ['fullName', 'phone', 'emirate', 'idType', 'idNumber'];
      }
      if (payoutMethod === 'BANK_TRANSFER') {
        return ['fullName', 'phone', 'iban', 'bankName'];
      }
    }
    
    // Default fields
    return ['fullName', 'phone', 'accountNumber'];
  };

  const fields = getFieldsToDisplay();
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold mb-4">معلومات المستلم</h3>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(field => (
          <FieldDisplay key={field} field={field} value={receiver?.[field]} />
        ))}
      </div>
    </div>
  );
}
```

### Phase 3: Agent Assignment Modal

**File:** `frontend/src/components/admin/transactions/AssignAgentModal.tsx`

```typescript
export function AssignAgentModal({ transaction, onClose, onAssign }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch agents for the pickup city
    fetchAgents(transaction.pickupCity);
  }, [transaction.pickupCity]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      await apiClient.assignAgent(transaction.id, selectedAgent.id);
      onAssign();
      onClose();
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">تعيين وكيل</h2>
        <p className="text-sm text-slate-600 mb-4">
          المدينة: {transaction.pickupCity}
        </p>

        <div className="space-y-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedAgent?.id === agent.id}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAssign}
            disabled={!selectedAgent || loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'جاري التعيين...' : 'تعيين الوكيل'}
          </button>
          <button onClick={onClose} className="btn-secondary">
            إلغاء
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### Phase 4: Agents Management Page

**File:** `frontend/src/app/admin/agents/page.tsx`

```typescript
export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">إدارة الوكلاء</h1>
        <button className="btn-primary">
          <Plus className="w-5 h-5 ml-2" />
          إضافة وكيل جديد
        </button>
      </div>

      <AgentsTable />
    </div>
  );
}
```

---

## 📧 Notification Templates

### Pickup Ready Notification

**File:** `backend/src/services/emailService.ts` (add template)

```typescript
pickup_ready: {
  ar: {
    subject: 'طلبك جاهز للاستلام - راصد',
    body: `مرحباً {{name}}،

طلب التحويل الخاص بك جاهز للاستلام!

📍 معلومات الاستلام:
• الوكيل: {{agentName}}
• رقم الهاتف: {{agentPhone}}
• المدينة: {{pickupCity}}
• المبلغ: {{amount}} {{currency}}

🔐 رمز الاستلام: {{pickupCode}}

⚠️ مهم:
- احتفظ برمز الاستلام سرياً
- أحضر بطاقة هويتك الشخصية
- الرمز صالح لمدة 30 يوماً

للاستلام، اتصل بالوكيل وقدم رمز الاستلام.

مع تحيات،
فريق راصد`
  }
}
```

---

## 🗺️ Implementation Roadmap

### Week 1: Database & Backend Foundation
- [ ] Create Prisma migrations for Agent and PickupConfirmation models
- [ ] Update Transaction model
- [ ] Implement agentService
- [ ] Implement pickupCodeService
- [ ] Add agent CRUD endpoints

### Week 2: Transaction Flow Enhancement
- [ ] Update transaction service with agent assignment
- [ ] Implement rejection flow with categories
- [ ] Add pickup code generation
- [ ] Create notification templates
- [ ] Test backend flows

### Week 3: Admin UI - Transaction Details
- [ ] Redesign transaction details page
- [ ] Implement dynamic receiver info display
- [ ] Add rejection modal
- [ ] Add agent assignment modal
- [ ] Implement timeline component

### Week 4: Agents Management
- [ ] Create agents list page
- [ ] Create agent profile page
- [ ] Implement agent CRUD operations
- [ ] Add agent assignment UI
- [ ] Testing and refinement

### Week 5: Polish & Future-Proofing
- [ ] Add audit logging
- [ ] Implement pickup code verification endpoint (for future agent portal)
- [ ] Add receipt upload capability
- [ ] Documentation
- [ ] End-to-end testing

---

## 🔐 Security Considerations

1. **Pickup Code Security**
   - 6-digit codes with uniqueness check
   - One-time use only
   - Expiration after 30 days
   - Rate limiting on verification attempts

2. **Agent Access Control**
   - Future agent portal will require separate authentication
   - Agents can only verify codes assigned to them
   - All actions logged in audit trail

3. **Data Privacy**
   - Receiver details encrypted at rest
   - Agent phone numbers masked in public views
   - PII access logged

---

## 📊 Success Metrics

- Transaction processing time reduced by 40%
- Agent assignment time < 2 minutes
- Pickup code generation success rate 100%
- Zero duplicate pickup codes
- Agent daily limit enforcement 100% accurate

---

## 🚀 Next Steps

Would you like me to:
1. **Start with database migrations** and create the Prisma schema?
2. **Implement the backend services** first (Agent, PickupCode)?
3. **Build the frontend components** starting with transaction details?
4. **Create a minimal working prototype** of one complete flow?

This is a large feature - I recommend implementing it in phases to ensure quality and allow for testing at each stage.
