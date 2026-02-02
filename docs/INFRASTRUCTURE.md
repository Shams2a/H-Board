# Infrastructure Horus - Documentation Technique

## Vue d'ensemble

Cette documentation décrit l'infrastructure réseau complète pour le projet H-Board avec authentification SSO via Authentik.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE HORUS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  │
│  │   Client    │────▶│   Traefik   │────▶│  Authentik  │     │  dnsmasq  │  │
│  │   Browser   │     │   (Proxy)   │     │   (IdP)     │     │   (DNS)   │  │
│  │ 192.168.1.22│     │192.168.1.95 │     │192.168.1.187│     │192.168.1. │  │
│  └─────────────┘     └──────┬──────┘     └─────────────┘     │    210    │  │
│                             │                                 └───────────┘  │
│                             ▼                                                │
│                      ┌─────────────┐                                         │
│                      │  Supabase   │                                         │
│                      │  (Backend)  │                                         │
│                      │192.168.1.86 │                                         │
│                      └─────────────┘                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Inventaire des Services

| Service | IP | Port(s) | Rôle | Domaine |
|---------|-----|---------|------|---------|
| **dnsmasq** | 192.168.1.210 | 53 | Serveur DNS local | - |
| **Traefik** | 192.168.1.95 | 80, 443, 8080 | Reverse proxy / Load balancer | *.horus.local |
| **Authentik** | 192.168.1.187 | 443 | Identity Provider (SSO/OIDC) | authentik.horus.local |
| **Supabase** | 192.168.1.86 | 8000 | Backend (Auth, DB, API) | supabase.horus.local |
| **App React** | 192.168.1.22 | 5173 | Frontend H-Board | - |

---

## 2. Configuration DNS (dnsmasq)

### Emplacement
- **Serveur** : LXC Proxmox (192.168.1.210)
- **Config** : `/etc/dnsmasq.conf`

### Configuration

```conf
# Domaine interne
domain=horus.local
expand-hosts

# Services derrière Traefik
address=/traefik.horus.local/192.168.1.95
address=/supabase.horus.local/192.168.1.95
address=/authentik.horus.local/192.168.1.95

# Wildcard - tous les sous-domaines pointent vers Traefik
address=/.horus.local/192.168.1.95
```

### Commandes utiles

```bash
# Redémarrer dnsmasq
systemctl restart dnsmasq

# Tester la résolution
nslookup authentik.horus.local 192.168.1.210

# Voir les logs
journalctl -u dnsmasq -f
```

### Ajouter un nouveau domaine

1. Éditer `/etc/dnsmasq.conf`
2. Ajouter : `address=/nouveau-service.horus.local/192.168.1.95`
3. Redémarrer : `systemctl restart dnsmasq`

---

## 3. Configuration Traefik

### Emplacement
- **Serveur** : LXC Proxmox (192.168.1.95)
- **Config statique** : `/etc/traefik/traefik.yml`
- **Config dynamique** : `/etc/traefik/dynamic/`
- **Certificats** : `/etc/traefik/certs/`

### Configuration statique (`/etc/traefik/traefik.yml`)

```yaml
api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true

log:
  level: INFO
```

### Configuration dynamique (`/etc/traefik/dynamic/authentik.yml`)

```yaml
http:
  routers:
    # Réécriture Keycloak auth → Authentik
    authentik-keycloak-auth:
      rule: "Host(`authentik.horus.local`) && PathPrefix(`/application/o/supabase/protocol/openid-connect/auth`)"
      entryPoints:
        - websecure
      middlewares:
        - keycloak-auth-rewrite
      service: authentik
      tls: {}
      priority: 100

    # Réécriture Keycloak token → Authentik
    authentik-keycloak-token:
      rule: "Host(`authentik.horus.local`) && PathPrefix(`/application/o/supabase/protocol/openid-connect/token`)"
      entryPoints:
        - websecure
      middlewares:
        - keycloak-token-rewrite
      service: authentik
      tls: {}
      priority: 100

    # Réécriture Keycloak userinfo → Authentik
    authentik-keycloak-userinfo:
      rule: "Host(`authentik.horus.local`) && PathPrefix(`/application/o/supabase/protocol/openid-connect/userinfo`)"
      entryPoints:
        - websecure
      middlewares:
        - keycloak-userinfo-rewrite
      service: authentik
      tls: {}
      priority: 100

    # Route principale Authentik
    authentik:
      rule: "Host(`authentik.horus.local`)"
      entryPoints:
        - websecure
      service: authentik
      tls: {}
      priority: 1

  middlewares:
    keycloak-auth-rewrite:
      replacePath:
        path: "/application/o/authorize/"

    keycloak-token-rewrite:
      replacePath:
        path: "/application/o/token/"

    keycloak-userinfo-rewrite:
      replacePath:
        path: "/application/o/userinfo/"

  services:
    authentik:
      loadBalancer:
        servers:
          - url: "https://192.168.1.187"
        serversTransport: skip-verify

  serversTransports:
    skip-verify:
      insecureSkipVerify: true

tls:
  certificates:
    - certFile: /etc/traefik/certs/horus.crt
      keyFile: /etc/traefik/certs/horus.key
```

### Certificat SSL

Le certificat auto-signé couvre `*.horus.local` :

```bash
# Générer un nouveau certificat
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/traefik/certs/horus.key \
  -out /etc/traefik/certs/horus.crt \
  -subj "/CN=horus.local" \
  -addext "subjectAltName=DNS:*.horus.local,DNS:horus.local"
```

### Commandes utiles

```bash
# Redémarrer Traefik
systemctl restart traefik

# Voir les logs
journalctl -u traefik -f

# Voir les routers chargés
curl -s http://192.168.1.95:8080/api/http/routers | jq '.[].name'

# Voir les middlewares
curl -s http://192.168.1.95:8080/api/http/middlewares | jq

# Tester un endpoint
curl -k https://authentik.horus.local/application/o/supabase/.well-known/openid-configuration
```

### Ajouter un nouveau service

1. Créer un fichier `/etc/traefik/dynamic/nouveau-service.yml` :

```yaml
http:
  routers:
    nouveau-service:
      rule: "Host(`nouveau-service.horus.local`)"
      entryPoints:
        - websecure
      service: nouveau-service
      tls: {}

  services:
    nouveau-service:
      loadBalancer:
        servers:
          - url: "http://IP_DU_SERVICE:PORT"
```

2. Traefik recharge automatiquement (watch: true)

---

## 4. Configuration Supabase

### Emplacement
- **Serveur** : 192.168.1.86
- **Répertoire** : `/srv/supabase-project/`
- **Docker Compose** : `/srv/supabase-project/docker-compose.yml`

### Configuration du service Auth (extrait docker-compose.yml)

```yaml
auth:
  container_name: supabase-auth
  image: supabase/gotrue:v2.185.0
  dns:
    - 192.168.1.210
  volumes:
    - ./horus.crt:/etc/ssl/certs/horus.crt:ro
  restart: unless-stopped
  environment:
    GOTRUE_API_HOST: 0.0.0.0
    GOTRUE_API_PORT: 9999
    API_EXTERNAL_URL: ${API_EXTERNAL_URL}

    # Configuration Keycloak/OIDC (Authentik)
    GOTRUE_EXTERNAL_KEYCLOAK_ENABLED: "true"
    GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID: "nlaeWRUHktaFJ178dmvHItYDmAPH1jIQnZ43zff5"
    GOTRUE_EXTERNAL_KEYCLOAK_SECRET: "LhhR2T6DVlibPKJvi5JWLJRwPnTgEOMT2c3Mrum1jjx7AwAzJJNplkEZjQGIOLECWohvIUPc1rwXSznk8UjoSo2lMfOiFSFwpXnZmoTLs2lRzd7nUSGw13ncO0eFFNy6"
    GOTRUE_EXTERNAL_KEYCLOAK_URL: "https://authentik.horus.local/application/o/supabase/"
    GOTRUE_EXTERNAL_KEYCLOAK_SCOPES: "openid email profile"
    GOTRUE_EXTERNAL_KEYCLOAK_REDIRECT_URI: "http://192.168.1.86:8000/auth/v1/callback"

    # Certificat SSL pour Traefik
    SSL_CERT_FILE: "/etc/ssl/certs/horus.crt"

    # Site URL
    GOTRUE_SITE_URL: "http://192.168.1.22:5173"

    # Auto-confirmation (pas d'email requis pour OAuth)
    GOTRUE_MAILER_AUTOCONFIRM: "true"

    # ... autres variables ...
```

### Fichier certificat

Le certificat Traefik doit être copié sur le serveur Supabase :

```bash
# Depuis Traefik vers Supabase
scp root@192.168.1.95:/etc/traefik/certs/horus.crt /srv/supabase-project/horus.crt
```

### Commandes utiles

```bash
# Redémarrer Supabase
cd /srv/supabase-project
docker-compose down && docker-compose up -d

# Voir les logs auth
docker logs supabase-auth -f

# Voir les logs auth (dernières lignes)
docker logs supabase-auth 2>&1 | tail -30

# Tester la résolution DNS depuis le container
docker exec supabase-auth nslookup authentik.horus.local

# Vérifier le certificat dans le container
docker exec supabase-auth cat /etc/ssl/certs/horus.crt | head -5
```

### Variables d'environnement importantes

| Variable | Description |
|----------|-------------|
| `GOTRUE_EXTERNAL_KEYCLOAK_URL` | URL du provider OIDC (via Traefik) |
| `GOTRUE_EXTERNAL_KEYCLOAK_CLIENT_ID` | Client ID Authentik |
| `GOTRUE_EXTERNAL_KEYCLOAK_SECRET` | Client Secret Authentik |
| `GOTRUE_SITE_URL` | URL de l'application frontend |
| `SSL_CERT_FILE` | Chemin du certificat CA |
| `GOTRUE_MAILER_AUTOCONFIRM` | Auto-confirmer les utilisateurs OAuth |

---

## 5. Configuration Authentik

### Emplacement
- **Serveur** : 192.168.1.187
- **Répertoire** : `/srv/authentik/`
- **Interface Admin** : https://192.168.1.187 ou https://authentik.horus.local

### Provider OAuth2/OIDC

| Paramètre | Valeur |
|-----------|--------|
| **Name** | Supabase |
| **Client ID** | `nlaeWRUHktaFJ178dmvHItYDmAPH1jIQnZ43zff5` |
| **Client Secret** | `LhhR2T6DVlibPKJvi5JWLJRwPnTgEOMT2c3Mrum1jjx7AwAzJJNplkEZjQGIOLECWohvIUPc1rwXSznk8UjoSo2lMfOiFSFwpXnZmoTLs2lRzd7nUSGw13ncO0eFFNy6` |
| **Redirect URIs** | `http://192.168.1.86:8000/auth/v1/callback` |
| **Scopes** | `openid`, `email`, `profile` |

### Endpoints OIDC

| Endpoint | URL |
|----------|-----|
| Authorization | `https://authentik.horus.local/application/o/authorize/` |
| Token | `https://authentik.horus.local/application/o/token/` |
| User Info | `https://authentik.horus.local/application/o/userinfo/` |
| OpenID Config | `https://authentik.horus.local/application/o/supabase/.well-known/openid-configuration` |

### Ajouter une nouvelle application

1. **Créer un Provider** :
   - Applications → Providers → Create
   - Type : OAuth2/OpenID Provider
   - Configurer Client ID, Secret, Redirect URIs

2. **Créer une Application** :
   - Applications → Applications → Create
   - Associer le Provider créé

3. **Configurer Traefik** (si nécessaire) :
   - Ajouter les règles de réécriture si l'app utilise le format Keycloak

---

## 6. Flux d'Authentification

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Supabase │     │ Traefik  │     │Authentik │     │ Supabase │
│ (React)  │     │  Auth    │     │ (Proxy)  │     │  (IdP)   │     │  Auth    │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ 1. Login       │                │                │                │
     │───────────────▶│                │                │                │
     │                │                │                │                │
     │ 2. Redirect    │                │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
     │ 3. Auth Request│                │                │                │
     │────────────────────────────────▶│                │                │
     │                │                │                │                │
     │                │                │ 4. Rewrite URL │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │ 5. Login Page  │                │                │                │
     │◀────────────────────────────────────────────────│                │
     │                │                │                │                │
     │ 6. Credentials │                │                │                │
     │────────────────────────────────────────────────▶│                │
     │                │                │                │                │
     │ 7. Auth Code   │                │                │                │
     │◀────────────────────────────────────────────────│                │
     │                │                │                │                │
     │ 8. Callback    │                │                │                │
     │───────────────▶│                │                │                │
     │                │                │                │                │
     │                │ 9. Exchange Code (via Traefik) │                │
     │                │───────────────▶│───────────────▶│                │
     │                │                │                │                │
     │                │ 10. Access Token               │                │
     │                │◀───────────────│◀───────────────│                │
     │                │                │                │                │
     │ 11. Session    │                │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
```

---

## 7. Dépannage

### Erreur DNS

```bash
# Vérifier la résolution
nslookup authentik.horus.local 192.168.1.210

# Dans un container Docker
docker exec <container> nslookup authentik.horus.local
```

**Solution** : Ajouter `dns: - 192.168.1.210` dans docker-compose.yml

### Erreur Certificat SSL

```
tls: failed to verify certificate: x509: certificate signed by unknown authority
```

**Solutions** :
1. Vérifier que le certificat est monté dans le container
2. Vérifier que `SSL_CERT_FILE` pointe vers le bon fichier
3. Vérifier que le fichier n'est pas un répertoire

```bash
docker exec supabase-auth ls -la /etc/ssl/certs/horus.crt
docker exec supabase-auth cat /etc/ssl/certs/horus.crt | head -5
```

### Erreur 404 sur Traefik

**Causes possibles** :
1. Router non chargé (vérifier la syntaxe YAML)
2. Priorité incorrecte
3. Host ne matche pas

```bash
# Vérifier les routers
curl -s http://192.168.1.95:8080/api/http/routers | jq '.[].name'
```

### Erreur "Unable to exchange external code"

**Causes possibles** :
1. DNS non résolu (voir erreur DNS)
2. Certificat invalide (voir erreur SSL)
3. Secret client incorrect
4. Redirect URI non autorisé dans Authentik

### Logs utiles

```bash
# Traefik
journalctl -u traefik -f

# Supabase Auth
docker logs supabase-auth -f

# Authentik
docker logs authentik-server-1 -f
docker logs authentik-worker-1 -f

# dnsmasq
journalctl -u dnsmasq -f
```

---

## 8. Maintenance

### Renouveler le certificat

```bash
# Sur Traefik (192.168.1.95)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/traefik/certs/horus.key \
  -out /etc/traefik/certs/horus.crt \
  -subj "/CN=horus.local" \
  -addext "subjectAltName=DNS:*.horus.local,DNS:horus.local"

systemctl restart traefik

# Copier sur Supabase
scp /etc/traefik/certs/horus.crt root@192.168.1.86:/srv/supabase-project/

# Redémarrer Supabase
ssh root@192.168.1.86 "cd /srv/supabase-project && docker-compose restart auth"
```

### Sauvegardes

| Service | À sauvegarder |
|---------|---------------|
| dnsmasq | `/etc/dnsmasq.conf` |
| Traefik | `/etc/traefik/` |
| Supabase | `/srv/supabase-project/` (docker-compose, .env, volumes) |
| Authentik | `/srv/authentik/` + base de données |

---

## 9. Sécurité

### Recommandations

1. **Certificats** : Utiliser Let's Encrypt en production avec un vrai domaine
2. **Secrets** : Ne pas committer les secrets dans Git
3. **Firewall** : Limiter l'accès aux ports sensibles (8080 Traefik dashboard)
4. **DNS** : Limiter l'accès au serveur DNS au réseau local

### Ports à protéger

| Port | Service | Accès recommandé |
|------|---------|------------------|
| 53 | dnsmasq | LAN uniquement |
| 8080 | Traefik Dashboard | Admin uniquement |
| 9999 | GoTrue (interne) | Docker network uniquement |

---

## 10. Contacts et Ressources

### Documentation officielle

- [Traefik](https://doc.traefik.io/traefik/)
- [Authentik](https://goauthentik.io/docs/)
- [Supabase](https://supabase.com/docs)
- [dnsmasq](https://thekelleys.org.uk/dnsmasq/doc.html)

### Fichiers de configuration

| Service | Chemin |
|---------|--------|
| dnsmasq | `192.168.1.210:/etc/dnsmasq.conf` |
| Traefik | `192.168.1.95:/etc/traefik/` |
| Supabase | `192.168.1.86:/srv/supabase-project/` |
| Authentik | `192.168.1.187:/srv/authentik/` |
