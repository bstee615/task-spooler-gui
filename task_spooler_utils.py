import glob
import json
import os
import subprocess
import pandas as pd

TASK_SPOOLER_CMD = "ts"


def list(socket_name):
    env = get_env(socket_name)
    output = subprocess.check_output(
        f"{TASK_SPOOLER_CMD} -l -M json", env=env, shell=True, encoding="utf-8"
    )
    data = json.loads(output)
    df = pd.DataFrame(data=data)
    df = df.set_index("ID", drop=False).sort_index()
    return df


def remove(job_id, socket_name):
    assert isinstance(job_id, int) or (
        isinstance(job_id, str) and job_id.isdigit()
    ), job_id
    env = get_env(socket_name)
    proc = subprocess.run(
        f"{TASK_SPOOLER_CMD} -r {job_id}",
        env=env,
        shell=True,
        encoding="utf-8",
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
    )
    return proc


def kill(job_id, socket_name):
    assert isinstance(job_id, int) or (
        isinstance(job_id, str) and job_id.isdigit()
    ), job_id
    env = get_env(socket_name)
    proc = subprocess.run(
        f"{TASK_SPOOLER_CMD} -k {job_id}",
        env=env,
        shell=True,
        encoding="utf-8",
        stderr=subprocess.STDOUT,
        stdout=subprocess.PIPE,
    )
    return proc


def get_socket_names():
    sockets = glob.glob("/tmp/socket.*")
    socket_names = [os.path.basename(s)[len("socket.") :] for s in sockets]
    return socket_names


def get_env(socket_name):
    env = {}
    if socket_name is not None:
        env["TS_SOCKET"] = f"/tmp/socket.{socket_name}"
    return env
