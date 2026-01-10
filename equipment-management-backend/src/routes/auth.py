from flask import Blueprint, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from src.models.equipment import db
from src.models.user import User

auth_bp = Blueprint("auth_bp", __name__)

login_manager = LoginManager()
login_manager.session_protection = "strong"


@login_manager.user_loader
def load_user(user_id: str):
    try:
        return db.session.get(User, int(user_id))
    except Exception:
        return None


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"ok": False, "error": "missing-credentials"}), 400

    user = db.session.query(User).filter(User.username == username).first()
    if not user or not user.check_password(password):
        return jsonify({"ok": False, "error": "invalid-credentials"}), 401

    login_user(user)
    return jsonify(
        {
            "ok": True,
            "user": {
                "user_id": user.user_id,
                "username": user.username,
            },
        }
    )


@auth_bp.post("/logout")
def logout():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "error": "not-authenticated"}), 401

    logout_user()
    return jsonify({"ok": True})


@auth_bp.get("/me")
def me():
    if not current_user.is_authenticated:
        return jsonify({"ok": False, "authenticated": False}), 401

    return jsonify(
        {
            "ok": True,
            "authenticated": True,
            "user": {
                "user_id": current_user.user_id,
                "username": current_user.username,
            },
        }
    )