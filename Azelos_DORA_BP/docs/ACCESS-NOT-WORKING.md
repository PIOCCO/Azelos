# Nothing works — start here

## One fact

**`localhost` always means “the computer where the browser runs”.**

If Uvicorn runs on a **remote lab** (`piocco`) and Chrome runs on **your laptop**, then `http://localhost:8000` on the laptop **will refuse** unless you use an **SSH tunnel**.

Terminal `curl` on the lab working does **not** mean your laptop browser will work.

---

## Step 1 — On the lab (where the code lives)

```bash
cd ~/Azelos/Azelos_DORA_BP
docker compose up -d postgres
./scripts/access-info.sh
```

Fix every line marked `[!!]`.

Start server (leave running):

```bash
./scripts/run-server.sh
```

You must see: `Uvicorn running on http://0.0.0.0:8000`

---

## Step 2 — On your laptop (where the browser is)

Open a **new** terminal on the laptop:

```bash
ssh -N -L 8000:127.0.0.1:8000 piocco@<lab-address>
```

Replace `<lab-address>` with the hostname or IP you use for SSH.

**Keep that SSH window open.**

Browser on laptop: **http://localhost:8000**

Test on laptop:

```bash
curl -s http://127.0.0.1:8000/health
```

Must print `{"status":"alive"}` before the browser will work.

---

## Step 3 — Proxy / VPN

- Turn **off VPN** for a test.
- Browser: disable proxy or add bypass `127.0.0.1, localhost`.
- Use **http://** not **https://**.

---

## Step 4 — Still stuck

Send the full output of:

```bash
./scripts/access-info.sh
```

from the lab, and from the laptop:

```bash
curl -v http://127.0.0.1:8000/health
```
