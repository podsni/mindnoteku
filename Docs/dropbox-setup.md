# Dropbox Sync Setup

MindNote can back up and restore your notes to a Dropbox app folder. Notes
are stored as a single JSON file, `mindnote_backup.json`, in your app folder.
The integration uses OAuth 2.0 implicit flow with CSRF protection.

This is the only cloud sync option. Google Drive support has been removed
in the current build.

## Prerequisites

- A Dropbox account
- Permission to create apps at <https://www.dropbox.com/developers/apps>
- A MindNote deployment, either local (`pnpm dev`) or on Vercel

## 1. Create a Dropbox app

1. Open the [Dropbox App Console](https://www.dropbox.com/developers/apps).
2. Click **Create app**.
3. Choose:
   - **API**: Scoped access
   - **Access type**: App folder (recommended) or Full Dropbox
   - **Name**: `MindNote` or a name of your choice
4. Click **Create app**.

You'll be taken to the app's settings page. Keep it open — you need the
**App key** in the next step and you'll add the redirect URI afterwards.

## 2. Configure OAuth

On the app settings page, scroll to the **OAuth 2** section.

### Redirect URIs

Add one entry per environment you deploy to. The path must be exactly
`/dropbox-callback` (no trailing slash, no query string).

| Environment | URI |
| --- | --- |
| Local dev (Vite default) | `http://localhost:5173/dropbox-callback` |
| Local preview | `http://localhost:4173/dropbox-callback` |
| Vercel preview deployments | `https://*-<project-name>.vercel.app/dropbox-callback` |
| Production | `https://your-domain.example/dropbox-callback` |

### Permissions

Open the **Permissions** tab and enable:

- `files.content.write` — upload the backup file
- `files.content.read` — download the backup file
- `files.metadata.write` — overwrite existing backup
- `files.metadata.read` — check whether a backup exists

Click **Submit**.

## 3. Configure MindNote

The integration reads a single environment variable, `VITE_DROPBOX_APP_KEY`,
which is the **App key** from the Dropbox app settings page.

### Local development

Create `.env.local` at the repository root:

```bash
VITE_DROPBOX_APP_KEY=your_app_key_here
```

`.env.local` is already in `.gitignore`. Never commit it.

Restart the dev server after editing the file:

```bash
pnpm dev
```

### Vercel

```bash
vercel env add VITE_DROPBOX_APP_KEY production
# paste the key, repeat for preview and development
```

`pnpm run build` is the only command that needs the variable, so adding it
to **Production** is enough for most setups. Add it to **Preview** if you
want Dropbox sync to work on branch deployments.

Variables prefixed with `VITE_` are bundled into the client JavaScript at
build time. Treat the app key as semi-public: it identifies your app, not
your user. Never put user secrets in `VITE_*` variables.

## 4. Verify

1. Open MindNote.
2. Open **Settings** (gear icon).
3. Scroll to **Dropbox Sync**.
4. Click **Sign in with Dropbox**. A popup opens.
5. Approve the permission request. The popup closes automatically.
6. Your Dropbox email appears in the settings panel.
7. Create a note, then click **Backup to Dropbox**.
8. Open your Dropbox app folder and confirm `mindnote_backup.json` exists.
9. Delete the local note and click **Restore from Dropbox**. The note
   returns.

If the popup doesn't open, allow popups for the MindNote origin and try
again.

## How the flow works

```
Browser                          MindNote                       Dropbox
   |                                  |                            |
   |-- click "Sign in" -------------->|                            |
   |                                  |-- open popup ------------->|
   |                                  |   (OAuth authorize URL)    |
   |<- popup with consent screen -----|                            |
   |--- user grants permission ------>|                            |
   |                                  |<-- redirect with token ----|
   |<-- postMessage to opener --------|                            |
   |                                  |-- save to localStorage     |
```

The token never reaches a server. MindNote stores it in `localStorage`
under the key `mindnote_dropbox_auth` and uses it for the
`/2/files/upload` and `/2/files/download` endpoints. Tokens are
long-lived; use **Sign out** to revoke them via `/2/auth/token/revoke`.

## Backup file format

```json
{
  "version": "1.0",
  "timestamp": "2026-06-16T12:00:00.000Z",
  "notes": [
    {
      "id": "uuid-v4",
      "title": "Note title",
      "content": "Markdown body",
      "pinned": false,
      "createdAt": "2026-06-16T10:30:00.000Z",
      "updatedAt": "2026-06-16T11:45:00.000Z"
    }
  ]
}
```

The current schema is `version: "1.0"`. The backup overwrites the
previous file on each upload — there is no history.

## Security

- **CSRF protection**: the OAuth flow uses a random `state` parameter
  stored in `sessionStorage`. The callback rejects mismatched states.
- **Limited scope**: with App folder access, the app can only touch
  files in `/Apps/MindNote/`. The backup file is the only file MindNote
  reads or writes.
- **Token storage**: the access token is in `localStorage`, which is
  readable by any script on the same origin. Sign out when using a
  shared device.
- **Revoke**: clicking **Sign out** calls
  `https://api.dropboxapi.com/2/auth/token/revoke` to invalidate the
  token server-side.

## Troubleshooting

### "Dropbox App Key not configured"

`VITE_DROPBOX_APP_KEY` is empty in the build. Confirm `.env.local`
exists, the variable name is exact, and you restarted the dev server
after editing it. For Vercel, redeploy after adding the variable.

### "redirect_uri_mismatch"

The redirect URI in the OAuth request is not in the app's allow list.
Check the **OAuth 2 → Redirect URIs** section of your Dropbox app and
add the exact origin. Trailing slashes and case matter.

### Popup is blocked

Allow popups for the MindNote origin. In Chrome, click the popup
icon in the address bar and choose **Always allow**.

### "No backup found" on restore

The file `mindnote_backup.json` does not exist in the app folder.
Upload once with **Backup to Dropbox** before restoring.

### Stale token after revoking from the Dropbox dashboard

If you revoked access outside the app, sign in again. Old tokens
return `401` from the API and MindNote clears the stored entry on the
next failed request.

### "Failed to sign in" on a deployed domain

Confirm two things:

1. The production domain is listed in **Redirect URIs** of the Dropbox
   app.
2. `VITE_DROPBOX_APP_KEY` is set for the environment you're deploying
   to (Production vs Preview).

If you added the domain to Dropbox **after** the user data was
authorised, the user has to sign out and sign in again to refresh the
grant.

## API reference

The service is exposed as `dropboxService` in `src/lib/dropbox.ts`.

| Method | Description |
| --- | --- |
| `signIn()` | Opens the OAuth popup. Resolves on success via `postMessage`. |
| `reconnect()` | Re-validates a stored token. Returns `true` if still valid. |
| `signOut()` | Revokes the token and clears `localStorage`. |
| `backupToDropbox(notes)` | Uploads the backup file. Overwrites existing. |
| `restoreFromDropbox()` | Downloads and parses the backup file. Throws `No backup found` on `409`. |
| `hasBackupFile()` | Returns `true` if the backup exists. |
| `getBackupMetadata()` | Returns Dropbox metadata for the backup file. |

### State accessors

| Property | Type | Description |
| --- | --- | --- |
| `isSignedIn` | `boolean` | True if a stored token validated. |
| `userEmail` | `string \| null` | Email of the signed-in user. |
| `hasAppKey` | `boolean` | True if `VITE_DROPBOX_APP_KEY` is non-empty. |
