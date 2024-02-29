import os

import matplotlib.pyplot as plt
import networkx as nx
import json


def draw(graph):
    fig, ax = plt.subplots(figsize=(20, 15))
    print(graph)
    centrality = nx.betweenness_centrality(graph, endpoints=True)

    # wirte back centrality to node
    nx.set_node_attributes(graph, centrality, "centrality")

    # pos = nx.spring_layout(graph, k=0.2, seed=4572321)
    # node_size = [v * 10000 for v in centrality.values()]
    # nx.draw_networkx(
    #     graph,
    #     pos=pos,
    #     with_labels=True,
    #     node_size=node_size,
    #     edge_color="gainsboro",
    #     alpha=0.8,
    # )
    # plt.show()


class Module:
    def __init__(self):
        self.classes = {}
        self.imports = {}
        self.global_funcs = {}


class Py_Class:
    def __init__(self):
        self.methods = {}


def generate_graph(main_module):
    print("model.py", os.getcwd())
    graph = nx.DiGraph()
    # open log from output folder
    with open("./output/testcase_execution.log", "r") as f:
        stack = [main_module]

        time_stamp = 0

        for line in f:
            line = line.strip()
            class_type, op_type, function_info = line.split(" ")
            mod_name, func_name = function_info.split("::")
            # A -> B -> C C -> B

            if op_type == "push":
                # if edge already exists, increment weight
                if graph.has_edge(stack[-1], function_info):
                    graph[stack[-1]][function_info]["weight"] += 1
                else:
                    graph.add_edge(stack[-1], function_info, weight=1, time=time_stamp)
                stack.append(function_info)
            else:
                stack.pop()
                # if edge already exists, increment weight
                if graph.has_edge(function_info, stack[-1]):
                    graph[function_info][stack[-1]]["weight"] += 1
                else:
                    graph.add_edge(function_info, stack[-1], weight=1, time=time_stamp)
            time_stamp += 1

    draw(graph)

    with open("./output/testcase_execution.json", "w+") as f:
        json.dump(nx.readwrite.json_graph.node_link_data(graph), f, indent=4)
