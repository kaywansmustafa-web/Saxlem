# Saxlem Product Requirements Document

## 1. Product Name

Saxlem

Kurdish name:

ساخلەم

## 2. Product Vision

Saxlem is a healthcare discovery, appointment, queue management, and clinic operations platform designed for Duhok.

It should reduce:

- crowded waiting rooms
- repeated phone calls
- appointment confusion
- paper-based scheduling
- no-shows
- empty appointment slots
- patient frustration
- secretary workload

Saxlem should help:

- patients find and book healthcare easily
- doctors organize their clinics
- secretaries manage appointments and queues
- clinics increase revenue
- Saxlem earn revenue per completed patient

## 3. Business Model

Saxlem charges:

1,250 IQD per completed patient.

The fee applies only when a patient completes a qualifying appointment.

Follow-up appointments, clinic-created visits, walk-ins, and special appointment types may have different billing rules defined later.

## 4. Primary Users

### Patient

The patient can:

- choose a language
- verify a phone number
- search doctors
- filter doctors
- view clinic details
- view pricing
- book appointments
- cancel or reschedule appointments
- view live queue status
- receive reminders
- manage family members
- check in
- view previous and upcoming appointments

### Secretary

The secretary can:

- manage the daily schedule
- add walk-ins
- schedule follow-ups
- check patients in
- manage the live queue
- mark appointment statuses
- notify delayed patients
- manage doctor availability
- move appointments
- fill cancelled slots
- search patients
- view visit history

### Doctor

The doctor can:

- view the daily schedule
- view appointment reasons
- view patient arrival status
- request follow-ups
- see clinic performance
- view waiting-time analytics
- view revenue and patient trends
- manage availability

### Platform Admin

The admin can:

- verify doctors
- verify clinics
- manage specialties
- manage clinic accounts
- manage billing
- review disputes
- view platform analytics
- manage sponsored listings
- review audit logs
- suspend abusive users

## 5. Product Principles

Saxlem must be:

- modern
- minimal
- premium
- fast
- easy to understand
- excellent in Badini Kurdish
- usable by older users
- usable on weak internet
- secure
- auditable
- scalable
- accessible

## 6. Design Principles

- one primary action per screen
- large touch targets
- consistent spacing
- clear typography
- minimal visual clutter
- smooth but subtle animation
- strong contrast
- clear empty states
- clear error states
- skeleton loading
- no unnecessary forms
- phone-number-first authentication
- full right-to-left support
- consistent colors, cards, buttons, and icons

## 7. Languages

Saxlem will support:

- Badini Kurdish in Arabic script
- Badini Kurdish in Latin script
- English
- Arabic

The first launch priority is:

1. Badini Kurdish
2. English
3. Arabic
4. Badini Latin

All user-facing text must come from localization files.

No important text should be hardcoded inside screens.

## 8. Core Product Modules

### Patient Mobile App

- onboarding
- authentication
- home
- doctor discovery
- search and filters
- doctor profile
- booking
- appointment management
- live queue
- notifications
- family profiles
- patient profile

### Clinic Web Dashboard

- daily schedule
- calendar
- walk-ins
- follow-ups
- queue management
- patient search
- doctor availability
- waitlist
- delay management
- basic analytics
- billing summary
- audit history

### Admin Web Dashboard

- doctor verification
- clinic verification
- specialty management
- account management
- billing management
- platform analytics
- abuse prevention
- audit logs

### Backend Platform

- authentication
- users and roles
- clinics
- doctors
- schedules
- appointments
- queues
- notifications
- billing
- analytics
- audit logs
- security controls

## 9. Launch Scope

The first sellable version must include:

- patient phone login
- doctor search
- doctor profiles
- appointment booking
- appointment cancellation
- secretary dashboard
- walk-ins
- follow-ups
- live queue
- patient check-in
- delay updates
- appointment reminders
- doctor schedule management
- appointment statuses
- basic clinic analytics
- platform billing records

## 10. Future Modules

These will be added after the first sellable version:

- automated waitlist filling
- no-show reliability scoring
- family accounts
- multi-doctor clinics
- multi-location doctors
- detailed audit history
- offline clinic mode
- QR check-in
- lab and imaging marketplace
- digital prescriptions
- medical notes
- AI receptionist
- AI specialty guidance
- demand heatmaps
- advanced clinic analytics
- payment collection
- pharmacy integrations

## 11. Success Metrics

Saxlem should measure:

- completed appointments
- patients acquired
- no-show rate
- cancellation rate
- appointments recovered from waitlists
- average waiting time
- number of active clinics
- number of active doctors
- revenue per clinic
- revenue per completed patient
- patient retention
- clinic retention
- secretary daily usage
- appointment completion accuracy

## 12. Non-Negotiable Requirements

- no double-booking
- no unauthorized access to clinic data
- no silent edits
- all important changes must be audited
- medical data must be protected
- sponsored placement must be clearly labeled
- emergency guidance must never be influenced by advertising
- billing must use a clear definition of completed appointment
- clinic staff permissions must be role-based
- every appointment must have a defined status