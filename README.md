# little by little. — 30-Day Journal

A responsive static front-end for GitHub Pages, with a pastel pop palette, a tiny animated ginger-cat mascot, morning/evening journal prompts, a 30-day calendar, local auto-save, and a Firebase Google sign-in / Firestore integration scaffold.

## Quick preview

Because this project uses JavaScript ES modules, run it through a local web server (not by double-clicking `index.html`). For example, in this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a GitHub repository (for example `little-by-little-journal`).
2. Upload all files in this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
5. Wait for GitHub Pages to publish the site.

## Google sign-in and cross-device saving

The project currently works in **local demo mode** without setup. Answers are saved in the browser using `localStorage`. This is not cross-device storage and is not an account-protected journal.

To enable real Google sign-in and cloud sync:

1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Add a Web App and copy its config into `firebase-config.js`.
3. In **Authentication → Sign-in method**, enable **Google**.
4. In **Authentication → Settings → Authorized domains**, add your GitHub Pages hostname (e.g. `yourname.github.io`).
5. Create a **Cloud Firestore** database.
6. Publish rules similar to the following (review before production):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journal/{documentId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

7. Replace the placeholder values in `firebase-config.js` with the actual Firebase config. Do not put service-account keys or private server credentials in this file.
8. Test Google sign-in, sign-out, and saving on more than one device before sharing the link.

## Notes

- The Google sign-in button will explain setup requirements while Firebase configuration is still placeholder text.
- Demo-mode entries are stored in the current browser only. Do not enter sensitive personal information into a public demo.
- This is a front-end starter, not a deployed site. Google login and cloud sync become active only after Firebase is configured.
- The cat mascot uses lightweight SVG/CSS animation and respects `prefers-reduced-motion`.
