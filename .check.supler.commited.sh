#!/bin/bash
if [[ `git status --porcelain supler.js` != "" ]] || [[ `git status --porcelain supler.min.js` != "" ]]
then
    exit 100
else
    exit 0
fi