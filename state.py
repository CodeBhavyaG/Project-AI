from typing import Annotated, Literal
from typing_extensions import TypedDict
from langgraph.graph.message import add_messages


class Intent(TypedDict):
    project_name : str
    features : list[str]

class Design(TypedDict):
    pages : list[str]
    entities : list[str]
    endpoints : list[str]

class entity(TypedDict):
    name : str
    components : list[str]

class UI(TypedDict):
    ui_schema : list[entity]

class endpoint(TypedDict):
    path : str
    method : Literal["/GET","/POST","/PUT","/PATCH","/DELETE"]

class API(TypedDict):
    endpoints : list[endpoint]

class table(TypedDict):
    attributes : list[str]

class DB(TypedDict):
    tables : list[table]

class error(TypedDict):
    type : str
    field : str
    message : str

class Validation(TypedDict):
    is_valid : bool
    errors : list[error]

class State(TypedDict):
    query : Annotated[list,add_messages]
    intent : Intent | None = None
    design : Design | None = None
    ui : UI | None = None
    api : API | None = None
    db : DB | None = None
    validation : Validation | None = None
