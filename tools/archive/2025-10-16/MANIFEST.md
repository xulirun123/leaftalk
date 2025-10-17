# 2025-10-16 Archive Manifest

This manifest documents files archived as part of the "去脚本化 (de-scripting)" effort. The goal is to ensure no wrapper/monitor/demo scripts participate in runtime. All functionality is served directly by the application code (server/app.js) and standard tooling (Vite/PM2/node).

## Summary
- Archived runtime wrapper scripts in server/ and deployment/server/
- Archived Windows .bat helper scripts under scripts/
- Archived demo/test HTML pages (public/src/dist)
- Updated nested package.json files to remove script entries that referenced archived files

## Archived Files

### Server runtime wrappers
- leaftalk-new/server/start-server.js
- leaftalk-new/server/start-debug.js
- leaftalk-new/server/monitor-server.js
- leaftalk-new/server/start-all.bat
- leaftalk-new/server/start-with-log.bat
- leaftalk-new/server/start-with-monitor.bat
- leaftalk-new/server/webrtc/start-webrtc.js

### Deployment runtime wrappers (duplicates)
- leaftalk-new/deployment/server/start-server.js
- leaftalk-new/deployment/server/monitor-server.js
- leaftalk-new/deployment/server/start-all.bat
- leaftalk-new/deployment/server/start-with-monitor.bat
- leaftalk-new/deployment/server/webrtc/start-webrtc.js

### Dev helper scripts (.bat)
- leaftalk-new/scripts/install-all.bat
- leaftalk-new/scripts/install-client-deps.bat
- leaftalk-new/scripts/install-server-deps.bat
- leaftalk-new/scripts/quick-login.bat
- leaftalk-new/scripts/show-users.bat
- leaftalk-new/scripts/start-dev.bat

### Demo/Test pages
- leaftalk-new/src/debug-user-data.html
- leaftalk-new/public/test.html
- leaftalk-new/public/test-audio.html
- leaftalk-new/dist/test.html
- leaftalk-new/dist/test-audio.html

All above files were moved under: tools/archive/2025-10-16/<original-path>

## Edits to remove script references
Updated nested package.json to remove references to archived files:
- leaftalk-new/server/package.json: removed scripts monitor/start:monitor/webrtc/webrtc:dev/install:all/clean; kept start/dev/test
- leaftalk-new/deployment/server/package.json: removed same set; kept start/dev/test

## Notes
- Production now serves frontend dist via server/app.js with SPA fallback. No separate frontend server script is used.
- PM2 (if used) should point directly to server/app.js (see deployment/ecosystem.config.js).
- If any workflow depended on the archived scripts, use npm run dev (root) for development and node server/app.js or PM2 for production.

