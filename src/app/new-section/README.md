# New Section Confirmation Page

This page allows organization admins to confirm or decline new sections that have been made available to their organization.

## URL Format

```
/new-section?sectionId={SECTION_ID}&organizationId={ORGANIZATION_ID}
```

### Parameters

- `sectionId` - The ID of the initial_section document
- `organizationId` - The ID of the organization

### Example URL

```
/new-section?sectionId=test-asdasd&organizationId=67489e3f00054e4d5c5e
```

## Features

### Security
- User must be logged in
- User must belong to the specified organization (or be admin)
- Validates that both section and organization exist

### UI States

1. **Confirmation Screen** (default)
   - **Header Card:**
     - Section title (large, prominent)
     - Section description (aliosiot)
     - Organization name in blue badge
     - Section statistics (order, subsections count, organizations using it)
     - Info banner with warning about accepting
     - Two action buttons: "Hylkää" (Decline) and "Hyväksy ja ota käyttöön" (Accept)
   - **Subsections Preview Card:**
     - Tab navigation for all subsections
     - Each tab shows:
       - Subsection title and description
       - Slug and order
       - Preview note indicating all subsections will be enabled
     - Horizontal scrollable tabs for many subsections
     - Active tab highlighted in amber

2. **Already Has Access**
   - Shows info message if organization already has access to the section
   - Button to return to main page

3. **Accepted State**
   - Green success screen
   - Auto-redirects to /messuopas after 2 seconds

4. **Declined State**
   - Gray info screen
   - Auto-redirects to /messuopas after 2 seconds

5. **Error States**
   - Missing parameters
   - No access rights
   - Section not found
   - Organization not found

### Actions

**Confirm (Hyväksy)**
- Adds organization ID to section's `appliedOrganizations` array
- Updates the database
- Shows success message
- Redirects to main page

**Decline (Hylkää)**
- Does not modify database
- Shows info message
- Redirects to main page

## Integration with Email System

This page is designed to be linked from emails sent to organization admins when a new section is available.

Example email link:
```html
<a href="https://yourdomain.com/new-section?sectionId=test-asdasd&organizationId=67489e3f00054e4d5c5e">
  Tarkastele uutta osiota
</a>
```

## Database Structure

### initial_sections
- `title` (string) - Section title
- `aliosiot` (string) - Subsection description
- `order` (integer) - Display order
- `initialSubsections` (relationship) - Related subsections
- `appliedOrganizations` (relationship) - Organizations with access

## Server Actions

### confirmSection(sectionId, organizationId)
- Located in `./actions.js`
- Server-side function to update section's appliedOrganizations
- Returns `{ success: boolean, error?: string }`
