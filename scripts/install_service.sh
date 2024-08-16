#!/bin/bash
systemctl --user stop task-spooler-gui.service
mkdir -p $HOME/.config/systemd/user/
sed -e "s@__CWD__@$PWD@g" $(dirname $0)/task-spooler-gui.service > $HOME/.config/systemd/user/task-spooler-gui.service
systemctl --user daemon-reload
systemctl --user enable --now task-spooler-gui.service
systemctl --user status task-spooler-gui.service | cat
