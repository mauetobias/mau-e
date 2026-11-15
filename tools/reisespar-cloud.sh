#!/usr/bin/env bash
# Einmalige Einrichtung von Google Cloud Run für den Reisespar-Server.
# In der Google Cloud Shell ausführen (shell.cloud.google.com):
#   curl -sL https://mau-e.com/tools/reisespar-cloud.sh | bash
# Das Skript kann gefahrlos mehrfach laufen.
set -euo pipefail

PROJECT_NUMBER=26026964908
REGION=europe-west1
REPO=mauetobias/reisespar
POOL=github
PROVIDER=reisespar

say() { printf '\n\033[1m%s\033[0m\n' "$*"; }

PID=$(gcloud projects list --filter="projectNumber=$PROJECT_NUMBER" --format='value(projectId)' | head -1)
if [ -z "$PID" ]; then echo "Projekt $PROJECT_NUMBER nicht gefunden. Bist du mit dem richtigen Google-Konto angemeldet?"; exit 1; fi
gcloud config set project "$PID" >/dev/null
say "Projekt: $PID"

say "1/6 Dienste einschalten (dauert etwa eine Minute)"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com iam.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com \
  cloudbilling.googleapis.com --quiet

say "2/6 Abrechnung prüfen"
BILLING=$(gcloud billing projects describe "$PID" --format='value(billingEnabled)' 2>/dev/null || echo "")
if [ "$BILLING" != "True" ]; then
  cat <<EOF
Cloud Run braucht ein hinterlegtes Zahlungsmittel, auch wenn du im Gratiskontingent bleibst.
Öffne https://console.cloud.google.com/billing/linkedaccount?project=$PID
verknüpfe ein Rechnungskonto und starte dieses Skript danach einfach noch einmal.
Tipp: Unter Abrechnung > Budgets ein Budget von 1 € mit E-Mail-Warnung anlegen.
EOF
  exit 1
fi
echo "Abrechnung ist aktiv."

say "3/6 Ablage für den Server-Container anlegen"
gcloud artifacts repositories describe reisespar --location "$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create reisespar --repository-format=docker --location "$REGION" \
    --description "Reisespar Server" --quiet
# Alte Container automatisch löschen, damit das Gratiskontingent (0,5 GB) reicht
cat > /tmp/cleanup.json <<'EOF'
[{"name":"nur-neueste-behalten","action":{"type":"Keep"},"mostRecentVersions":{"keepCount":3}},
 {"name":"rest-loeschen","action":{"type":"Delete"},"condition":{"tagState":"any"}}]
EOF
gcloud artifacts repositories set-cleanup-policies reisespar --location "$REGION" --policy /tmp/cleanup.json --no-dry-run --quiet >/dev/null || true

say "4/6 Geheimnisse anlegen"
mk_secret() {
  local name=$1 value=$2
  if ! gcloud secrets describe "$name" >/dev/null 2>&1; then
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=- --replication-policy=automatic --quiet >/dev/null
    echo "angelegt: $name"
  else
    echo "vorhanden: $name"
  fi
}
TOKEN="reise-$(openssl rand -hex 3)"
mk_secret reisespar-app-token "$TOKEN"
mk_secret reisespar-serpapi leer
mk_secret reisespar-blablacar leer
TOKEN=$(gcloud secrets versions access latest --secret reisespar-app-token)

RUNTIME_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
for s in reisespar-app-token reisespar-serpapi reisespar-blablacar; do
  gcloud secrets add-iam-policy-binding "$s" --member "serviceAccount:$RUNTIME_SA" \
    --role roles/secretmanager.secretAccessor --quiet >/dev/null
done

say "5/6 GitHub darf veröffentlichen (ohne gespeicherten Schlüssel)"
gcloud iam workload-identity-pools describe "$POOL" --location global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL" --location global --display-name "GitHub" --quiet
gcloud iam workload-identity-pools providers describe "$PROVIDER" --location global --workload-identity-pool "$POOL" >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" --location global --workload-identity-pool "$POOL" \
    --display-name "Reisespar" --issuer-uri "https://token.actions.githubusercontent.com" \
    --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition "assertion.repository=='$REPO'" --quiet
MEMBER="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO"
for role in roles/run.admin roles/artifactregistry.writer roles/browser; do
  gcloud projects add-iam-policy-binding "$PID" --member "$MEMBER" --role "$role" --condition None --quiet >/dev/null
done
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" --member "$MEMBER" --role roles/iam.serviceAccountUser --quiet >/dev/null

say "6/6 Fertig"
cat <<EOF

Alles eingerichtet. Ab jetzt landet jede Änderung am Server automatisch hier:
  https://reisespar-$PROJECT_NUMBER.$REGION.run.app

Dein App Token (einmal in der App unter Mehr > Server eintragen):
  $TOKEN

Später Schlüssel nachtragen (jeweils eine Zeile):
  printf 'DEIN_SERPAPI_KEY' | gcloud secrets versions add reisespar-serpapi --data-file=-
  printf 'DEIN_BLABLACAR_KEY' | gcloud secrets versions add reisespar-blablacar --data-file=-
Danach im GitHub-Repo unter Actions den Workflow "Server testen" einmal neu starten.
EOF
