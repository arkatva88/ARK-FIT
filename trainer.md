Build the TRAINER application for ARK FIT.

IMPORTANT:

This prompt is ONLY for the TRAINER role.

Do NOT build the Owner application.

Do NOT build the Member application.

The trainer uses ARK FIT mainly during gym operations to manage assigned members, PT sessions, workouts, diets and progress.

The application must be extremely fast and simple because trainers may use it from a phone while moving around the gym.

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
- PostgreSQL
- Auth
- Storage
- RLS

TanStack Query:
- Server-state caching
- Query deduplication
- Background refetch
- Mutations
- Optimistic updates where safe

Payments:
- Razorpay integration exists at system level but trainers must NOT control financial operations.

==================================================
AUTH
==================================================

Trainer accounts are created by the gym owner.

The owner provides temporary login credentials.

Trainer logs in.

On first login:

Force password change.

Use Supabase Auth.

Never store passwords in application tables.

Never expose passwords.

Never store auth tokens in localStorage.

Trainer must only access:

- Their own trainer profile
- Members assigned to them
- Training-related information for assigned members

Enforce this using Supabase RLS.

Do NOT rely on frontend filtering for security.

==================================================
RLS
==================================================

Trainer must not be able to access another gym.

Trainer must not automatically access another trainer's members.

Every relevant query must be constrained through:

authenticated user
gym_id
trainer assignment

Use database RLS policies.

==================================================
TRAINER DASHBOARD
==================================================

The dashboard should answer:

"Who do I need to train today?"

Show:

Today's PT sessions

My Members

Today's attendance

Progress reviews due

Members requiring attention

Example:

TODAY

06:00
Rahul
PT Session 8/12

07:00
Akash
PT Session 4/10

18:00
Priya
PT Session 5/8

Then:

ATTENTION

Rahul inactive for 8 days

Priya progress review due

Akash has 1 PT session remaining

Do not show financial information.

==================================================
MY MEMBERS
==================================================

Search.

Filters:

All
PT
Normal
Inactive
Progress Due

Member card:

Rahul Kumar

PT
Goal: Muscle Gain

Attendance: 82%

PT: 7/12

[Open]

Use pagination.

Do not load every member record with all related information.

==================================================
MEMBER PROFILE
==================================================

Trainer profile view:

Rahul Kumar
PT
Goal: Muscle Gain

Show:

Today's workout
Current workout plan
Diet
Attendance
PT sessions
Progress
Notes

Actions:

Update Workout
Update Diet
Add Progress
Complete PT Session
Add Note

Do not expose gym-wide payment information.

==================================================
PT MANAGEMENT
==================================================

Today's PT Sessions.

Each session:

Member
Time
Session number
Workout
Status

Actions:

Start
Completed
Missed
Reschedule

Prevent duplicate session completion.

Use database constraints and server-side validation.

==================================================
WORKOUT MANAGEMENT
==================================================

Create:

Exercise Library

Categories:

Chest
Back
Shoulders
Biceps
Triceps
Legs
Core
Cardio

Exercise:

Name
Sets
Reps
Rest
Instructions
Video URL

Do NOT store video files in Supabase Storage.

Store external video URLs where needed.

Workout Templates:

Push
Pull
Legs
Full Body
Beginner
Fat Loss
Muscle Gain

Workout Builder:

Exercise
Sets
Reps
Rest
Notes

Allow:

Save Template
Assign to Member

==================================================
DIET
==================================================

Simple trainer-created diet.

Member:

Rahul

Goal:

Muscle Gain

Calories:

2600 kcal

Protein:

140g

Meals:

Breakfast
Lunch
Snack
Dinner

Do not create a massive food database.

This is a gym trainer's diet management feature.

==================================================
PROGRESS
==================================================

Track:

Weight
Body measurements
Strength
Progress photos

Show:

Previous
Current
Goal

Use simple charts.

Progress photos must be private.

Compress images before upload.

Use Supabase Storage private buckets.

Use signed URLs.

Do not store large original images.

==================================================
MEMBER NOTES
==================================================

DO NOT BUILD CHAT.

Create structured notes.

Example:

Rahul Kumar

Issue:
Shoulder discomfort during lateral raises.

Status:
Open

Date:
16 Sep 2026

Actions:

Resolve
Add Note

Keep notes private to authorized trainer/owner/member as appropriate.

==================================================
TANSTACK QUERY
==================================================

Use TanStack Query for:

trainer dashboard
members
member profile
PT sessions
workouts
diet
progress

Use stable query keys.

Example:

['trainer-members', gymId, trainerId, filters]

['pt-sessions', gymId, trainerId, date]

['member', gymId, memberId]

['workout', gymId, memberId]

Cache relatively stable data such as exercise libraries and templates longer.

Use shorter stale times for attendance and today's sessions.

Do not constantly poll.

==================================================
PERFORMANCE
==================================================

Optimize for mobile network conditions.

Use:

- Pagination
- Selective fields
- Database indexes
- TanStack Query caching
- Query deduplication
- Lazy loading
- Optimized images
- Small payloads
- HTTP compression
- No unnecessary Realtime

Avoid:

SELECT *

N+1 queries

Large responses

Huge images

Unnecessary polling

Realtime chat

Video uploads to Supabase

==================================================
DATABASE INDEXING
==================================================

Use relevant indexes such as:

members(gym_id, trainer_id, status)

attendance(gym_id, member_id, attendance_date)

pt_sessions(gym_id, trainer_id, session_date)

pt_sessions(gym_id, member_id, session_date)

progress_records(gym_id, member_id, recorded_at)

Do not over-index.

==================================================
IMAGE OPTIMIZATION
==================================================

Client-side:

Resize
Compress
Convert to WebP where appropriate

Set maximum file size.

Store optimized images.

Use signed URLs.

Lazy-load progress photos.

Do not load all progress photos immediately.

==================================================
UI
==================================================

Trainer desktop:

Sidebar:

Today
My Members
PT Sessions
Workouts
Diet
Progress

Trainer mobile:

Today
Members
PT
Workout
More

Mobile must prioritize today's sessions.

Use large touch targets.

Keep actions close to the relevant member.

Avoid complicated forms.

==================================================
FINAL DELIVERABLE
==================================================

Build only the Trainer application.

Screens:

Trainer Login
Trainer Dashboard
My Members
Member Profile
PT Sessions
Workout Library
Workout Builder
Diet Management
Progress
Member Notes
Trainer Profile/Settings

Desktop and mobile responsive.

Make it fast enough to use while standing inside a busy gym.

The interface must be simple enough that a trainer understands it immediately.