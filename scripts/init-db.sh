#!/bin/bash

set -eo pipefail

dir=$(dirname $0)

sqlpassword="'"$(cat $dir/password)"'"
echo $sqlpassword

sudo -u postgres psql << EOSQL
CREATE USER artcoin;
ALTER USER artcoin WITH ENCRYPTED PASSWORD $sqlpassword;
ALTER USER artcoin WITH SUPERUSER;
CREATE DATABASE artcoin_prod;
CREATE DATABASE artcoin_dev;
CREATE DATABASE artcoin_test;

CREATE USER artcoin_dev;
ALTER USER artcoin_dev WITH ENCRYPTED PASSWORD 'artcoin_dev';
GRANT ALL PRIVILEGES ON DATABASE artcoin_dev TO artcoin_dev;
EOSQL
