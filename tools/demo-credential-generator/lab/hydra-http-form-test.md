# Test Hydra on HTML form login (lab)

## 1. Start the lab login page

Terminal A:

```bash
cd tools/demo-credential-generator/lab
python3 http_login_server.py --port 8080
```

Open http://127.0.0.1:8080/login — failed login shows **Invalid credentials**.

## 2. Build Hydra `-C` file

Terminal B:

```bash
cd tools/demo-credential-generator/lab
cat > hydra-C.txt << 'EOF'
alice@lab.test:Alice123!
alice@lab.test:wrong
bob@lab.test:Bob123!
bob@lab.test:wrong
EOF
```

Or from baseline bot + export:

```bash
cat > emails.txt << 'EOF'
alice@lab.test
bob@lab.test
EOF
# ... demo_password_bot + export_hydra_c.py
```

## 3. Run Hydra (http-post-form)

From your `thc-hydra` directory:

```bash
./hydra -C hydra-C.txt -t 4 -f \
  -o http-results.txt -b text \
  127.0.0.1 http-post-form \
  "/login:user=^USER^&pass=^PASS^:F=Invalid credentials"
```

Syntax breakdown:

| Piece | Meaning |
|-------|---------|
| `/login` | POST path (same as form `action`) |
| `user=^USER^&pass=^PASS^` | POST body; field names match `<input name="...">` |
| `F=Invalid credentials` | Failure if this text appears in the response |

Optional: `-V` or `-vV` for verbose while learning.

## 4. Check results

```bash
cat http-results.txt
```

## 5. Real lab app (not this server)

1. Browser DevTools → **Network** → submit a **failed** login.  
2. Note: **URL**, **method POST**, **form field names**, **response body** snippet on failure.  
3. `hydra -U http-post-form` for full options (`H=`, `S=`, cookies, etc.).

HTTPS: use `https-post-form` and `-S` if needed:

```bash
./hydra ... -S 127.0.0.1 https-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid"
```
