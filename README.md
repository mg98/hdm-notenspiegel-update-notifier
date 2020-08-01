# HdM Notenspiegel Update Notifier

Dieses Tool erlaubt dir schnellstmöglich über Änderungen in deinem Notenspiegel Bescheid zu bekommen.

## Wie funktioniert's?

Eine Lambda-Funktion überprüft in Abständen von 15 Minuten den Status deines Notenspiegels. Dazu verwendet es deine hinterlegten Login-Daten um sich in den SB-Funktionen einzuloggen. Das HTML des Notenspiegels wird in einem S3-Bucket gespeichert. Wenn sich nun bei einer Abfrage der aktuelle Stand von dem letzten Stand unterscheidet, wird eine SMS an die von dir hinterlegte Handynummer versandt.

## Installieren

**Voraussetzungen:**
- Node.js 12
- Einen [AWS](https://aws.amazon.com/de/) Account (ein AWS Educate Account von der HdM sollte ebenfalls reichen)
- Serverless CLI (`npm install -g serverless`)

1. `git clone https://github.com/mg98/hdm-notenspiegel-update-notifier`
2. `cd hdm-notenspiegel-update-notifier`
3. `cp .env.example .env`
4. Bearbeite die Datei `.env` um hier dein HdM-Kürzel, Passwort und deine Handynummer einzugeben. Bitte denke daran, Sonderzeichen mit einem `\` zu escapen.
5. `npm install`
6. `sls deploy`

Auf deinem AWS Account wurde jetzt eine Lambda-Funktion initiiert, welche alle 15 Minuten ausgeführt wird und dich up-to-date halten wird, wenn sich etwas an deinem Notenspiegel ändert. Du bist nun fertig!

Die App kann mit dem Befehl `npm start` auch lokal ausgeführt werden.
