# Update Settings Page and Gmail Recovery Flow

This plan outlines the steps to allow users to edit their profile directly on the Settings page, add/remove a Gmail address, and use that Gmail address for password recovery.

## User Review Required

> [!IMPORTANT]
> **Database Schema Update Required**
> Since this application uses Supabase and I do not have direct access to your Supabase SQL Editor, please run the following command in your Supabase SQL Editor to add the `gmail` column to the `engineers` table:
> ```sql
> ALTER TABLE engineers ADD COLUMN IF NOT EXISTS gmail text;
> ```
> Please confirm once you have run this so I can proceed with the implementation.

## Proposed Changes

### 1. `app/dashboard/settings/page.tsx`
- Refactor the static profile fields into an editable form.
- Add an input for "Personal Gmail (for password recovery)".
- Add a "Save Changes" button that calls a new API route to update the profile.

### 2. `app/api/user/update-profile/route.ts` (New API Route)
- Create a new API route that accepts updates for `name`, `designation`, `mobile_number`, and `gmail`.
- It will update the `engineers` table.
- Crucially, if a `gmail` is provided, it will use the Supabase Admin client to update the user's Supabase Auth `email` to this `gmail` (and auto-confirm it). This ensures that Supabase's native "Forgot Password" functionality will send the reset link to their Gmail.
- If the `gmail` is removed, it will revert their Supabase Auth `email` back to their official `email`.

### 3. `app/login/page.tsx`
- Update the `lookupEmail` function. Currently, it only looks up the official `email` via `emp_id`.
- Modify it to return `gmail || email` from the `engineers` table. This ensures that when a user logs in or requests a password reset using their Employee ID, the system knows to route it to their Auth email (which will be their Gmail if they added one).

## Verification Plan
1. Ensure a user can edit their profile in the Settings page and it persists.
2. Ensure adding a Gmail updates both the `engineers` table and the Supabase Auth system.
3. Ensure logging in with `emp_id` still works even after the Auth email has been changed to a Gmail.
4. Ensure clicking "Forgot Password" and entering an `emp_id` successfully triggers the password reset to the registered Gmail.
