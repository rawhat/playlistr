import rethinkdb as r
import tornado.gen

BASE_SUBMISSIONS = 10

r.set_loop_type('tornado')

class User:
    def __init__(self, username, password):
        self.username = username
        self.password = password

    @tornado.gen.coroutine
    def create(self):
        try:
            conn = yield r.connect('localhost', 28015)
            yield r.db('Playlistr').table('users').insert({
                'username': self.username,
                'password': self.password,
                'date_joined': r.now(),
                'rating': 0.0,
                'submissions_left': BASE_SUBMISSIONS
            }).run(conn)
            return True
        except:
            return False
