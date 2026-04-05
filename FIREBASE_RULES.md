# Firebase Realtime Database Rules

## Current Issue
If the "END ROUND & CLEAR ALL" button shows logs but doesn't delete, the issue is likely **Firebase Security Rules**.

## Required Rules for Full Access

For development/testing, use these permissive rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    ".indexOn": [".key"]
  }
}
```

## For Production (Recommended)

Use authenticated access:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    ".indexOn": [".key"]
  }
}
```

## How to Update Firebase Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tuber-tools-266cb**
3. Navigate to **Realtime Database** → **Rules** tab
4. Replace the rules with the above JSON
5. Click **Publish**

## Paths Being Used

The app uses these database paths:
- `vtubers` - VTuber list
- `userSelections` - User selections (can be deleted)
- `vtuberSelections` - Old selection format (optional)

## Testing Delete

If delete still fails, check the console logs for:
- `"PERMISSION_DENIED"` - Rules issue
- `"AUTH_REQUIRED"` - Authentication missing
- Other Firebase error codes

The app now logs detailed information:
```
Starting delete all user selections...
Current data exists: true
Data found, attempting to delete...
Delete successful
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| PERMISSION_DENIED | Rules too restrictive | Update rules to allow `.write` |
| AUTH_REQUIRED | Anonymous auth disabled | Allow anonymous in Firebase Auth |
| Network error | Connection issue | Check internet connection |

## Quick Debug Checklist

- [ ] Firebase console accessible
- [ ] Rules tab shows JSON with `.write: true`
- [ ] Console shows detailed delete logs
- [ ] Check browser DevTools Console for errors
- [ ] Try refresh after rule update (rules take ~1 min)
