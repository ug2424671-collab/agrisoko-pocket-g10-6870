# COMBO_A3_G-10-6870 - Demonstration video script

Companion to the nine required shots in [`README.md`](README.md). That table is the requirement; this
file only turns it into exact taps and a time budget.

Target: 2 min 55 s. Hard limit: 3 min. One continuous take, no cuts, no speed changes, no re-ordering.

Save as `evidence/COMBO_A3_G-10-6870_DEMO.mp4`.

## Before you record

1. Install `build/AgriSokoPocket_G-10-6870.apk` and launch it from the app drawer, **not** from Expo Go.
2. Start the API on a laptop on the same Wi-Fi, one terminal window visible in the recording:
   `cd ai-api && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. In the app, open **About**, set the API base URL to `http://<laptop-ip>:8000`, confirm reachable.
4. Have these browser tabs open in advance: the repository, the `v1.0.0` release page, and one
   evidence file from `ai-api/data/members.json`.
5. Have the printed and signed `CONTRIBUTIONS.pdf`, `TEST_LOG.pdf` and `FEEDBACK.pdf` on the desk.
6. Put the phone in Do Not Disturb, set brightness to maximum, and show a clock in frame.
7. Decide the font size: 130 % proves the large-text requirement, default proves nothing. Use 130 %.

## Shot list with time budget

| Time | Required shot | Do this | Say this |
| --- | --- | --- | --- |
| 0:00-0:10 | 1a | App drawer, launch the installed app. Keep the clock visible. | "AgriSoko Pocket, group code G-10-6870, standalone APK." |
| 0:10-0:35 | 1b | Each member in turn states name and technical contribution, about 5 seconds each | Kiir: product, repository and approved data contract. Menzi: TF-IDF engine and threshold. Uwase: FastAPI contract. Shyaka: mobile screens and navigation. Umutoni: offline lookup and cache. |
| 0:35-0:55 | 2a, 3 | **Ask** tab, tap the suggestion **"Who is the AI and data engineer?"**, press **Ask the team**. On **AI result**, read name, confidence and reason. | "A role question is matched to one approved record. Confidence is above the documented 0.45 threshold and the reason lists the terms that matched." |
| 0:55-1:10 | 2b, 3 | Back to **Ask**, type **"Kiir"**, press **Ask the team**. On the result, scroll to the generated introduction. | "The introduction is assembled from approved fields only. Nothing is invented." |
| 1:10-1:25 | 4 | Ask **"Who makes the potato value chain better?"** | "The engine is lexical. When it is not sure it refuses to guess and suggests names and features instead." |
| 1:25-1:40 | 5 | Open the matched member profile, read role and contribution, tap one evidence link. The browser opens the repository file. | "Every claim links to a file in the repository, so a visitor can check it." |
| 1:40-1:55 | 6 | Airplane mode on, ask **"Kiir Deng Kur"**. Point at the **Offline match** label. Airplane mode off, ask again, show **Live AI match**. | "Offline, the bundle answers and the label says so. Online, the label returns to live." |
| 1:55-2:20 | 7 | Terminal: `curl -s http://127.0.0.1:8000/model-info`, then the evaluation summary from `ai-api/evaluation/RESULTS.md`. | "Model version, dataset fingerprint, threshold and the recorded evaluation: fifteen of fifteen member queries correct, five of five no-match queries refused." |
| 2:20-2:35 | 8 | Browser: repository, `v1.0.0` release page, download asset name. | "Tag v1.0.0, APK attached, commit hash visible on the release page." |
| 2:35-2:45 | 9 | Signed `CONTRIBUTIONS.pdf`, `TEST_LOG.pdf`, `FEEDBACK.pdf` next to the clock | "Contribution record, test log and consented feedback, signed." |
| 2:45-2:55 | close | Back on Home, hold on the group code and version | "AgriSoko Pocket, G-10-6870, version 1.0.0." |

## Claims you may and may not make

| Say | Do not say |
| --- | --- |
| "15 of 15 member queries correct, 5 of 5 no-match queries refused" | Any accuracy figure you did not run yourself |
| "Threshold 0.45, chosen from a recorded sweep" | "Works perfectly" or "understands any question" |
| "Deterministic TF-IDF, no invented facts" | That it uses a large language model |
| "Tested on this device, Android <version>" | A device or tester you did not actually use |

## After recording

1. Copy the file to `evidence/COMBO_A3_G-10-6870_DEMO.mp4`.
2. Fill the device row and tick the states you actually showed in `evidence/TEST_LOG.md` section 4.
3. Re-run `bash docs/make_pdfs.sh` so the PDFs match the updated evidence.
