# Install Local MongoDB

This howto installs a MongoDB database server on your Raspberry Pi. MongoDB runs inside **Docker**, a program that makes an environment in which other programs can run. Docker downloads MongoDB already set up, and keeps it separate from everything else on the Pi.

You only need to follow this howto if you want the database to run on your Pi. If you have an older Pi, or you'd rather not run the database yourself, you can [connect to MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md) instead. The example programs work in exactly the same way with either database.

## Before you start

**Check the Pi can actually run modern MongoDB.** MongoDB 5.0 and later require ARM CPUs with the ARMv8.2-A instruction set. A Raspberry Pi 4 (Cortex-A72, ARMv8.0-A) does **not** have this and will crash the `mongod` process with an "Illegal instruction" error the moment it starts — this is a widely reported issue, not a misconfiguration. A Raspberry Pi 5 (Cortex-A76) does support it and is what this guide assumes. Check your model:

```bash
cat /proc/device-tree/model
uname -m   # should print aarch64 (64-bit) - if it prints armv7l, the OS itself is 32-bit and needs reinstalling as 64-bit first
```

If this is a Pi 4 or older, use [MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md) instead, or run the database on a Pi 5 (or any other 64-bit ARMv8.2+ / x86_64 machine on your network). There isn't a good workaround short of an end-of-life, unpatched MongoDB 4.4.

**Prepare persistent storage on the external SSD.** For maximum speed and long term reliability it is best to use an external SSD storage device. Find where the SSD is mounted:

```bash
lsblk
df -h
```

Create a directory for MongoDB's data files there (substitute the actual mount point — the rest of this guide assumes `/mnt/ssd` - you use the location that you have selected):

```bash
sudo mkdir -p /mnt/ssd/mongodb-data
sudo chown $USER:$USER /mnt/ssd/mongodb-data
```

### 1. Install Docker Engine

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

The first two commands get the versions of docker and compose. The third command will download and run a sample docker program that says hello.

### 2. Start Docker when the Pi starts

Docker runs as a service, a program that the Pi starts for you. The install script sets it to start each time the Pi starts up, but it is worth making sure:

```bash
sudo systemctl enable docker
systemctl is-enabled docker
```

The first command tells the Pi to start Docker at boot (if it was already set, nothing changes). The second one should print `enabled`. When Docker starts, it restarts any containers that are set to restart, which is how the database will start by itself.

### 3. Define the MongoDB service

Docker creates an environment in which a program can run. The environment is configured using a **yml** file. We are going to create a file to tell docker how to run the MongoDB program.

```bash
mkdir -p ~/mongodb
nano ~/mongodb/docker-compose.yml
```
Add these lines to the file that you are editing:

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: mongoAdmin
      MONGO_INITDB_ROOT_PASSWORD: <choose-a-strong-password>
    volumes:
      - /mnt/ssd/mongodb-data:/data/db
    ulimits:
      nofile:
        soft: 64000
        hard: 64000
```

Things worth noting:

- The container is called **mongodb**, and the administrator account is called **mongoAdmin**. The names are general because one MongoDB server can hold lots of databases for different projects. You can call yours what you like, but you'll need to change the other references to them in these howtos.

- `127.0.0.1:27017:27017` binds the port to the Pi's loopback interface only — nothing elsewhere on your home network can connect, only processes on this Pi (which is all that needs to). Change this if you later want another machine on the LAN to reach it directly. 
- Pick a real password for `MONGO_INITDB_ROOT_PASSWORD` and keep it somewhere safe (e.g. a password manager) — you'll need it again below.
- `ulimits` raises the container's open-file limit to the level MongoDB recommends. Docker's default is lower, which MongoDB complains about at startup (see "Startup warnings" below). A small database won't actually hit the default limit, but raising it costs nothing and silences the warning. If you add this to an already-running setup, run `docker compose up -d` again to recreate the container — the data lives on the SSD, so nothing is lost.

### 4. Start it and confirm it's healthy

```bash
cd ~/mongodb
docker compose up -d
docker compose logs -f mongodb
```

Watch for `Waiting for connections` in the log with no errors above it, then `Ctrl+C` to stop following (the container keeps running). If instead you see the container repeatedly restarting with an `Illegal instruction` message, that's the ARMv8.2-A issue from "Before you start" above — this Pi's CPU can't run this MongoDB build, so use [MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md) instead.

Confirm you can connect:

```bash
docker exec -it mongodb mongosh --username mongoAdmin
```
This command asks Docker to run a program called `mongosh`, the MongoDB Shell, inside the **mongodb** container. The shell lets you type commands to the database server, which is already running in the container. Enter the password when prompted; a `test>` prompt means it's working. Type `exit` to leave.

You don't need to start MongoDB again each time you use it. The `restart: unless-stopped` setting in the compose file tells Docker to restart the container whenever the Pi starts up (Docker itself starts at boot, as set up in step 2). The only time it won't be running is if you stop it yourself, with `docker compose down` or `docker stop`. You can check that it is running with:

```bash
docker ps
```

If **mongodb** isn't in the list, go into the **~/mongodb** folder and start it with `docker compose up -d`.

#### Startup warnings

Before the prompt, `mongosh` prints a telemetry notice and a block headed "The server generated these startup warnings when booting". These are warnings, not errors — if you reach the `test>` prompt, the server is working. On a Pi you're likely to see:

- **Telemetry notice** — `mongosh` sends anonymous usage data to MongoDB. Run `disableTelemetry()` once at the prompt to turn it off.
- **"Using the XFS filesystem is strongly recommended with the WiredTiger storage engine"** — the SSD is almost certainly formatted as ext4. XFS performs a little better under heavy write load, but at this server's scale it makes no practical difference. Safe to ignore; reformatting the SSD isn't worth it.
- **"Soft rlimits for open file descriptors too low"** — Docker's default open-file limit is below what MongoDB wants. The `ulimits` section in the compose file in step 3 fixes this; if you still see it, the container was created before that section was added — run `docker compose up -d` to recreate it.
- **"Failed to read file"** — the useful detail is in the full log entry, which `mongosh` truncates. See it with:

  ```bash
  docker compose logs mongodb | grep -i "failed to read"
  ```

  If the file it names is under `/sys/kernel/mm/` or `/proc/sys/vm/`, MongoDB is checking a kernel memory setting (such as transparent huge pages) that the Raspberry Pi kernel doesn't expose — harmless, ignore it. If it names anything under `/data/db`, that's the data directory on the SSD and is worth investigating: check the directory exists and is owned by the right user (see "Before you start").

### 5. Create a database user for the app

MongoDB has its own user accounts, separate from anything in the app. Each program that connects to the database has to log in as one of them, and what it's allowed to do depends on which account it uses. This step creates the account that the example programs will log in as.

At this point MongoDB has exactly one account:

- **`mongoAdmin`** — the root (administrator) account. You didn't create it by hand: the official `mongo` image created it automatically the first time the container started, from the `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` values in `docker-compose.yml` (step 3). It's stored in MongoDB's built-in `admin` database and can do anything to every database on the server, including creating and deleting users. That makes it the right account for setting things up and for maintenance, but the wrong one for a program to use every day — if a program's connection string were ever exposed, or a bug in a program ran the wrong query, root access would put every database on this MongoDB at risk.

#### A database for this project

Everything so far has set up the MongoDB server itself. Nothing in it belongs to a particular project, and the same server can hold databases for lots of different projects. Now we are going to create a database for one project, the example programs in this series, along with an account that only those programs use. If you had other projects that needed a database, you would do this again for each one, giving each project its own database and its own account (see [Databases for other apps](#databases-for-other-apps) below).

The examples follow on from the Custard Cream Server, so the database is called `custardcream` and the account is called `custardCreamApp`. All the examples share this database, and each one keeps its documents in its own collection.

This step uses `mongoAdmin` to create one more account in MongoDB:

- **`custardCreamApp`** — the account the example programs use, and the only one whose username and password go in the connection string they connect with (step 7). It's given the `readWrite` role on the `custardcream` database only: it can read, add, change and delete documents there, but it can't touch any other database, manage users, or change server settings. That's everything the programs need and no more.

After this step there are two MongoDB accounts: `mongoAdmin` for you, when administering the database, and `custardCreamApp` for your programs.

These accounts belong to MongoDB, not to the Pi. MongoDB stores them inside its own data, in a system collection in the `admin` database, which on this setup means inside the data files on the SSD. They have nothing to do with the Pi's Linux accounts: `mongoAdmin` can't log in to the Pi, and your Pi login can't connect to MongoDB. Because they're part of the data, whether they come along when the database moves somewhere else depends on how it's moved:

- **Copying the data directory** (`/mnt/ssd/mongodb-data`) to another machine running the same MongoDB version — the accounts and their passwords come with it unchanged.
- **`mongodump`/`mongorestore` of a single database** (with `--db`) — the accounts are left behind unless you add `--dumpDbUsersAndRoles` to the dump and `--restoreDbUsersAndRoles` to the restore. A dump without `--db` includes the `admin` database, and the accounts with it.

Don't confuse these with the logins people use on a website. Those are just documents stored in one of the website's own collections; MongoDB knows nothing about them, and they can't be used to connect to MongoDB. We'll build website logins later in this series.

Log in as `mongoAdmin` (enter the root password from step 3 when prompted):

```bash
docker exec -it mongodb mongosh --username mongoAdmin
```

Then switch to the `custardcream` database and create the app account in it, choosing a new password (not the root one):

```javascript
use custardcream
db.createUser({
  user: "custardCreamApp",
  pwd: "<choose-a-different-strong-password>",
  roles: [{ role: "readWrite", db: "custardcream" }]
})
exit
```

You don't need to create the `custardcream` database first. MongoDB creates it the first time something is stored in it. If you'd like to use different names for the database or the account, use your names everywhere `custardcream` and `custardCreamApp` appear in these howtos, including the connection string.

Because the `use custardcream` line came before `createUser`, the account belongs to the `custardcream` database rather than `admin`. MongoDB keeps the details of every account in the `admin` database, but it records which database each account belongs to, and checks the password against that database. This is called the account's **authentication database**. So every login as `custardCreamApp` has to say that its authentication database is `custardcream`. The check in step 6 does this with `--authenticationDatabase custardcream`, and the connection string in step 7 does it by ending with `/custardcream`.

#### Databases for other apps

The MongoDB server isn't tied to this project. If you write a different app later, you can give it a database of its own on the same server, without installing anything new. Log in as `mongoAdmin` and repeat this step with a new database name and a new account. For example, for an app that records the weather:

```javascript
use weatherlog
db.createUser({
  user: "weatherLogApp",
  pwd: "<choose-another-strong-password>",
  roles: [{ role: "readWrite", db: "weatherlog" }]
})
exit
```

The new app connects with its own address, `mongodb://weatherLogApp:<password>@localhost:27017/weatherlog`. Each account can only use its own database, so a bug in one app can't damage the data of another. You can see all the databases on the server by logging in as `mongoAdmin` and entering `show dbs`. A new database doesn't appear in the list until something has been stored in it.

### 6. Check the app user can use the database

Before any program uses the new account, check that it can log in and read and write the `custardcream` database:

```bash
docker exec -it mongodb mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

Enter the app user's password (the one from step 5, not the root password). The prompt should read `custardcream>`. Then run:

```javascript
db.runCommand({ connectionStatus: 1 }).authInfo
db.connectionCheck.insertOne({ checkedAt: new Date() })
db.connectionCheck.find()
db.connectionCheck.drop()
show collections
exit
```

What to expect:

- `authInfo` lists `custardCreamApp` under `authenticatedUsers`, with `readWrite` on `custardcream` under `authenticatedUserRoles`.
- `insertOne` returns `acknowledged: true`, `find` shows the document you just inserted, and `drop` returns `true` — so the user can write, read and delete.
- `show collections` prints nothing on a fresh install (the test collection has just been dropped). Once you've worked through the next howto, it lists `addresses`.

If login fails with `Authentication failed`, check the password, and check that `--authenticationDatabase` names the database you were `use`-ing when you ran `createUser` in step 5. If login works but `insertOne` fails with `not authorized`, the user's `roles` don't name this database — log in as `mongoAdmin` and fix it with `db.getSiblingDB("custardcream").grantRolesToUser("custardCreamApp", [{ role: "readWrite", db: "custardcream" }])`.

### 7. Make the connection string

A program finds the database by using an address, which MongoDB calls a **connection string**. This is the connection string for your database, with the password of the `custardCreamApp` user in place of `<password>`:

```
mongodb://custardCreamApp:<password>@localhost:27017/custardcream
```

No `authSource` is needed: MongoDB uses the database named in the path (`custardcream`) as the authentication database by default, which is where step 5 created the user. Adding `?authSource=admin` here would make the login fail.

If your password contains any of the characters `@ : / ? # [ ] %` you'll need to replace them with codes in the address. For example, `@` becomes `%40`. Or you could choose a password that doesn't use them.

As far as the programs are concerned, this address *is* the database. If you used [MongoDB Atlas](/doc/03%20Connect%20to%20MongoDB%20Atlas.md) instead, the address would point somewhere else, but the programs would work in exactly the same way.

You now have a database, and a connection string that a program can use to reach it. Keep a copy of the connection string somewhere safe, because it contains your password. In the next howto you'll store it on your Pi, check that it works, and find out how a JavaScript program can [use Mongoose to store information in the database](/doc/05%20Use%20Mongoose.md).

