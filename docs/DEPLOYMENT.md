# Deployment

## Why this can't go on Vercel/Netlify/serverless

This app needs a real, always-on Linux process, not a serverless function,
for three concrete reasons:

1. **Long-lived WebSocket connections** — the Sandbox terminal streams over
   a raw WebSocket for as long as a CLI session runs. Serverless platforms
   don't hold connections open like that.
2. **A Docker daemon on the host** — Sandbox sessions run
   `docker run`/`docker stop` directly against whatever Docker the server
   process can reach. There's no Docker daemon behind a serverless function.
3. **Native addons** (`node-pty`, `better-sqlite3`) and a persistent SQLite
   file on disk — needs a real filesystem and a matching-architecture
   native build, not an ephemeral/read-only serverless runtime.

So this needs an actual VM (or your own machine) with Docker installed.

## The $0 path: Oracle Cloud Always Free

[`deploy/oracle/`](../deploy/oracle/README.md) provisions an Oracle Cloud
"Always Free" Ampere A1 ARM VM (up to 4 OCPU / 24GB RAM, free forever, not a
trial) and deploys onto it:

1. **`oracle-terraform-auth.sh`** (a one-time interactive wizard) — generates
   an OCI API signing key, walks you through uploading it in the console,
   and writes `~/.oci/config` + `terraform/terraform.tfvars`. This is the
   only step that has to happen through Oracle's web console.
2. **`terraform/`** — provisions the VCN, subnet, security list (opens
   22/80/443), and the instance itself, with cloud-init installing Docker
   and opening the OS-level firewall on first boot.
3. **`deploy.sh`** — rsyncs the repo up, installs Node 22 + build tooling,
   `npm install && npm run build`, builds the sandbox Docker image,
   installs a systemd unit (auto-restart, survives reboot), and puts Caddy
   in front on port 80 as a reverse proxy with HTTP Basic Auth. The app
   itself only ever listens on `127.0.0.1` — Caddy is the only thing
   listening on a public interface.

Full instructions, including what to do if you hit Oracle's "Out of host
capacity" error on the free-tier shape: [`deploy/oracle/README.md`](../deploy/oracle/README.md).

## Security notes for any deployment target

Whichever host you use, keep these in mind — they're not specific to
Oracle:

- **`data/gateways.json` holds real API keys.** It's gitignored and no
  deploy path here syncs it automatically in either direction — create it
  directly on the target machine.
- **The Sandbox feature can spawn containers on request.** Anyone who can
  reach the app can start a resource-limited (`--cpus 2 --memory 2g
  --pids-limit 256 --cap-drop ALL`) but real container running a coding
  agent CLI. Don't expose this to the open internet without authentication
  in front of it.
- **Basic Auth over plain HTTP sends the password in the clear.** Fine for
  quick testing behind a Basic Auth prompt; if you're relying on this beyond
  that, point a real domain at the instance so Caddy can get automatic
  Let's Encrypt HTTPS.
