import task_spooler_gui.task_spooler_utils as ts_utils


def test_parse():
    data = """
ID   State      Output               E-Level  Times(r/u/s)   Command [run=1/1]
232  running    /tmp/ts-out.EHsEBV                           [buggy-vuln]python main.py --model llama2 --dataset sven_individual --individual --mode basic --template none --result_root ../results_test_parsing_requery5 --use_exact_parsing --use_ollama --requery_attempts 5 --seed 2
239  queued     (file)                                       [missing_fullrun]bash runner_no_shard.sh contrastive_onemessage embedding2 magicoder sven_individual 0 --individual --use_ollama --shot 6 --embeddings codebert --result_root ../results_missing_fullrun
231  finished   /tmp/ts-out.ixkd7e   0        7588.72/38.78/7.23 python main.py --model llama2 --dataset sven_individual --individual --mode basic --template none --result_root ../results_test_parsing_requery5 --use_exact_parsing --use_ollama --requery_attempts 5 --seed 1
""".strip()
    actual = ts_utils.parse_tasklist_to_json(data)
    expected = [
        {
            "ID": 232,
            "State": "running",
            "Output": "/tmp/ts-out.EHsEBV",
            "E-Level": "",
            "Times": None,
            "Label": "buggy-vuln",
            "Command": "python main.py --model llama2 --dataset sven_individual --individual --mode basic --template none --result_root ../results_test_parsing_requery5 --use_exact_parsing --use_ollama --requery_attempts 5 --seed 2",
        },
        {
            "ID": 239,
            "State": "queued",
            "Output": "(file)",
            "E-Level": "",
            "Times": None,
            "Label": "missing_fullrun",
            "Command": "bash runner_no_shard.sh contrastive_onemessage embedding2 magicoder sven_individual 0 --individual --use_ollama --shot 6 --embeddings codebert --result_root ../results_missing_fullrun",
        },
        {
            "ID": 231,
            "State": "finished",
            "Output": "/tmp/ts-out.ixkd7e",
            "E-Level": "0",
            "Times": "7588.72/38.78/7.23",
            "Label": None,
            "Command": "python main.py --model llama2 --dataset sven_individual --individual --mode basic --template none --result_root ../results_test_parsing_requery5 --use_exact_parsing --use_ollama --requery_attempts 5 --seed 1",
        },
    ]
    assert actual == expected
