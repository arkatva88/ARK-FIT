Build the MEMBER application for ARK FIT.

IMPORTANT:

This prompt is ONLY for the MEMBER role.

Do NOT build Owner screens.

Do NOT build Trainer screens.

The member application is a simple mobile-first fitness companion.

The member should open ARK FIT and immediately understand:

"What should I do today?"

==================================================
TECH STACK
==================================================

Next.js
React
JSX
Tailwind CSS
shadcn/ui
Lucide icons

Supabase:
PostgreSQL
Auth
Storage
RLS

TanStack Query:
Server-state caching
Request deduplication
Background refetch
Mutations

Razorpay:
Secure membership payment integration

==================================================
AUTH
==================================================

Member accounts are created by the gym owner.

Owner provides temporary credentials.

Member logs in.

First login:

Force password change.

Use Supabase Auth.

Never store passwords in application database tables.

Never expose passwords.

Never store authentication tokens in localStorage.

Member must only access their own data.

This must be enforced through Supabase RLS.

A member must never be able to manipulate member_id or gym_id to access another member.

Never rely on frontend authorization.

==================================================
MEMBER HOME
==================================================

The most important screen.

Header:

Good morning, Rahul

Membership:

ACTIVE

Expires:

28 Sep 2026

Today's Workout:

Chest + Triceps

4 Exercises

[Start Workout]

If PT member:

TODAY'S PT

06:00 AM

Trainer:
Arjun

[View Session]

Then:

Attendance
82%

Current Weight
76 kg

Keep the page short.

Do not show large analytics.

==================================================
WORKOUT
==================================================

Today's Workout:

Chest + Triceps

Bench Press
4 × 10

Incline DB Press
3 × 12

Cable Fly
3 × 15

Tricep Pushdown
3 × 12

Each exercise:

Sets
Reps
Rest
Instructions
Optional video link

Allow:

Mark Completed

Do not upload workout videos to Supabase.

Use external video URLs if needed.

==================================================
PT
==================================================

Upcoming PT:

18 Sep
06:00 AM

Trainer:
Arjun

Session:
8 / 12

Actions:

View Workout

History:

Completed
Completed
Missed
Completed

Only show the member's own PT sessions.

==================================================
DIET
==================================================

My Diet

Goal:
Muscle Gain

Calories:
2600 kcal

Protein:
140g

Breakfast
Lunch
Snack
Dinner

The member should primarily view the trainer-assigned plan.

Do not build complex calorie tracking.

==================================================
PROGRESS
==================================================

Show:

Weight

72 kg → 76 kg

Goal:

78 kg

Measurements:

Chest
38 → 41"

Waist
32 → 31"

Strength:

Bench Press
60 → 80 kg

Progress photos:

Before
Current

Images must be private.

Use signed URLs.

Load images lazily.

==================================================
ATTENDANCE
==================================================

September

Present:
17

Absent:
6

Attendance:
74%

Simple calendar.

Do not load entire attendance history unnecessarily.

Fetch only relevant date ranges.

==================================================
PAYMENTS
==================================================

Show:

Membership

1 Aug → 31 Oct

Monthly fee:

₹1,500

September:

Paid

October:

Pending

If payment is enabled:

[Pay ₹1,500]

==================================================
RAZORPAY
==================================================

Payment integration must be secure.

Never trust the amount supplied by the member.

Server determines:

member
gym
membership
amount

Create Razorpay order on server.

Return only safe public order information to browser.

Never expose:

RAZORPAY_KEY_SECRET

Verify Razorpay payment signature server-side.

Use webhook verification.

Webhook processing must be idempotent.

Never mark a payment permanently successful just because frontend callback says success.

Payment record must be linked to:

gym_id
member_id
membership_id
razorpay_order_id
razorpay_payment_id

Prevent duplicate processing.

==================================================
TANSTACK QUERY
==================================================

Use TanStack Query for authenticated member data.

Queries:

['member-profile', gymId, memberId]

['member-workout', gymId, memberId]

['member-diet', gymId, memberId]

['member-progress', gymId, memberId]

['member-attendance', gymId, memberId, month]

['member-payments', gymId, memberId]

Use caching intelligently.

Workout templates/exercise metadata can have longer stale times.

Payments and membership status should have shorter stale times.

Do not continuously poll.

Use refetch after relevant mutations.

==================================================
PERFORMANCE
==================================================

The member application must be extremely fast on mobile.

Use:

- Server components where appropriate
- Client components only when interaction requires them
- TanStack Query for server-state caching
- Small API/database payloads
- Selective columns
- Pagination for historical data
- Lazy loading
- Optimized images
- HTTP compression
- Browser caching for safe static assets

Do not:

- Use Realtime unnecessarily
- Poll continuously
- Download all attendance history
- Download all progress photos
- Download unnecessary member information

==================================================
IMAGE STORAGE
==================================================

Progress photos should be optimized before upload.

Client:

Resize
Compress
Convert to WebP if appropriate

Set reasonable limits.

Use private Supabase Storage buckets.

Use signed URLs.

Never make member progress photos publicly accessible.

Do not store large original camera images.

==================================================
RLS SECURITY
==================================================

Member can:

SELECT their own profile
SELECT their own membership
SELECT their own attendance
SELECT their own payments
SELECT their own workouts
SELECT their own diet
SELECT their own progress

Member should not be able to:

Access another member
Change gym_id
Change member_id
Change payment status
Change membership status
Change assigned trainer
Modify trainer-created workout/diet plans unless explicitly designed
Access owner information
Access another member's progress photos

Use database RLS.

==================================================
UI
==================================================

Mobile-first.

Bottom navigation:

Home
Workout
PT
Progress
Profile

Secondary pages:

Diet
Attendance
Payments
Membership

Home must be extremely clean.

Prioritize:

Today's workout
Today's PT
Membership status
Progress

Do not create an enterprise dashboard.

==================================================
MEMBER PROFILE
==================================================

Show:

Profile photo
Name
Phone

Membership status
Membership expiry

Trainer

Member type:

Normal
PT

Allow member to update only safe personal fields.

==================================================
NOTIFICATIONS
==================================================

Do not build a realtime notification system.

Use simple application notifications where necessary.

Possible notifications:

Membership expiring
Payment pending
Workout updated
PT session scheduled

Avoid continuous polling.

==================================================
FREE TIER OPTIMIZATION
==================================================

This is designed for an individual gym.

Approximately:

100–200 members.

Avoid unnecessary infrastructure.

Do not use:

Supabase Realtime
WebSockets
Large media
Video storage
Continuous polling
Heavy analytics

Use:

PostgreSQL
Auth
Storage for optimized images
RLS
TanStack Query
Efficient queries
Indexes
Pagination
Caching

==================================================
DATABASE INDEXES
==================================================

Use relevant indexes:

attendance(gym_id, member_id, attendance_date)

payments(gym_id, member_id, status)

payments(gym_id, member_id, due_date)

progress_records(gym_id, member_id, recorded_at)

pt_sessions(gym_id, member_id, session_date)

workout_plans(gym_id, member_id, status)

Do not over-index.

==================================================
HTTP CACHING
==================================================

Static assets:

Long-lived cache where safe.

Authenticated member data:

Private caching only.

Do not publicly cache:

Payments
Membership
Attendance
Progress
Personal information

Use appropriate Cache-Control behavior.

Avoid large responses.

Use compressed payloads.

==================================================
FINAL DELIVERABLE
==================================================

Build only the Member application.

Screens:

Member Login
Home
Workout
Workout Detail
PT Sessions
Diet
Progress
Attendance
Payments
Membership
Profile
Settings

Create:

Mobile-first UI

Laptop/Desktop responsive UI

The member experience should feel like a modern fitness app, while remaining connected to the gym's management system.

The UI must be:

Simple
Fast
Clean
Professional
Easy to understand
Not cluttered

The primary question the application answers is:

"What do I need to do today?"