from py2neo import Node, Relationship
from datetime import datetime, timedelta
import pytz

BASE_SUBMISSIONS = 10

class User:
    def __init__(self, username, password):
        self.user = Node('User', username=username, password=password, dateJoined=datetime.now(pytz.utc), rating=0.0, submissionsLeft=BASE_SUBMISSIONS)
