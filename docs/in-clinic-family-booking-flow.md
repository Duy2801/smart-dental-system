# In-Clinic Family Booking Flow

This document defines the in-clinic booking flow for users who book for themselves or for family members.

## Goal

Support real clinic behavior where one account can manage several patient profiles, while one doctor can only treat one patient in a time range.

## Core Rules

- User is the logged-in account or staff account creating the booking.
- Patient is the person receiving dental care.
- Appointment always points to Patient through patientId.
- Appointment records who created it through createdBy.
- A User can manage many Patients.
- A Patient can be managed by many Users.
- A Doctor can have only one active Appointment in an overlapping time range.
- A Patient cannot have two active Appointments in overlapping time ranges.
- A User can create multiple Appointments at the same time if they are for different Patients and different available Doctors.
- In-clinic booking uses Pay At Counter only.

## Patient App Flow

```text
User signs in
   |
   v
Open booking
   |
   v
Choose patient
   |
   v
Choose service
   |
   v
Choose doctor, date, and available time
   |
   v
Confirm booking details
   |
   v
Create appointment
```

## Choose Patient

The first booking step is selecting the person who will receive care.

```text
Choose patient

* Nguyen Duc Duy - Self
  Nguyen Minh C - Child
  Nguyen Van A - Father
  Nguyen Thi B - Mother

+ Add patient
```

If the selected Patient already exists, the system reuses that Patient profile. It must not create a duplicate Patient.

If the Patient does not exist, the User adds a Patient profile first:

```text
Add patient
   |
   v
Enter patient information
   |
   v
Create Patient
   |
   v
Create PatientAccount link
   |
   v
Continue booking
```

Example:

```text
User U001: Nguyen Duc Duy
Patient P001: Nguyen Duc Duy, relationship SELF
Patient P002: Nguyen Minh C, relationship CHILD
```

## Choose Service

After the Patient is known, the User chooses the dental Service or Treatment Method.

The selected Service can affect price, duration, and which Doctors are suitable. It must not be used as the owner of the appointment. Ownership remains with Patient.

## Choose Doctor And Time

The system shows only Doctors and times that are bookable.

Backend availability checks:

```text
Clinic is open for the requested time range
   |
   v
Doctor works during the requested time range
   |
   v
Doctor does not have an active overlapping appointment
   |
   v
Patient does not have an active overlapping appointment
   |
   v
User has permission to book for this Patient
```

Slot locking is based on:

```text
doctorId + scheduledAt/endAt overlap
```

It is not based on:

```text
createdBy + scheduledAt
```

## Valid Same-Time Family Booking

```text
User Duy books:

Appointment 1
Patient: Duy
Doctor: Doctor A
Time: 18:00 - 19:00

Appointment 2
Patient: Child
Doctor: Doctor B
Time: 18:00 - 19:00
```

This is valid because each Doctor has only one Patient and each Patient has only one Appointment in that time range.

## Invalid Same-Doctor Booking

```text
Appointment 1
Patient: Duy
Doctor: Doctor A
Time: 18:00 - 19:00

Appointment 2
Patient: Child
Doctor: Doctor A
Time: 18:00 - 19:00
```

This is invalid because Doctor A would have two Patients at the same time.

## Invalid Same-Patient Booking

```text
Appointment 1
Patient: Duy
Doctor: Doctor A
Time: 18:00 - 19:00

Appointment 2
Patient: Duy
Doctor: Doctor B
Time: 18:30 - 19:30
```

This is invalid because the same Patient would have overlapping Appointments.

## Appointment Creation Contract

The frontend sends:

```text
patientId
doctorId
serviceId or treatmentMethodId
scheduledAt
paymentMethod = PAY_AT_COUNTER
```

The backend derives or validates:

```text
createdBy = current authenticated user id
endAt = scheduledAt + service duration
status = CONFIRMED
paymentStatus = PAY_AT_COUNTER_SELECTED
```

The backend must not trust patientId blindly. It must verify that the current User can book for the selected Patient through PatientAccount.

## Receptionist Flow

Receptionists can create appointments without signing in as the Patient.

```text
Receptionist signs in
   |
   v
Search by phone, name, or patient code
   |
   v
Find User and/or Patient profiles
   |
   v
Choose the Patient receiving care
   |
   v
Choose service
   |
   v
Choose doctor and available time
   |
   v
Create appointment
```

For receptionist-created bookings:

```text
patientId = selected Patient
createdBy = receptionist User id
```

If the Patient should be managed by a customer User, receptionist can create or update a PatientAccount link.

## Data Model Direction

Add a PatientAccount relation:

```text
PatientAccount
+-- userId
+-- patientId
+-- relationship
+-- isPrimary
+-- canBook
```

Recommended relationship values:

```text
SELF
CHILD
FATHER
MOTHER
OTHER
```

Recommended uniqueness rules:

- One User should have at most one SELF Patient.
- The same userId and patientId pair should not be duplicated.
- A Patient can be linked to multiple Users.

## Migration Direction

Existing Patient records that are currently linked directly to a User should be migrated into PatientAccount:

```text
userId = existing Patient.userId
patientId = existing Patient.id
relationship = SELF
isPrimary = true
canBook = true
```

The old direct Patient-to-User relationship can be kept temporarily during migration, but the new booking flow should use PatientAccount as the source of truth for patient selection and booking permission.

## UI Changes

- Add a first booking step: Choose Patient.
- Add Add Patient action for family members.
- Show the selected Patient throughout the booking flow.
- On confirmation, show both Patient and Appointment Creator when useful.
- In My Appointments, show appointments for all Patients the User can manage.
- Display the Patient name on each appointment card.
- When a time is selected, show only Doctors available for that time range.
- Do not hide the entire time only because one Doctor is busy.

## Backend Changes

- Add PatientAccount model and migration.
- Add API to list Patients managed by the current User.
- Add API to create a Patient and link it to the current User.
- Accept patientId when creating an Appointment from the patient app.
- Validate that the current User can book for patientId.
- Remove conflict logic based on createdBy plus time.
- Keep conflict logic based on Doctor overlapping time.
- Add conflict logic based on Patient overlapping time.
- Wrap appointment validation and creation in a transaction to reduce double-booking risk.
