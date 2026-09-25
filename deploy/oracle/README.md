# Deploying SideBySide on Oracle Cloud (Always Free, $0)

Why Oracle Cloud specifically: this app runs a custom Node server (`server.ts`,
not `next start`) that holds long-lived WebSocket connections, uses native
addons (`node-pty`, `better-sqlite3`), and — for the `/sandbox` feature —
shells out to `docker run`/`docker stop` directly against a Docker daemon on
the host. That combination rules out serverless hosts (Vercel, Netlify): no
persistent process, no raw WS upgrades, and definitely no host Docker daemon.
Oracle's Always Free tier gives a real, always-on Ampere A1 ARM VM (up to 4
OCPU / 24GB RAM) forever, at $0 — a real Linux box, which is what this app
actually needs.

## How this is split

1. **Auth setup (manual, one-time)** — run the wizard to generate an OCI API
   signing key, upload it in the console, and write `~/.oci/config` +
   `terraform/terraform.tfvars`. Only this part requires clicking through
   Oracle's console, because API credentials can't be created any other way.
2. **Infrastructure (`terraform/`)** — the VCN, subnet, security list
   (opens 22/80/443), and the Ampere A1 instance itself, plus cloud-init that
   installs Docker and opens the OS-level firewall on first boot. Fully
   scripted, re-appliable, and disposable (`terraform destroy` tears it all
   down — useful if you want to stop paying $0 even more thoroughly).
3. **App deployment (`deploy.sh`, after `terraform apply`)** — rsyncs the repo
   up, installs Node 22 + build tooling, runs `npm install`/`npm run build`,
   builds the sandbox Docker image, installs a systemd unit so the app
   survives reboots/crashes, and puts Caddy in front on port 80 as a reverse
   proxy with HTTP Basic Auth (the app itself only ever listens on
   `127.0.0.1`, never on a public interface). Idempotent — re-run it after
   any code change to redeploy.

## Run it

```bash
# Stage 1: one-time OCI auth setup (interactive, opens your browser)
bash <path-to-wizard>/oracle-terraform-auth.sh

# Stage 2: provision the VM
cd deploy/oracle/terraform
terraform init
terraform plan
terraform apply

# Stage 3: deploy the app (from the repo root, or cd ..)
cd ..
./deploy.sh ubuntu@"$(terraform -chdir=terraform output -raw public_ip)"
```

`deploy.sh` prints the URL and the Basic Auth credentials (a random password
is generated unless you set `BASIC_AUTH_PASSWORD` yourself) at the end — save
that password, it isn't stored anywhere.

If `apply` fails with `Out of host capacity for shape VM.Standard.A1.Flex`,
that's Oracle's free-tier ARM capacity being exhausted in that availability
domain right now — common, not a misconfiguration. Retry with
`terraform apply -var=availability_domain_index=1` (or `2`), or just wait a
few minutes and re-run.

## What's still manual / not yet automated

- **`data/gateways.json`** (your real LLM gateway API keys) is gitignored and
  `deploy.sh` never syncs it in either direction — SSH in and create it
  directly on the box (`ssh ubuntu@<ip>`, then edit
  `~/sidebyside/data/gateways.json`).
- **No TLS.** Basic Auth runs over plain HTTP unless you point a real domain
  at the instance and change the site address in `deploy.sh`'s Caddyfile
  heredoc (the `:80 {` line) from `:80` to your domain name, then re-run
  `deploy.sh` — Caddy then gets automatic Let's Encrypt HTTPS for free. Worth
  doing before relying on this beyond quick testing, since Basic Auth over
  plain HTTP sends the password unencrypted.
- `terraform destroy` removes the VM and network but leaves your local
  `~/.oci/config`/API key and `~/.ssh/oci_sidebyside` in place — delete those
  by hand for a full teardown.
