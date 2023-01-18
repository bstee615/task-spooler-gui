import task_spooler_utils as ts_utils


def test_list():
    print()
    print(ts_utils.list("devign"))
    print(ts_utils.list("devign").to_json(orient="values"))


def test_sockets():
    print()
    print(ts_utils.get_socket_names())


def test_remove():
    print()
    df = ts_utils.list(None)
    print(df)
    proc = ts_utils.remove(int(df.iloc[-1].name), None)
    print(proc.returncode, proc.stdout)


def test_remove_error():
    print()
    print(ts_utils.remove(0, None))
