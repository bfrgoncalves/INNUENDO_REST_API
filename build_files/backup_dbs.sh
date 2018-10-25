#!/bin/bash

: '
This script allows backup and restore a postgresql database by providing a mode,
databseName, database username, and database password.
'

# Prints to the console the required arguments
echo "mode: ${1}"
echo "database: ${2}"
echo "postgres username: ${3}"
echo "postgres pass: ${4}"

if [ "${1}" == "build" ]
then
    echo "backup file path: ${5}"
    PGPASSWORD="${4}" psql -U ${3} ${2} < ${5}
fi

if [ "${1}" == "backup" ]
then
    echo "destination file path: ${5}"
    PGPASSWORD="${4}" pg_dump -U ${3} ${2} > ${5}
fi

