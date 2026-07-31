# Firehawk Automobile — User Guide

A simple guide to browsing, searching, and adding to your car dataset. No technical knowledge
needed.

## Opening the site

Go to the site's web address in any browser (Chrome, Edge, Safari, etc.). You'll see a table of
automobiles, some summary numbers at the top, and a row of filters.

## Browsing and searching

- The table shows one car per row: name, origin, MPG, horsepower, and more.
- Type into the **Search** box to find cars by name (e.g. type "toyota"). The list updates a
  moment after you stop typing — no need to press Enter.
- Click a column heading (like **MPG** or **Name**) to sort the table by that column. Click it
  again to reverse the order.
- Click any row to see the car's full details in a pop-up window.

## Filtering

Use the dropdowns and MPG boxes above the table to narrow down the list:

- **Origin** — pick USA, Europe, or Japan to show only cars from that region.
- **Cylinders** — pick a cylinder count to show only matching cars.
- **Min MPG** / **Max MPG** — type numbers to show only cars in that fuel-economy range.
- You can combine several filters at once. The summary numbers at the top (total count, average
  MPG, horsepower, weight) update to reflect whatever's currently shown.
- Click **Reset filters** to clear everything and see the full list again.

## Your filters are remembered

If you close the browser (even by accident) and come back later, your last search, filters, sort
order, and page all come back automatically — you don't need to set them up again. This is stored
only on the device/browser you used, so it won't follow you to a different computer.

## Downloading a CSV backup

Click **Export CSV** above the table. This downloads a spreadsheet file (`.csv`) of whatever is
currently shown — if you have filters applied, only the matching cars are included; with no
filters, you get everything. Open it in Excel, Google Sheets, or any spreadsheet program.

## Adding a new car

1. Click **Add a Car** in the menu (the ☰ icon in the top-left opens the menu on smaller
   screens).
2. The first time, you'll be asked for an **admin key** — a password set up when the site was
   deployed. Enter it once; you won't be asked again until you fully close and reopen your
   browser.
3. Fill in the form: name, origin, MPG, cylinders, displacement, horsepower, weight,
   acceleration, and model year. Fields marked as required must be filled in; horsepower has a
   "Leave blank if unknown" note and can be skipped.
4. Click **Add Car**. You'll see a confirmation message and be taken back to the list, where your
   new car now appears.

**Don't have the admin key, or it's not working?** Whoever set up the site (or deployed it) will
have it — it's a single shared password, not a personal login.

## If something goes wrong

- A message at the bottom of the screen (a "snackbar") tells you what happened, in plain
  language — e.g. "Unable to reach the server" usually means an internet connection problem.
- If the table shows "Something went wrong," try reloading the page. If it keeps happening, let
  whoever manages the site know.
