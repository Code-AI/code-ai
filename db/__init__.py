from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

def init_db_engine(connect_str):
    engine = create_engine(connect_str, poolclass=NullPool)
    return engine



