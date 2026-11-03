# Install Docker

## Before you start

**Check the Pi can actually run modern MongoDB.** MongoDB 5.0 and later require ARM CPUs with the ARMv8.2-A instruction set. A Raspberry Pi 4 (Cortex-A72, ARMv8.0-A) does **not** have this and will crash the `mongod` process with an "Illegal instruction" error the moment it starts — this is a widely reported issue, not a misconfiguration. A Raspberry Pi 5 (Cortex-A76) does support it and is what this guide assumes. Check your model:

```bash
cat /proc/device-tree/model
uname -m   # should print aarch64 (64-bit) - if it prints armv7l, the OS itself is 32-bit and needs reinstalling as 64-bit first
```

If this is a Pi 4 or older, either move this role to a Pi 5 (or any other 64-bit ARMv8.2+ / x86_64 machine on your network), or stop here and keep using Atlas — there isn't a good workaround short of an end-of-life, unpatched MongoDB 4.4.

## 1. Install Docker Engine

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

Log out and back in (or `newgrp docker`) so your shell picks up the new group membership, then confirm it works without `sudo`:

```bash
docker --version
docker compose version
docker run hello-world
```
The first two commands get the versions of docker and compose. The third command will download and run a sample docker program that says hello. Now that you have docker ruinning, you can move on to install MongoDB

