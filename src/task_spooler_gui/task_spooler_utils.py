import glob
import os
import subprocess
import pandas as pd
from .config import TASK_SPOOLER_CMD



def parse_tasklist_to_json(input_str):
    lines = input_str.strip().splitlines()

    # Extract headers and data
    header = lines[0]
    data = lines[1:]

    # Identify column offsets by the position of each header
    columns = [
        "ID", "State", "Output", "E-Level", "Times",
    ]

    offsets = [header.find(col) for col in columns]

    # Create dictionary for the parsed data
    all_parsed_data = []
    for line in data:
        parsed_data = {}
        for i, col in enumerate(columns):
            if i == len(columns)-1:
                value = line[offsets[i]:].rstrip()
            else:
                value = line[offsets[i]:offsets[i+1]].rstrip()
            parsed_data[col] = value
        parsed_data["ID"] = int(parsed_data["ID"])
        all_parsed_data.append(parsed_data)

    for d in all_parsed_data:
        if d["Times"].startswith(" "):
            d["Command"] = d["Times"].strip()
            d["Times"] = None
        else:
            time, _, command = d["Times"].partition(" ")
            d["Times"] = time
            d["Command"] = command

    # Convert to JSON
    return all_parsed_data


def list_jobs(socket_name=None):
    """
    List task-spooler jobs.
    """
    env = get_env(socket_name)
    output = subprocess.check_output(
        f"{TASK_SPOOLER_CMD} -l", env=env, shell=True, encoding="utf-8"
    )
    data = parse_tasklist_to_json(output)
    df = pd.DataFrame(data=data)
    df["Time_ms"] = df["Times"].str.split("/").str[0].astype(float).fillna("-")
    df["StateOrder"] = df["State"].apply(lambda x: [
        "running",
        "queued",
        "finished",
    ].index(x))
    df["IDOrder"] = df["ID"].apply(lambda x: int(x))
    df = df.sort_values(by=["StateOrder", "IDOrder"])
    df = df.set_index("ID", drop=False)
    return df


def remove(job_id, socket_name):
    """
    Remove a task-spooler job.
    """
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
    """
    Kill a running task-spooler job.
    """
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
    """
    Get the names of all sockets in the /tmp directory.
    """
    sockets = glob.glob("/tmp/socket.*")
    socket_names = [os.path.basename(s)[len("socket.") :] for s in sockets]
    return socket_names


def get_env(socket_name):
    """
    Get environment variables for running task-spooler.
    """
    env = {}
    if socket_name is not None:
        env["TS_SOCKET"] = f"/tmp/socket.{socket_name}"
    return env
