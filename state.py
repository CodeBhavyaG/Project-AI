from typing import Annotated, Literal
from typing_extensions import TypedDict
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages


class Intent(BaseModel):
    project_name : str
    features : list[str]

class Design(BaseModel):
    pages : list[str]
    entities : list[str]
    endpoints : list[str]

class entity(BaseModel):
    name : str
    components : list[str]

class UI(BaseModel):
    ui_schema : list[entity]

class endpoint(BaseModel):
    path : str
    method : Literal["/GET","/POST","/PUT","/PATCH","/DELETE"]

class API(BaseModel):
    endpoints : list[endpoint]

class Attribute(BaseModel):
    name: str = Field(description="Name of the column/attribute")
    type: str = Field(description="SQL data type (e.g. VARCHAR, UUID)")
    constraints: str = Field(description="Constraints like PRIMARY KEY, UNIQUE, NOT NULL", default="")

class table(BaseModel):
    name: str = Field(description="Name of the table")
    attributes : list[Attribute]

class DB(BaseModel):
    tables : list[table]

class error(BaseModel):
    type : str
    field : str
    message : str

class Validation(BaseModel):
    is_valid : bool
    errors : list[error]

class GeneratedFile(BaseModel):
    filepath: str = Field(description="Relative path of the file, e.g. 'server.js' or 'src/App.js'")
    content: str = Field(description="The complete code content of the file")

class Generation(BaseModel):
    files: list[GeneratedFile]

class State(TypedDict):
    query : Annotated[list,add_messages]
    intent : Intent | None
    design : Design | None
    ui : UI | None
    api : API | None
    db : DB | None
    validation : Validation | None
    generation : Generation | None
