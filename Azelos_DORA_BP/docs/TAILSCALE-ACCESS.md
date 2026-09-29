# Access DORA over Tailscale (no SSH tunnel)

Both your **laptop** and **Ubuntu lab** must be on the **same Tailscale network** (tailnet).

## 1. On Ubuntu (lab)

Start Postgres + API (keep running):

```bash
cd ~/Azelos/Azelos_DORA_BP
docker compose up -d postgres
./scripts/run-server.sh
```

Confirm listen on all interfaces:

```bash
ss -tlnp | grep 8000
# should show 0.0.0.0:8000 or *:8000
```

Get Tailscale IP:

```bash
tailscale ip -4
# example: 100.64.12.34
```

Optional helper:

```bash
./scripts/access-info.sh
```

## 2. On laptop (browser)

Open (use your lab’s Tailscale IP):

```text
http://100.x.x.x:8000
```

If **MagicDNS** is on in Tailscale admin:

```text
http://<ubuntu-machine-name>:8000
```

Login: `admin@demo.bank` / `ChangeMeNow!`

Test from laptop terminal:

```bash
curl -s http://100.x.x.x:8000/health
```

## 3. If connection refused

**Ubuntu firewall (ufw):**

```bash
sudo ufw allow in on tailscale0 to any port 8000 proto tcp
# or temporarily: sudo ufw disable   (dev only)
```

**Server not running** — `./scripts/run-server.sh` must stay up on Ubuntu.

**Wrong IP** — use `tailscale ip -4` on Ubuntu, not LAN `192.168.x.x` unless you prefer LAN.

## 4. CORS

Default API CORS is permissive (`*`). No change needed for Tailscale IP.

## 5. HTTPS (optional)

For TLS without SSH, use [Tailscale Serve](https://tailscale.com/kb/1312/serve) on the lab — out of scope for default dev setup; **http://100.x.x.x:8000** is enough on a private tailnet.
