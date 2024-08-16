import glob
import os
import subprocess
import pandas as pd

TASK_SPOOLER_CMD = "ts"



def parse_tasklist_to_json(data):
    lines = data.strip().split('\n')
    assert lines[0].strip().startswith("ID")
    lines = lines[1:]

    parsed_data = []
    for line in lines:
        # Split the line into fields by multiple spaces
        parts = line.split()

        # Extract fields based on known positions
        job_id = parts[0]
        state = parts[1]
        if state == "finished":
            output_idx = 2
            error_idx = 3
            time_idx = 4
            command_idx = 5
        elif state == "running":
            output_idx = 2
            error_idx = None
            time_idx = None
            command_idx = 3
        elif state == "queued":
            output_idx = None
            error_idx = None
            time_idx = None
            command_idx = 3
        else:
            raise NotImplementedError(state)
        output = parts[output_idx] if output_idx is not None else None
        e_level = parts[error_idx] if error_idx is not None else None
        times = parts[time_idx] if time_idx is not None else None
        command = " ".join(parts[command_idx:])

        # Append to the list of parsed data
        parsed_data.append({
            "ID": job_id,
            "State": state,
            "Output": output,
            "E-Level": e_level,
            "Times": times,
            "Command": command
        })

    return parsed_data


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
    df = df.set_index("ID", drop=False).sort_index()
    df["Time_ms"] = df["Times"].str.split("/").str[0].astype(float).fillna("-")
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
