
# Install MongoDB

## Before you start 
**Prepare persistent storage on the external SSD** For maximum speed and long term reliability it is best to use an external SSD storage device. Find where the SSD is mounted:

```bash
lsblk
df -h
```

Create a directory for MongoDB's data files there (substitute the actual mount point — the rest of this guide assumes `/mnt/ssd` - you use the location that you have selected):

```bash
sudo mkdir -p /mnt/ssd/mongodb-data
sudo chown $USER:$USER /mnt/ssd/mongodb-data
```

### 1. Define the MongoDB service

Docker creates an environment in which a program can run. The envinroment is configured using a **yml** file. We are going to create a file to tell docker how to run the MongoDB program.

```bash
mkdir -p ~/mongodb
nano ~/mongodb/docker-compose.yml
```
Add these lines to the file that you are editing:

```yaml
services:
  mongodb:
    image: mongo:7.0
    container_name: custard-cream-mongo
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: ccsAdmin
      MONGO_INITDB_ROOT_PASSWORD: <choose-a-strong-password>
    volumes:
      - /mnt/ssd/mongodb-data:/data/db
    ulimits:
      nofile:
        soft: 64000
        hard: 64000
```

Things worth noting:

- I called the container **custard-cream-mongo** You can call yours what you like, but you'll need to change other references to it in this document. 

- `127.0.0.1:27017:27017` binds the port to the Pi's loopback interface only — nothing elsewhere on your home network can connect, only processes on this Pi (which is all that needs to). Change this if you later want another machine on the LAN to reach it directly. 
- Pick a real password for `MONGO_INITDB_ROOT_PASSWORD` and keep it somewhere safe (e.g. a password manager) — you'll need it again below.
- `ulimits` raises the container's open-file limit to the level MongoDB recommends. Docker's default is lower, which MongoDB complains about at startup (see "Startup warnings" below). A small database won't actually hit the default limit, but raising it costs nothing and silences the warning. If you add this to an already-running setup, run `docker compose up -d` again to recreate the container — the data lives on the SSD, so nothing is lost.

### 2. Start it and confirm it's healthy

```bash
cd ~/mongodb
docker compose up -d
docker compose logs -f mongodb
```

Watch for `Waiting for connections` in the log with no errors above it, then `Ctrl+C` to stop following (the container keeps running). If instead you see the container repeatedly restarting with an `Illegal instruction` message, that's the ARMv8.2-A issue from "Before you start" above — this Pi's CPU can't run this MongoDB build.

Confirm you can connect:

```bash
docker exec -it custard-cream-mongo mongosh --username ccsAdmin
```

Enter the password when prompted; a `test>` prompt means it's working. Type `exit` to leave.

#### Startup warnings

Before the prompt, `mongosh` prints a telemetry notice and a block headed "The server generated these startup warnings when booting". These are warnings, not errors — if you reach the `test>` prompt, the server is working. On a Pi you're likely to see:

- **Telemetry notice** — `mongosh` sends anonymous usage data to MongoDB. Run `disableTelemetry()` once at the prompt to turn it off.
- **"Using the XFS filesystem is strongly recommended with the WiredTiger storage engine"** — the SSD is almost certainly formatted as ext4. XFS performs a little better under heavy write load, but at this server's scale it makes no practical difference. Safe to ignore; reformatting the SSD isn't worth it.
- **"Soft rlimits for open file descriptors too low"** — Docker's default open-file limit is below what MongoDB wants. The `ulimits` section in the compose file in step 1 fixes this; if you still see it, the container was created before that section was added — run `docker compose up -d` to recreate it.
- **"Failed to read file"** — the useful detail is in the full log entry, which `mongosh` truncates. See it with:

  ```bash
  docker compose logs mongodb | grep -i "failed to read"
  ```

  If the file it names is under `/sys/kernel/mm/` or `/proc/sys/vm/`, MongoDB is checking a kernel memory setting (such as transparent huge pages) that the Raspberry Pi kernel doesn't expose — harmless, ignore it. If it names anything under `/data/db`, that's the data directory on the SSD and is worth investigating: check the directory exists and is owned by the right user (see "Before you start").

### 3. Create a database user for the app

MongoDB has its own user accounts, separate from anything in the app. Each program that connects to the database has to log in as one of them, and what it's allowed to do depends on which account it uses. This step creates the account that your server programs will log in as.

At this point MongoDB has exactly one account:

- **`ccsAdmin`** — the root (administrator) account. You didn't create it by hand: the official `mongo` image created it automatically the first time the container started, from the `MONGO_INITDB_ROOT_USERNAME` and `MONGO_INITDB_ROOT_PASSWORD` values in `docker-compose.yml` (step 1). It's stored in MongoDB's built-in `admin` database and can do anything to every database on the server, including creating and deleting users. That makes it the right account for setting things up and for maintenance, but the wrong one for the app to use every day — if the server's database address and password were ever exposed, or a bug in the app ran the wrong query, root access would put every database on this MongoDB at risk.

This step uses `ccsAdmin` to create one more account in MongoDB:

- **`custardCreamApp`** — the account your server programs use, and the only one whose username and password go in the database address they connect to (step 5). It's given the `readWrite` role on the `custardcream` database only: it can read, add, change and delete documents there, but it can't touch any other database, manage users, or change server settings. That's everything the app needs and no more.

After this step there are two MongoDB accounts: `ccsAdmin` for you, when administering the database, and `custardCreamApp` for your programs.

These accounts belong to MongoDB, not to the Pi. MongoDB stores them inside its own data, in a system collection in the `admin` database, which on this setup means inside the data files on the SSD. They have nothing to do with the Pi's Linux accounts: `ccsAdmin` can't log in to the Pi, and your Pi login can't connect to MongoDB. Because they're part of the data, whether they come along when the database moves somewhere else depends on how it's moved:

- **Copying the data directory** (`/mnt/ssd/mongodb-data`) to another machine running the same MongoDB version — the accounts and their passwords come with it unchanged.
- **`mongodump`/`mongorestore` of a single database** (with `--db`) — the accounts are left behind unless you add `--dumpDbUsersAndRoles` to the dump and `--restoreDbUsersAndRoles` to the restore. A dump without `--db` includes the `admin` database, and the accounts with it.

Don't confuse these with the logins people use on a website. Those are just documents stored in one of the website's own collections; MongoDB knows nothing about them, and they can't be used to connect to MongoDB. We'll build website logins later in this series.

Log in as `ccsAdmin` (enter the root password from step 1 when prompted):

```bash
docker exec -it custard-cream-mongo mongosh --username ccsAdmin
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

(`custardcream` here is just this database's name — anything works, it's created automatically on first use. If you choose a different name, use it everywhere `custardcream` appears below.)

Because the `use custardcream` line came before `createUser`, the user is stored in the `custardcream` database rather than `admin`. That's the database MongoDB checks its password against, so every login as this user has to name `custardcream` as its authentication database — the check in step 4 and the database address in step 5 both do.

### 4. Check the app user can use the database

Before pointing the server at it, confirm from the console that the new user can log in and read and write `custardcream`, logging in the same way the server will:

```bash
docker exec -it custard-cream-mongo mongosh --username custardCreamApp --authenticationDatabase custardcream custardcream
```

Enter the app user's password (the one from step 3, not the root password). The prompt should read `custardcream>`. Then run:

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

If login fails with `Authentication failed`, check the password, and check that `--authenticationDatabase` names the database you were `use`-ing when you ran `createUser` in step 3. If login works but `insertOne` fails with `not authorized`, the user's `roles` don't name this database — log in as `ccsAdmin` and fix it with `db.getSiblingDB("custardcream").grantRolesToUser("custardCreamApp", [{ role: "readWrite", db: "custardcream" }])`.

### 5. Remember the database address

You now have a url that a program can use to connect to the database: 

```
DATABASE_URL=mongodb://custardCreamApp:<password>@localhost:27017/custardcream
```

No `authSource` is needed: MongoDB uses the database named in the path (`custardcream`) as the authentication database by default, which is where step 3 created the user. Adding `?authSource=admin` here would make the login fail.

Now that the database is running, you can find out how a JavaScript program can [use Mongoose to store information in it](/doc/05%20Use%20Mongoose.md).

