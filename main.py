import ast
import json
import os
import sys
from distutils.dir_util import copy_tree

import matplotlib.pyplot as plt
import networkx as nx

import ast_extractor
import model

def remove_then_create_new_dir(dir_to_create):
    if os.path.exists(dir_to_create):
        # remove the directory
        if dir_to_create.find("*") != -1:
            return
        os.system("rm -rf " + dir_to_create)
    os.makedirs(dir_to_create)


def run_testcases(testcase_path, testcase_module_name):
    os.chdir("./tmp/chat-miner")
    os.environ['PYTHONPATH'] = os.getcwd()
    os.system("python3 " + testcase_path)
    os.chdir("../..")
    os.environ['PYTHONPATH'] = os.getcwd()

#     replace __main__ with the module name
    with open("./output/testcase_execution.log", "r") as f:
        lines = f.readlines()
    with open("./output/testcase_execution.log", "w") as f:
        for line in lines:
            if line.find("__main__") != -1:
                line = line.replace("__main__", testcase_module_name)
            f.write(line)

class Program:
    TEMP_DIR = "tmp"

    def __init__(self, input_dir, output_dir):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.graph = nx.DiGraph()

    def modify_py_file(self, root, file):
        print("Modiifying file: " + file)
        if not file.endswith(".py"):
            return
        file_path = os.path.join(root, file)
        with open(file_path, 'r') as f:
            module_name = file_path.replace(self.TEMP_DIR, "").replace("/", ".").replace(".py", "")
            # FIXME: very not robust
            module_name = module_name[1:]
            module_name = module_name[module_name.find("."):]
            code = f.read()
            tree = ast.parse(code)

            # Generate callgraph json
            eval = ast_extractor.Evaluator()
            eval.visit(tree)

            self.add_node_to_graph(module_name[1:], eval.ctx.context)

            jsonname = file.split(".")[0] + '.json'

            with open(os.path.join(self.output_dir, jsonname), 'w+') as f:
                json.dump(eval.ctx.context, f, indent=4)

            # Inject print statements
            injector = ast_extractor.Injector(self.output_dir)
            injector.visit(tree)

        with open(os.path.join(root, file), 'w') as f:
            f.write("import sys\n")
            f.write(ast.unparse(tree))

    def add_node_to_graph(self, module_name, context):
        for key, value in context.items():
            if key == "global_funcs":
                for func_name, _ in value.items():
                    node_name = module_name + "::" + func_name
                    self.graph.add_node(node_name)
            elif key != "imports":
                for method_name, _ in value.items():
                    node_name = module_name + "::" + key + "." + method_name
                    self.graph.add_node(node_name)

    def run(self):
        remove_then_create_new_dir(self.output_dir)
        remove_then_create_new_dir(Program.TEMP_DIR)

        copy_tree(self.input_dir, self.TEMP_DIR)

        for root, dirs, files in os.walk(self.TEMP_DIR):
            for file in files:
                self.modify_py_file(root, file)
    def visualize(self):
        plt.subplots(figsize=(20, 20))
        nx.draw_networkx(self.graph, pos=nx.spring_layout(self.graph, k=0.2, seed=4572321), node_size=100,
                         edge_color="gainsboro", alpha=0.8)
        plt.show()


if __name__ == '__main__':
    # get command line arguments
    # get -o for output file
    # get -i for input file

    testcase = "test/test_parsers.py"

    # turn path to module name
    testcase_mname = testcase.replace("/", ".").replace(".py", "")

    if len(sys.argv) != 5:
        print("Usage: python3 main.py -i <dir> -o <dir>")
        sys.exit(1)
    program = Program(sys.argv[2], sys.argv[4])
    program.run()

    # print("Visiualizing callgraph")
    # program.visualize()

    data = nx.node_link_data(program.graph)
    with open("./output/graph.json", "w+") as f:
        json.dump(data, f)

    run_testcases(testcase, testcase_mname)


    # best fit testcase name to graph.json
    with open("./output/graph.json", "r") as f:
        data = json.load(f)
        for node in data["nodes"]:
            if node["id"].find(testcase_mname)  != -1:
                testcase_mname = node["id"]

    model.generate_graph(testcase_mname.split("::")[0] + "::entry_point")
