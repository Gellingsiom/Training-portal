# Training records setup (about 5 minutes)

Every time someone passes a course, the portal saves their name, workplace, course, score, date and certificate number to a Google Sheet. You can then open `records.html` to search, print a list for a workplace, or reprint any certificate.

## 1. Make the sheet
1. In the Gellings Google account, create a new Google Sheet called **Gellings Training Records**.
2. Go to **Extensions → Apps Script**.
3. Delete what's in the editor, paste in everything from `admin/training-records.gs`, and press **Save**.

## 2. Create your admin key
1. In the function menu at the top, pick **setup** and press **Run**.
2. Google will ask for permission. Choose your account, then **Advanced → Go to (project name)**. This warning appears for any script you write yourself.
3. Open **Execution log**. Copy the **admin key** it shows and keep it somewhere safe.

## 3. Publish it
1. **Deploy → New deployment**, click the cog and choose **Web app**.
2. Execute as: **Me**. Who has access: **Anyone**.
3. Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).

"Anyone" lets the portal send records in. Reading them back always needs your admin key.

## 4. Switch it on
Put the Web app URL in both places (or send it to Claude to do):
- `index.html`: `recordUrl: '...'`
- `records.html`: `const RECORDS_URL = '...'`

Then open `records.html` on the site and enter your admin key.

## Good to know
- Only passes made **after** it's switched on are recorded.
- If you change the script later: **Deploy → Manage deployments → Edit → Version: New version**. The URL stays the same.
- The sheet itself is the master record. You can sort, filter or delete rows there as normal.
