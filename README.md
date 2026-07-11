# Depot Dashboard V4.3

Fehlerbehebung:
- Prüfung von `window.D` auf `typeof D === "undefined"` korrigiert.
- `data.js` definiert `const D`; diese Variable ist im Browser nicht automatisch `window.D`.
- Cache-Version auf 4.3 angehoben.

Alle Dateien gemeinsam hochladen und ersetzen.
