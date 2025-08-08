## PLAN

### SCOPE

_Naive concurrent editing_ Two people can edit the same spreadsheet. No
permission system. Last write wins. When you connect, you see current state.
When someone else makes a change, it appears on your screen.

### Vertical slice = end-to-end user story with minimal features:

\_\_see claude chat 'project vertical slice strategy'

User opens website, sees basic spreadsheet User edits cell, change persists to
server Second user opens same URL, sees the edit Deploy both frontend and
backend

Next practical steps: Week 1: Basic server

Node.js server with single endpoint: POST /cells/:id SQLite with one table:
cells(id, value) Return JSON, no websockets yet

Week 2: Frontend integration

Modify your Vue app to HTTP POST on cell change Add "saving..." indicator in UI
Handle basic errors (server down, timeout)

Week 3: Deploy

Frontend to Netlify (you know this) Backend to Railway/Render/Fly.io (new
territory) SQLite file persists between deployments

Week 4: Add websockets

Replace HTTP polling with live connections Server broadcasts changes to all
connected clients Now you have real-time sync
