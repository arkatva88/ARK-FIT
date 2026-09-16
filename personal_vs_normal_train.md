ARK FIT --- Personal Training vs Normal Member

Purpose

ARK FIT supports two member types:

Normal Member

Personal Training (PT) Member

A PT member should not be treated as a completely different user
account. PT is an additional training layer attached to the member's
regular gym membership.

1. Core Difference

Area                    Normal Member              Personal Training
Member

Gym Membership          Yes                        Yes

Gym Attendance          Yes                        Yes

Workout Plan            Trainer-assigned/general   Personalized PT workout
plan                       plan

Diet Plan               Optional trainer-assigned  Personalized diet plan
diet

Assigned Trainer        Optional / General Trainer Dedicated PT Trainer

PT Package              No                         Yes

PT Sessions             No                         Yes

Session Counter         No                         Yes

Upcoming PT Sessions    No                         Yes

PT Session History      No                         Yes

Session-specific Notes  No                         Yes

Session-specific        No                         Yes
Workout

Progress Tracking       Yes                        Yes, more detailed

Progress Photos         Optional                   Recommended

Measurements            Optional                   Recommended

Strength Tracking       Optional                   Recommended

Trainer Follow-up       General                    Dedicated

PT Package Expiry       No                         Yes

2. Normal Member

Purpose

A normal member mainly uses ARK FIT to manage their regular gym
activity.

Member Home

Show:

Today's workout

Membership status

Membership expiry

Attendance percentage

Current weight

Latest progress

Diet plan, if assigned

Workout

Normal member can view:

Assigned workout

Exercises

Sets

Reps

Rest time

Exercise instructions

Optional exercise video

Example:

Today's Workout

Chest + Triceps

Bench Press
4 × 10

Incline Dumbbell Press
3 × 12

Cable Fly
3 × 15

Attendance

Normal member can view:

Monthly attendance

Attendance percentage

Attendance history

Simple calendar

Diet

If the trainer/owner assigns a diet:

Breakfast

Lunch

Snack

Dinner

Calories

Protein target

Progress

Normal member can track:

Weight

Basic measurements

Progress photos

Strength records

Payments

Normal member can:

View membership fees

View payment history

See pending payments

Pay through Razorpay when enabled

Membership

Show:

Plan name

Start date

Expiry date

Status

Renewal/payment information

3. Personal Training Member

A PT member gets everything available to a normal member plus dedicated
PT functionality.

PT Member Home

In addition to normal member information, show:

Today's PT Session

06:00 AM
Trainer: Arjun

Session 8 / 12

[View Session]

Also show:

PT PACKAGE

12 Sessions
8 Completed
4 Remaining

Expires:
30 Sep 2026

4. Dedicated PT Trainer

A PT member has a specific assigned trainer.

Display:

Trainer

Arjun Singh

PT Trainer

The member should be able to see the trainer associated with their PT
package.

The trainer sees only members assigned to them unless the owner grants
broader access.

5. PT Package

PT members have a package.

Example:

PT PACKAGE

Package:
12 Sessions

Price:
₹6,000

Used:
8

Remaining:
4

Start:
01 Sep 2026

Expiry:
30 Sep 2026

Status:
Active

The system must maintain the session count server-side.

Do not trust session counts submitted by the frontend.

6. PT Session Management

Each PT session is a separate record.

Example:

SESSION #8

Member:
Rahul Kumar

Trainer:
Arjun Singh

Date:
16 Sep 2026

Time:
06:00 AM

Status:
Completed

Possible statuses:

Scheduled

Completed

Missed

Cancelled

Rescheduled

7. PT Session History

PT members should see their complete PT session history.

Example:

PT SESSION HISTORY

#1  Completed
#2  Completed
#3  Missed
#4  Completed
#5  Completed
#6  Completed
#7  Completed
#8  Completed

The member can understand how many sessions have been used.

8. Session-Specific Workout

This is one of the major differences.

A PT trainer can prepare a workout specifically for a PT session.

Example:

SESSION #8

Chest + Triceps

Bench Press
4 × 10
80 kg

Incline DB Press
3 × 12
24 kg

Cable Fly
3 × 15

Tricep Pushdown
3 × 12

The trainer can update exercises, sets, reps and notes for the session.

9. PT Session Notes

After a PT session, the trainer can record structured notes.

Example:

SESSION NOTES

Energy:
Good

Bench Press:
80 kg × 10

Form:
Improved

Observation:
Good control during pressing movements.

Next Session:
Increase load slightly if form remains stable.

Avoid building a full chat system for this.

Structured notes are more useful for gym operations.

10. Personalized Diet

PT members can receive a more personalized diet plan.

Example:

GOAL

Muscle Gain

Daily Calories:
2600 kcal

Protein:
140g

MEALS

Breakfast
Lunch
Snack
Dinner

The trainer can update the diet based on the member's progress.

11. Detailed Progress Tracking

PT members should have more detailed progress tracking.

Track:

Body

Weight

Chest

Waist

Arms

Thighs

Other gym-specific measurements

Strength

Bench Press

Squat

Deadlift

Other exercises

Photos

Front

Side

Back

Example:

PROGRESS

Weight
72 kg → 76 kg

Chest
38" → 41"

Waist
32" → 31"

Bench Press
60 kg → 80 kg

Progress photos should be private and protected using Supabase Storage +
signed URLs.

12. PT Alerts

PT members should receive relevant alerts such as:

Your PT package has 2 sessions remaining.

Your PT package expires in 5 days.

Your next PT session is tomorrow at 6:00 AM.

Your trainer updated your workout.

The system should not require realtime infrastructure for these basic
notifications.

13. Owner-Side PT Management

The gym owner gets additional PT management capabilities.

PT Dashboard

Show:

PT OVERVIEW

Active PT Members
24

Sessions Today
8

Sessions Completed
5

Sessions Remaining
47

Action Required

3 members have 2 or fewer sessions remaining

2 PT packages expire within 7 days

1 PT session was missed

4 members need progress review

Clicking an alert should open a pre-filtered PT list.

14. Trainer-Side PT Management

Trainer sees:

TODAY'S PT

06:00 AM
Rahul Kumar
Session 8/12

07:00 AM
Akash Shetty
Session 4/10

18:00 PM
Priya Sharma
Session 11/12

Trainer actions:

Open member

Start session

View workout

Update workout

Add session notes

Complete session

Mark missed

Reschedule

Update progress

Update diet

Trainer should not manage gym-wide financial information.

15. Normal vs PT Navigation

Normal Member

Home
Workout
Progress
Attendance
Profile

Secondary:

Diet
Payments
Membership

PT Member

Home
Workout
PT
Progress
Profile

Secondary:

Diet
Attendance
Payments
Membership

The PT tab should only appear for PT members.

This keeps the normal member interface simple.

16. Conditional UI

Do not create separate application codebases for normal and PT members.

Use member type to conditionally display PT functionality.

Conceptually:

member.member_type === "PT"

If PT:

Show:
- PT Package
- PT Sessions
- Assigned PT Trainer
- Session History
- Session Notes

If Normal:

Hide:
- PT Package
- PT Sessions
- PT Session History
- PT-specific UI

This keeps ARK FIT maintainable.

17. Database Model

Recommended relationship:

Member
  │
  ├── Membership
  ├── Attendance
  ├── Payments
  ├── Workout Plan
  ├── Diet Plan
  ├── Progress
  │
  └── PT Package (only for PT members)
          │
          └── PT Sessions
                  │
                  ├── Trainer
                  ├── Workout
                  └── Session Notes

A PT member is therefore:

Normal Gym Membership
        +
Dedicated PT Layer

rather than a completely separate member system.

18. Business Rules

Normal Member

Can have a regular gym membership.

Can be assigned a workout.

Can receive a diet plan.

Can track attendance.

Can track progress.

Can make membership payments.

Does not consume PT sessions.

PT Member

Must have an assigned PT trainer.

Has a PT package.

Has a purchased session count.

Has used/remaining sessions.

Has PT session records.

Can have session-specific workouts.

Can have session-specific notes.

Can have detailed progress tracking.

Can receive PT-specific alerts.

19. Important Security Rules

PT information is sensitive gym data.

Use Supabase Row Level Security.

Member

A member can access only their own:

PT package

PT sessions

Workout

Diet

Progress

Attendance

Payments

Trainer

A trainer can access PT information only for members assigned to them,
subject to gym-level authorization.

Owner

The owner can access PT information belonging to their gym.

Never rely only on frontend role checks.

Enforce authorization at the database/API level.

20. Performance Considerations

For a gym with approximately 100--200 members:

Do not use realtime PT infrastructure.

Do not use WebSockets.

Do not continuously poll PT sessions.

Use:

PostgreSQL indexes

Pagination

Selective queries

TanStack Query caching

Query deduplication

Optimized payloads

Lazy loading

Optimized images

Recommended PT indexes:

pt_packages(gym_id, member_id)

pt_packages(gym_id, trainer_id)

pt_packages(gym_id, status)

pt_sessions(gym_id, trainer_id, session_date)

pt_sessions(gym_id, member_id, session_date)

pt_sessions(gym_id, status)

Avoid over-indexing.

21. Final Product Difference

The simplest way to define ARK FIT is:

Normal Member

"Manage my gym membership and workouts."

Features:

Workout

Diet

Attendance

Progress

Membership

Payments

PT Member

"Manage my gym membership + receive dedicated personal training."

Everything in Normal Member, plus:

Dedicated trainer

PT package

PT session count

Upcoming PT sessions

PT session history

Session-specific workouts

Session notes

Detailed progress tracking

Personalized diet

PT alerts

22. Recommended Product Philosophy

Do not make the PT experience unnecessarily complicated.

The PT workflow should be:

PT Package
     ↓
Assign Trainer
     ↓
Schedule Session
     ↓
Trainer Conducts Session
     ↓
Update Workout / Notes
     ↓
Complete Session
     ↓
Remaining Sessions - 1
     ↓
Track Progress

That is the core PT workflow ARK FIT should optimize for.

The goal is not to build a complicated personal-training CRM.

The goal is to make the gym owner's PT management, trainer's daily
workflow, and member's PT experience simple and manageable.