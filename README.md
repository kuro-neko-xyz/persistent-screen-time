# Requirements

- node
- postgres

# Installation

On a psql shell run:

```
CREATE ROLE screentime WITH LOGIN PASSWORD '<your password>';
CREATE DATABASE screentime;
ALTER DATABASE screentime OWNER TO screentime;
```

**On a fresh PostgreSQL installation you may need to modify the `pg_hba.conf` to change the method of authentication from `peer` to `scram-sha-256` if you do not want to create an `screentime` user in your system.**

To populate airports database:
```
npm install
npm run populate
```
