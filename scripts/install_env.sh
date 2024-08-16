#!/bin/bash
envdir="$(dirname $0)/../.env"
python3 -m venv $envdir
source $(dirname $0)/activate.sh
pip install -e .
