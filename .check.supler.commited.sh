#!/bin/bash
if [[ `git status --porcelain supler.js` != "" ]] || [[ `git status --porcelain supler.min.js` != "" ]]
then
    return -100
else
    return 0
fi