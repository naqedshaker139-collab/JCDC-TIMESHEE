from flask_login import UserMixin
from werkzeug.security import generate_password_hash
from src.models.equipment import db  # reuse existing db instance

class User(UserMixin, db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=True)  # e.g. 'admin', 'engineer'

    # Flask-Login expects .id property
    @property
    def id(self):
        return self.user_id

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
        }