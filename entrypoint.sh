#!/bin/bash
envFiles=$(env | grep -E "_FILE=.+$")

for envFile in $envFiles
do
    envName=$(echo $envFile | perl -ne 's/_FILE=.+$//g ; print;')
    envFile=$(echo $envFile | perl -ne 's/^.+=//g ; print;')
    envValue=$(cat $envFile)
    export $envName="$envValue"
done;

exec "$@"