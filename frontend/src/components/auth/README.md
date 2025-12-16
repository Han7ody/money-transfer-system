# Registration Flow Components

This directory contains the redesigned registration flow components with world-class UI/UX.

## Components

### Core Components
- **AuthShell**: Main wrapper component with consistent layout and animations
- **StepHeader**: Progress indicator showing current step in the registration flow
- **PrimaryButton**: Main action button with loading states and animations
- **SecondaryButton**: Secondary action button
- **TextInput**: Enhanced input field with validation and animations
- **OtpInput**: Specialized component for OTP verification
- **FileUpload**: Drag-and-drop file upload with preview

### Features
- ✅ RTL Arabic layout support
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Framer Motion animations
- ✅ React Hook Form + Zod validation
- ✅ IBM Plex Sans Arabic font
- ✅ Modern blue gradient design system
- ✅ Accessibility compliant
- ✅ Loading states and error handling

## Registration Flow Steps

1. **Account Creation** (`/register`)
   - Full name, email, password validation
   - Password strength indicator
   - Real-time form validation

2. **Email Verification** (`/register/verify`)
   - 6-digit OTP input
   - Countdown timer for resend
   - Auto-focus between inputs

3. **Profile Information** (`/register/profile`)
   - Phone, country, city, date of birth, nationality
   - Age validation (18+)
   - Phone number format validation

4. **KYC Documents** (`/register/kyc`)
   - ID front/back and selfie upload
   - Drag-and-drop file upload
   - File type and size validation
   - Image preview

5. **Registration Complete** (`/register/status`)
   - Success animation
   - Status timeline
   - Next steps information

## Usage

```tsx
import { AuthShell, TextInput, PrimaryButton } from '@/components/auth';

export default function MyPage() {
  return (
    <AuthShell title="Page Title" subtitle="Description">
      <form>
        <TextInput
          label="Field Label"
          placeholder="Placeholder"
          error={errors.field}
          {...register('field')}
        />
        <PrimaryButton type="submit" loading={isSubmitting}>
          Submit
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
```