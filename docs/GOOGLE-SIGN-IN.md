# Turning on "Continue with Google"

About 5 minutes, once. You need a Google account; the free tier is enough. Nothing here goes in the repo.

## 1. Create the OAuth client

1. Open **console.cloud.google.com** → top bar → **Select a project** → **New project** → name it `Jobber` → **Create**, then select it.
2. Left menu → **APIs & Services** → **OAuth consent screen** (may be called **Google Auth Platform → Branding**):
   - App name `Jobber`, your email as support and developer contact → **Save**.
   - **Audience**: choose **External**. While the app is in **Testing**, only people you add under **Test users** can sign in with Google (up to 100), which suits an invite-only app. Add your own Gmail and each invited person's Gmail there. (Or click **Publish app**; the basic email/profile scopes need no Google review.)
   - Scopes: leave the defaults (`openid`, `email`, `profile`).
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**:
   - Application type: **Web application**, name `Jobber web`.
   - **Authorized JavaScript origins**: `https://jobber-ten-silk.vercel.app` and `http://localhost:3001` (add `http://localhost:3000` too if you use that port).
   - **Authorized redirect URIs**:
     - `https://jobber-ten-silk.vercel.app/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
     - (and `http://localhost:3000/api/auth/callback/google` if you use port 3000)
   - **Create**. Copy the **Client ID** and **Client secret**.

## 2. Add the keys

In `jobber/.env.local` (git-ignored), add two lines yourself. Don't paste them into chat:

```
GOOGLE_CLIENT_ID=the-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=the-client-secret
```

Then tell Claude "google keys added": they get copied to Vercel's hidden settings (production) and the site is redeployed. Locally, restart `npm run dev`.

## 3. How it behaves

- The sign-in page shows **Continue with Google**; an invite page shows **Continue with Google (their email)**.
- Google creates an account only for an email that has an open invite. Anyone else sees "That Google account has no invite."
- If you already have a password account, signing in with Google using the same email adds Google to it; both then work.
