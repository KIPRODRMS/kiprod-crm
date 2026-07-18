KIPROD CRM MOBILE + CONTACT FIX

WHAT THIS FIXES
1. Removes the corrupted "View all" arrow display on the management dashboard.
2. Moves the global search to a full-width second row on mobile.
3. Restores each contact as a separate card.
4. Restores compact Call and Message actions.
5. Keeps WhatsApp and Email actions when those details exist.
6. Replaces the oversized View button with a small Profile action.
7. Adds a subtle card entrance animation and hover lift.

HOW TO APPLY
1. Extract this folder.
2. Open PowerShell in your kiprod-crm project root.
3. Run the script from wherever you extracted it, for example:
   & "C:\path\to\kiprod-crm-mobile-fix\apply-fix.ps1"
4. Run:
   npm run build
5. If the build passes:
   git add .
   git commit -m "Fix mobile search and contact cards"
   git push

The script backs up the two replaced TSX files inside:
.kiprod-backups\mobile-contact-fix
