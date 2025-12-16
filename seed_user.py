import os

from main import app
from src.models.equipment import db
from src.models.user import User


def seed(username: str, password: str):
    with app.app_context():
        db.create_all()
        existing = db.session.query(User).filter(User.username == username).first()
        if existing:
            print(f"User '{username}' already exists: user_id={existing.user_id}")
            return

        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        print(f"Created user '{username}' with user_id={user.user_id}")


if __name__ == "__main__":
    username = os.getenv("ADMIN_USERNAME", "admin")
    password = os.getenv("ADMIN_PASSWORD", "change-this-password")
    seed(username, password)