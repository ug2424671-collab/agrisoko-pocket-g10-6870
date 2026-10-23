# Evidence folder

Every file the assignment requires, plus the Markdown source used to produce the PDFs.

| File | Status | How to produce it |
| --- | --- | --- |
| `COMBO_A3_G-10-6870_REPORT.pdf` | **to record/export** | `COMBO_A3_G-10-6870_REPORT.md` converted to PDF, 1-10 pages |
| `COMBO_A3_G-10-6870_DEMO.mp4` | **to record** | one continuous, unedited MP4, max 3 minutes, see the shot list below |
| `CONTRIBUTIONS.pdf` | **to complete and sign** | fill `CONTRIBUTIONS.md`, print, sign, export to PDF |
| `TEST_LOG.pdf` | **to complete** | fill `TEST_LOG.md` from the real runs, export to PDF |
| `FEEDBACK.pdf` | **to complete** | fill `FEEDBACK.md` with consented tester feedback, export to PDF |
| `AI_USE.md` | **to complete** | name every AI tool, purpose, prompts, affected files, checks |

## Demonstration video shot list (max 3 minutes, continuous, unedited)

Show the group code, the device or terminal clock and the final commit hash in frame.

| # | Shot | Required content |
| --- | --- | --- |
| 1 | Phone home screen | Installed app icon, launch the standalone APK without Expo Go. Each member states their name and technical contribution (about 8 seconds each). |
| 2 | Ask screen | One name query, one role or feature query. |
| 3 | Result screen | Confidence, reason and generated introduction are visible. |
| 4 | Deliberate no-match | An unrelated question, showing the no-match explanation and suggestions. |
| 5 | Member profile | Open the matched profile, then follow one repository evidence link in the browser. |
| 6 | Offline | Turn off connectivity, repeat an exact name query, point out the `Offline match` label, reconnect and retry to show `Live AI match`. |
| 7 | Terminal | `GET /model-info` with the dataset fingerprint, and the AI evaluation summary. |
| 8 | Browser | GitHub repository, `v1.0.0` release page and the APK asset. |
| 9 | Documents | Signed `CONTRIBUTIONS.pdf`, `TEST_LOG.pdf`, `FEEDBACK.pdf` and the device or terminal clock. |

Keep one continuous take. Do not cut, speed up or re-order shots.

## Converting Markdown to PDF

Any of these work; use whichever is available on your machine.

```bash
# pandoc + a LaTeX engine
pandoc CONTRIBUTIONS.md -o CONTRIBUTIONS.pdf --pdf-engine=xelatex -V geometry:margin=2cm

# or LibreOffice (writes a PDF next to the file)
soffice --headless --convert-to pdf CONTRIBUTIONS.md

# or open the file in VS Code / a browser and use Print to PDF
```

Check the result is readable, the page count is inside the limit and no placeholder text such as
`TODO` or `(fill in)` remains.
