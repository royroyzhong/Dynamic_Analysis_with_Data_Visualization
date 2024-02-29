import ast

CLASSNAME_GLOBAL = 'global_funcs'
KEYWORD_IMPORTS = 'imports'


class NodeContext:
    def __init__(self):
        self.context = {"global_funcs": {}, "imports": {}}
        self.scope = None
        self.calls = []


class Evaluator(ast.NodeVisitor):
    def __init__(self):
        self.ctx = NodeContext()
        self.buffer = None
        self.current_class = CLASSNAME_GLOBAL

    def visit_ClassDef(self, node):
        self.ctx.context[node.name] = {}
        self.current_class = node.name
        for child in node.body:
            self.visit(child)
        self.current_class = CLASSNAME_GLOBAL

    def visit_Call(self, node):
        if self.buffer is None:
            self.buffer = ''
        self.visit(node.func)
        if self.ctx.scope is not None and self.buffer is not None:
            self.ctx.context[self.current_class][self.ctx.scope].append(self.buffer + ' line:' + str(node.lineno))
        self.buffer = None

    # record the func expression
    def visit_Name(self, node):
        if self.buffer is None:
            return
        self.buffer += node.id

    def visit_Attribute(self, node):
        if self.buffer is None:
            self.generic_visit(node)
        self.visit(node.value)
        if self.buffer is None:
            return
        self.buffer += '.' + node.attr

    def visit_FunctionDef(self, node):
        self.ctx.scope = node.name
        self.ctx.context[self.current_class][node.name] = []

        for c in node.body:
            self.visit(c)
        self.ctx.scope = None

    def visit_Import(self, node):
        for alias in node.names:
            self.ctx.context[KEYWORD_IMPORTS][alias.name] = alias.asname

    def visit_ImportFrom(self, node):
        self.ctx.context[KEYWORD_IMPORTS][node.module] = []
        for alias in node.names:
            self.ctx.context[KEYWORD_IMPORTS][node.module].append(alias.name)


class Injector(ast.NodeTransformer):

    def __init__(self, output_dir):
        self.is_inClass = False
        self.output_dir = "../../" + output_dir + "testcase_execution.log"

    def visit_ClassDef(self, node):
        self.is_inClass = True
        for child in node.body:
            self.visit(child)
        self.is_inClass = False
        return node

    def visit_FunctionDef(self, node):
        msg = None
        if self.is_inClass:
            
            msg = '"class_method push {0}::{1}.{2}\\n".format(__name__, self.__class__.__name__, sys._getframe().f_code.co_name)'
        else:
            msg = '"global_function push {0}::{1}\\n".format(__name__, sys._getframe().f_code.co_name)'

        inceptr = "with open('{1}', 'a+') as f_log: f_log.write({0})".format(msg, self.output_dir)

        print_node = ast.parse(inceptr)
        node.body.insert(0, print_node)

        # need a new list to store replaced node
        new_body = []
        for sub in node.body:
            new_body.append(self.visit(sub))
        node.body = new_body

        # insert call-stack pop at end of method call
        if self.is_inClass:
            msg = '"class_method pop {0}::{1}.{2}\\n".format(__name__, self.__class__.__name__, sys._getframe().f_code.co_name)'
        else:
            msg = '"global_function pop {0}::{1}\\n".format(__name__, sys._getframe().f_code.co_name)'

        inceptr = "with open('{1}', 'a') as f_log: f_log.write({0})".format(msg, self.output_dir)
        end_log_node = ast.parse(inceptr)
        end_log_node.body.append(ast.parse("return"))
        node.body.append(end_log_node)

        return node

    def visit_Return(self, node):
        msg = ""
        if self.is_inClass:
            msg = '"class_method pop {0}::{1}.{2}\\n".format(__name__, self.__class__.__name__, sys._getframe().f_code.co_name)'
        else:
            msg = '"global_function pop {0}::{1}\\n".format(__name__, sys._getframe().f_code.co_name)'
        inceptr = "with open('{1}', 'a+') as f_log: f_log.write({0})".format(msg, self.output_dir)
        print_node = ast.parse(inceptr)
        print_node.body.append(node)
        return print_node
