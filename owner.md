You are building the OWNER application for a production-ready gym management platform called ARK FIT.

IMPORTANT:
This prompt is ONLY for the GYM OWNER role.

Do NOT build Trainer or Member dashboards in this task.

ARK FIT is designed for an individual Indian gym with approximately 100–200 members.

The application must be:
- Fast
- Secure
- Simple
- Professional
- Mobile responsive
- Desktop responsive
- Low infrastructure cost
- Optimized to comfortably operate within Supabase Free Tier for a small individual gym

Do not over-engineer the application.

==================================================
TECH STACK
==================================================

Frontend:
- Next.js
- React
- JSX
- Tailwind CSS
- shadcn/ui
- Lucide icons

Backend / Database:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security

Client server-state:
- TanStack Query

Payments:
- Razorpay

Use server-side API routes / server actions / secure backend logic where appropriate.

Do NOT expose secret keys to the browser.

==================================================
CORE ARCHITECTURE
==================================================

Use Supabase PostgreSQL as the primary database.

Every gym-owned record must contain:

gym_id

This is critical for future SaaS expansion and tenant isolation.

Even though this version targets an individual gym, design the database so that every record is scoped to a gym.

Never trust gym_id sent by the client.

Determine the authenticated user's gym membership from secure server-side data / database relationships.

==================================================
AUTHENTICATION
==================================================

Use Supabase Auth.

There are three application roles:

OWNER
TRAINER
MEMBER

This Owner application should allow only OWNER access.

The gym owner creates trainer/member accounts.

For credentials created by the owner:

- Owner creates the account
- Temporary credentials are generated or assigned
- Trainer/member logs in
- Force password change on first login
- Never store plaintext passwords in application tables
- Never display existing passwords after creation
- Use Supabase Auth for password storage

Owner must NOT be able to retrieve a user's actual password.

Implement secure session handling.

Do not store authentication tokens in localStorage.

Use secure Supabase authentication/session mechanisms.

==================================================
SECURITY
==================================================

Implement Row Level Security on every tenant-sensitive table.

Owner can access only records belonging to their gym.

Example:

Owner from Gym A must never be able to query members from Gym B.

Do not rely only on frontend route protection.

Security must exist at database level.

Use:

- RLS
- Authenticated user identity
- Role checks
- gym_id isolation
- Server-side authorization
- Input validation
- Secure API routes

Never expose:

SUPABASE_SERVICE_ROLE_KEY

to the client.

Never expose:

RAZORPAY_KEY_SECRET

to the client.

Environment variables must be separated into public and server-only values.

==================================================
DATABASE
==================================================

Design normalized PostgreSQL tables.

Core tables:

profiles
gyms
gym_users
members
trainers
memberships
payments
attendance
pt_packages
pt_sessions
workout_templates
workout_plans
diet_plans
progress_records
progress_photos
member_notes
notifications

Do not create unnecessary tables.

Use foreign keys.

Use appropriate:

UUID primary keys
created_at
updated_at

Use database constraints for important business rules.

Use enums where appropriate for:

role
member_type
membership_status
payment_status
attendance_status
pt_session_status

==================================================
INDEXING
==================================================

Use indexes strategically.

Do NOT blindly index every column.

Important indexes should include combinations such as:

members(gym_id, status)

members(gym_id, member_type)

members(gym_id, trainer_id)

members(gym_id, membership_expiry)

attendance(gym_id, attendance_date)

attendance(gym_id, member_id, attendance_date)

payments(gym_id, status)

payments(gym_id, due_date)

pt_sessions(gym_id, trainer_id, session_date)

pt_sessions(gym_id, member_id, session_date)

Use indexes based on actual filtering and sorting patterns.

Avoid over-indexing because indexes consume database storage and slow writes.

==================================================
TANSTACK QUERY
==================================================

Use TanStack Query for authenticated server-state.

Use it for:

- Members
- Attendance
- Payments
- PT sessions
- Trainers
- Dashboard summaries
- Member profiles

Benefits expected:

- Query caching
- Avoid duplicate requests
- Background refetch
- Stale data management
- Loading state management
- Optimistic updates where safe
- Keep previous data during pagination/filter transitions

Use appropriate query keys.

Examples:

['members', gymId, filters]
['attendance', gymId, date]
['payments', gymId, filters]
['pt-sessions', gymId, date]
['member', gymId, memberId]

Do NOT set extremely long stale times for financial or sensitive information.

Do NOT continuously poll.

Use refetch only when necessary.

TanStack Query must NOT be treated as an authorization layer.

==================================================
OWNER DASHBOARD
==================================================

Create a clean dashboard.

The dashboard should answer:

"What needs my attention today?"

Do NOT build a dashboard with 20 charts.

Show:

Active Members

Today's Attendance

Fees Collected

Pending Fees

Then:

ACTION REQUIRED

Memberships expiring within 7 days

Pending payments

Members inactive for 10+ days

PT packages with 2 or fewer sessions remaining

Members without active workout plans

Each action must navigate to a pre-filtered list.

Example:

Click:

"6 inactive members"

→ Members screen with attendance filter applied.

==================================================
MEMBER MANAGEMENT
==================================================

Create:

Members

Search

Filters:

All
PT
Normal
Active
Expiring
Expired
Frozen

Additional filters:

Trainer
Payment status
Attendance

Desktop:

Use a clean table.

Mobile:

Use compact member cards.

Do not display unnecessary columns.

Use server-side pagination.

Do not load all 200 members if unnecessary.

Use page size around 20–50 depending on UX.

Search should query efficiently.

Avoid fetching unnecessary columns.

==================================================
MEMBER PROFILE
==================================================

Create a separate detailed member profile.

Show:

Name
Phone
Member type
Trainer
Membership
Attendance
Payment status
PT sessions
Workout
Diet
Progress

Use tabs:

Overview
Membership
Attendance
Payments
Workout
Diet
PT
Progress
Notes

Add:

Member Timeline

Keep the page organized.

Do not fetch every historical record at once.

Load tab-specific data when required.

==================================================
ATTENDANCE
==================================================

Create:

Today's Attendance

Present
Absent

Search

Filters:

Date
Trainer
Member Type
Status

Allow:

Mark Present
Mark Absent

Use database constraints to avoid duplicate attendance records for the same member/date where appropriate.

Create inactive-member filters:

7+ days
14+ days
30+ days

==================================================
PAYMENTS
==================================================

Payment screen:

Expected
Collected
Pending
Overdue

Filters:

Paid
Pending
Overdue

Actions:

Record Payment
View Payment
Send Reminder

Manual payment support:

Cash
UPI
Razorpay

==================================================
RAZORPAY SECURITY
==================================================

Razorpay integration MUST be server-side.

Never trust payment amount sent from the browser.

The server must determine:

member
gym
membership
amount

Create Razorpay orders from the server.

Store:

razorpay_order_id
razorpay_payment_id
amount
currency
status
member_id
gym_id

Verify Razorpay payment signatures server-side.

Implement Razorpay webhook handling.

Webhook endpoint must:

- Verify webhook signature
- Validate event
- Be idempotent
- Prevent duplicate payment records
- Store event/reference IDs
- Update payment status safely
- Never trust frontend "payment successful" state alone

Use database transactions where appropriate.

Payment status should ultimately be based on verified server-side information.

==================================================
IMAGE STORAGE
==================================================

Use Supabase Storage only for small optimized images.

Do NOT store workout videos in Supabase.

For member profile photos and progress photos:

- Compress on client before upload
- Resize large images
- Prefer WebP or AVIF where supported
- Set reasonable maximum dimensions
- Set file size limits
- Generate optimized thumbnails where useful
- Store private files
- Use signed URLs
- Never expose unrestricted public buckets for sensitive member photos

Do not upload original 5–10 MB phone photos.

Target optimized images around a few hundred KB whenever practical.

==================================================
FREE TIER OPTIMIZATION
==================================================

Design specifically for a small gym.

Avoid:

- Supabase Realtime
- WebSockets
- Continuous polling
- Video storage
- Huge images
- Large exports
- Unnecessary background jobs
- Excessive database queries
- SELECT *
- N+1 queries

Use:

- Pagination
- Indexes
- Selective columns
- Aggregated queries
- Client caching
- Image compression
- Lazy loading
- Query deduplication
- Efficient joins
- Batched operations when appropriate

The application should remain lightweight enough for approximately 100–200 members.

==================================================
HTTP / NETWORK OPTIMIZATION
==================================================

Optimize network usage.

Avoid requesting data that is already available.

Use TanStack Query caching.

Use appropriate HTTP caching headers.

Public immutable assets can use long-lived cache headers.

Authenticated sensitive data must use private/no-store or appropriately short-lived caching.

Do not cache payment/member-sensitive API responses publicly.

Use ETag / conditional requests where appropriate.

Compress JSON responses where supported by the deployment platform.

Avoid huge JSON payloads.

Return only required fields.

Use pagination.

==================================================
OWNER TRAINER MANAGEMENT
==================================================

Owner can:

Create trainer
Deactivate trainer
Edit trainer
Assign members
View trainer workload

When creating trainer credentials:

Create secure temporary authentication credentials.

Force password change after first login.

Never store passwords in profiles.

==================================================
UI
==================================================

The UI must be:

Clean
Professional
Simple
Fast
Minimal

Desktop:

Left sidebar.

Mobile:

Bottom navigation.

Owner navigation:

Dashboard
Members
Attendance
Payments
PT
Trainers
More

Do not put every feature on the dashboard.

Each page has one purpose.

Use clear filters.

Use search.

Use empty states.

Use loading skeletons.

Use error states.

Use confirmation dialogs for destructive actions.

==================================================
RESPONSIVE
==================================================

Desktop:

Optimized for laptop screens.

Mobile:

Optimized for phones.

Do not simply shrink desktop.

Tables become cards/list rows.

Filters become mobile bottom sheets.

Buttons remain touch-friendly.

==================================================
PERFORMANCE
==================================================

Target fast initial navigation.

Use:

- Next.js code splitting
- Lazy loading for heavy components
- TanStack Query caching
- Pagination
- Selective database queries
- Database indexes
- Optimized images
- Minimal JavaScript
- Avoid unnecessary client components
- Prefer server components where interactive state is not needed

Do not turn the entire application into a client component.

==================================================
FINAL OWNER DELIVERABLE
==================================================

Build only the OWNER application.

Screens:

Login
Dashboard
Members
Member Profile
Attendance
Payments
Payment Details
PT Management
Trainers
Workout Overview
Reports
Settings

Create desktop and mobile responsive layouts.

The final application should feel like a real production SaaS product, not a UI demo.

Prioritize:

Security
Performance
Simplicity
Low infrastructure cost
Maintainability
Clean UX
Indian gym workflows